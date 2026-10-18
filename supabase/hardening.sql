-- ============================================================
-- dierdio-portfolyo — Supabase Sertleştirme Scripti
-- ============================================================
-- Bu script SUPABASE SQL EDITOR'ünde (Dashboard > SQL Editor)
-- çalıştırılır. Veri SİLMEZ veya DEĞİŞTİRMEZ, sadece ek yapılandırma
-- ekler. Çalıştırmasanız bile uygulama çalışmaya devam eder.
--
-- İÇİNDEKİLER:
--   1) rapor-gorselleri storage bucket'ı (görseller DB yerine
--      Storage'a yazılsın diye — kod tarafı otomatik algılar)
--   2) Bucket politikaları (authenticated yükler, herkes okur)
--
-- NOT: Bu scripti "terminal" projesinin Supabase'inde çalıştırın
-- (bwajmlxxmxamwneyebax — terminal/app.js içindeki SUPABASE_URL).
-- ============================================================

-- ---------- 1) Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('rapor-gorselleri', 'rapor-gorselleri', true)
on conflict (id) do nothing;

-- ---------- 2) Bucket politikaları ----------
-- Tekrar çalıştırmaya dayanıklı olması için önce varsa düşürülür.

drop policy if exists "gorseller_herkese_okunur" on storage.objects;
create policy "gorseller_herkese_okunur"
  on storage.objects for select
  using (bucket_id = 'rapor-gorselleri');

drop policy if exists "gorseller_giris_yapan_yukler" on storage.objects;
create policy "gorseller_giris_yapan_yukler"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'rapor-gorselleri');

drop policy if exists "gorseller_sahibi_siler" on storage.objects;
create policy "gorseller_sahibi_siler"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'rapor-gorselleri' and owner = auth.uid());

-- ============================================================
-- OPSİYONEL — RLS SERTLEŞTİRME (dikkatli okuyun)
-- ============================================================
-- terminal uygulaması, kullanıcı adı ile girişte `profiles` tablosunu
-- ANON anahtarla sorgular (login.js: kullanıcı adı -> e-posta eşleme)
-- ve oturum açan herkes tüm personel listesini görebilir (app.js).
-- Bu davranışı korumak için aşağıdaki politikalar BİLGİLANDIRMA amaçlı
-- yorumlanmıştır. Etkinleştirirseniz login.js'deki kullanıcı adı
-- eşlemesini bir RPC fonksiyonuna taşımanız GEREKİR — aksi halde
-- kullanıcı adı ile giriş ÇALIŞMAZ.
--
-- Örnek yaklaşım (etkinleştirmeden önce test edin):
--
--   create or replace function public.profile_var_mi(p_username text)
--   returns boolean
--   language sql security definer set search_path = public as $$
--     select exists (select 1 from profiles where username = p_username);
--   $$;
--
--   grant execute on function public.profile_var_mi(text) to anon;
--
--   -- Ardından login.js: .from('profiles').select('id,username').eq(...)
--   -- yerine: .rpc('profile_var_mi', { p_username: usernameInput })
--
--   -- ve profiles için anon okumayı kapatın:
--   -- revoke select on profiles from anon;
-- ============================================================
