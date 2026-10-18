-- ============================================================
-- ASELGET — Topluluk Yönetim Sistemi Kurulum Scripti
-- ============================================================
-- ÇALIŞTIRILACAK YER: Supabase Dashboard > SQL Editor
-- HANGİ PROJE: kritr/controllin'in kullandığı proje
--              (poxifowrycsxkhduzshx.supabase.co)
--
-- Bu script: tablolar, RLS politikaları, güvenlik tetikleyicileri
-- ve ilk admin atama mekanizmasını kurar. Tekrar çalıştırılabilir.
--
-- İLK ADMİN: Kayıt olan İLK KİŞİ otomatik olarak admin olur.
-- (Yani sen kayıt ol → admin rolünü otomatik alırsın.)
-- ============================================================

-- ---------- 1) PROFİLLER (üyeler) ----------
create table if not exists public.aselget_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  isim text not null default '',
  rol text not null default 'uye' check (rol in ('admin','uye')),
  sinif text not null default '',
  discord text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- 2) DERSLER ----------
create table if not exists public.aselget_dersler (
  id bigint generated always as identity primary key,
  baslik text not null,
  aciklama text not null default '',
  egitmen text not null default '',
  ders_tarihi timestamptz not null,
  olusturan uuid references public.aselget_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- 3) YOKLAMA ----------
create table if not exists public.aselget_yoklama (
  id bigint generated always as identity primary key,
  ders_id bigint not null references public.aselget_dersler(id) on delete cascade,
  uye_id uuid not null references public.aselget_profiles(id) on delete cascade,
  durum text not null default 'gelmedi' check (durum in ('geldi','gelmedi','mazeretli')),
  kaydeden uuid references public.aselget_profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (ders_id, uye_id)
);

-- ---------- 4) DUYURULAR ----------
create table if not exists public.aselget_duyurular (
  id bigint generated always as identity primary key,
  baslik text not null,
  icerik text not null default '',
  onemli boolean not null default false,
  olusturan uuid references public.aselget_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- YARDIMCI FONKSİYONLAR (güvenlik)
-- ============================================================

-- Oturum açan kişi admin mi? (RLS içinden güvenli çağrı için security definer)
create or replace function public.is_aselget_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.aselget_profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- İlk kayıt olan kişi otomatik admin olur
create or replace function public.aselget_ilk_admin()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.aselget_profiles where rol = 'admin') then
    new.rol := 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists aselget_ilk_admin_trigger on public.aselget_profiles;
create trigger aselget_ilk_admin_trigger
  before insert on public.aselget_profiles
  for each row execute function public.aselget_ilk_admin();

-- Üyeler kendi rollerini yükseltemez (yalnızca admin rol değiştirebilir)
create or replace function public.aselget_rol_guard()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.rol is distinct from old.rol and not public.is_aselget_admin() then
    raise exception 'ASELGET: Rol değiştirme yetkiniz yok.';
  end if;
  return new;
end;
$$;

drop trigger if exists aselget_rol_guard_trigger on public.aselget_profiles;
create trigger aselget_rol_guard_trigger
  before update on public.aselget_profiles
  for each row execute function public.aselget_rol_guard();

-- yoklama.updated_at otomatik güncellensin
create extension if not exists moddatetime;
drop trigger if exists aselget_yoklama_updated on public.aselget_yoklama;
create trigger aselget_yoklama_updated
  before update on public.aselget_yoklama
  for each row execute procedure moddatetime (updated_at);

-- ============================================================
-- RLS (SATIR GÜVENLİĞİ)
-- ============================================================
alter table public.aselget_profiles  enable row level security;
alter table public.aselget_dersler   enable row level security;
alter table public.aselget_yoklama   enable row level security;
alter table public.aselget_duyurular enable row level security;

-- ---------- PROFİLLER ----------
drop policy if exists "aselget_profil_okuma" on public.aselget_profiles;
create policy "aselget_profil_okuma"
  on public.aselget_profiles for select
  to authenticated using (true);

drop policy if exists "aselget_profil_kendi_ekler" on public.aselget_profiles;
create policy "aselget_profil_kendi_ekler"
  on public.aselget_profiles for insert
  to authenticated with check (auth.uid() = id);

drop policy if exists "aselget_profil_kendi_duzenler" on public.aselget_profiles;
create policy "aselget_profil_kendi_duzenler"
  on public.aselget_profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "aselget_profil_admin_duzenler" on public.aselget_profiles;
create policy "aselget_profil_admin_duzenler"
  on public.aselget_profiles for update
  to authenticated using (public.is_aselget_admin()) with check (true);

-- ---------- DERSLER ----------
drop policy if exists "aselget_ders_okuma" on public.aselget_dersler;
create policy "aselget_ders_okuma"
  on public.aselget_dersler for select
  to authenticated using (true);

drop policy if exists "aselget_ders_yazma" on public.aselget_dersler;
create policy "aselget_ders_yazma"
  on public.aselget_dersler for all
  to authenticated using (public.is_aselget_admin()) with check (public.is_aselget_admin());

-- ---------- YOKLAMA ----------
drop policy if exists "aselget_yoklama_okuma" on public.aselget_yoklama;
create policy "aselget_yoklama_okuma"
  on public.aselget_yoklama for select
  to authenticated using (true);

drop policy if exists "aselget_yoklama_yazma" on public.aselget_yoklama;
create policy "aselget_yoklama_yazma"
  on public.aselget_yoklama for all
  to authenticated using (public.is_aselget_admin()) with check (public.is_aselget_admin());

-- ---------- DUYURULAR ----------
drop policy if exists "aselget_duyuru_okuma" on public.aselget_duyurular;
create policy "aselget_duyuru_okuma"
  on public.aselget_duyurular for select
  to authenticated using (true);

drop policy if exists "aselget_duyuru_yazma" on public.aselget_duyurular;
create policy "aselget_duyuru_yazma"
  on public.aselget_duyurular for all
  to authenticated using (public.is_aselget_admin()) with check (public.is_aselget_admin());

-- ============================================================
-- BİTTİ. Artık:
--  1) /aselget/ adresine git
--  2) "Kayıt Ol" ile hesap oluştur (ilk kayıt = otomatik admin)
--  3) Panel'den ders eklemeye başla
-- ============================================================
