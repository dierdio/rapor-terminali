import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { timelineData } from './data/timelineData'
import type { Locale, TimelineFilter, TimelineMilestone } from './types'

const copy = {
  tr: { kicker: 'DİERDİO ARŞİVİ', title: 'MİNECRAFT\nTARİHÇESİ', intro: 'Bir blok dünyasının doğuşundan günümüzün yaşayan evrenine kadar.', search: 'Sürüm, özellik veya dönem ara...', all: 'Tümü', java: 'Java Edition', platforms: 'Bedrock & Konsol', updates: 'Büyük Güncellemeler', milestones: 'Tarihsel Olaylar', explore: 'Keşfet', selected: 'Seçili dönüm noktası', release: 'Çıkış tarihi', highlights: 'Öne çıkanlar', source: 'Minecraft Wiki kaynağı', close: 'Kapat', results: 'dönüm noktası', noResults: 'Bu filtrelerle eşleşen bir kayıt yok.', sound: 'Ses', timeline: 'ZAMAN ÇİZELGESİ' },
  en: { kicker: 'DIERDIO ARCHIVE', title: 'MINECRAFT\nHISTORY', intro: 'From the birth of a block world to the living universe of today.', search: 'Search version, feature or era...', all: 'All', java: 'Java Edition', platforms: 'Bedrock & Console', updates: 'Major Updates', milestones: 'Historical Events', explore: 'Explore', selected: 'Selected milestone', release: 'Release date', highlights: 'Highlights', source: 'Minecraft Wiki source', close: 'Close', results: 'milestones', noResults: 'No milestone matches these filters.', sound: 'Sound', timeline: 'TIMELINE' },
}

function playTone(kind: 'click' | 'open' | 'page', muted: boolean) {
  if (muted) return
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return
  const ctx = new AudioContextClass(); const osc = ctx.createOscillator(); const gain = ctx.createGain()
  const frequencies = kind === 'open' ? [392, 523, 659] : kind === 'page' ? [523, 440] : [280]
  osc.type = 'square'; osc.frequency.setValueAtTime(frequencies[0], ctx.currentTime)
  frequencies.slice(1).forEach((frequency, index) => osc.frequency.setValueAtTime(frequency, ctx.currentTime + (index + 1) * .07))
  gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .24)
  osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .25)
}

function App() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('mctimeline-locale') as Locale) || (navigator.language.startsWith('tr') ? 'tr' : 'en'))
  const [filter, setFilter] = useState<TimelineFilter>('all'); const [query, setQuery] = useState(''); const [selected, setSelected] = useState<TimelineMilestone | null>(null); const [muted, setMuted] = useState(() => localStorage.getItem('mctimeline-muted') === 'true')
  const scroller = useRef<HTMLDivElement>(null); const t = copy[locale]
  useEffect(() => { localStorage.setItem('mctimeline-locale', locale); document.documentElement.lang = locale }, [locale])
  useEffect(() => { localStorage.setItem('mctimeline-muted', String(muted)) }, [muted])
  const visible = useMemo(() => timelineData.filter((entry) => {
    const haystack = [entry.version, entry.era, ...entry.tags, entry.title.tr, entry.title.en, entry.summary.tr, entry.summary.en].join(' ').toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'java' && entry.category === 'java') || (filter === 'platforms' && entry.category === 'platform') || (filter === 'milestones' && entry.category === 'milestone') || (filter === 'updates' && entry.isMajor && (entry.era === 'modern' || entry.era === 'release'))
    return matchesQuery && matchesFilter
  }), [filter, query])
  const select = (entry: TimelineMilestone) => { setSelected(entry); playTone(entry.isMajor ? 'open' : 'click', muted) }
  const setFilterWithSound = (value: TimelineFilter) => { setFilter(value); playTone('click', muted) }
  const scroll = (direction: number) => { scroller.current?.scrollBy({ left: direction * 430, behavior: 'smooth' }); playTone('page', muted) }
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
  return <div className="app-shell">
    <div className="skyline" /><header className="topbar"><a className="brand" href="/">DIERDIO <span>/ MC TIMELINE</span></a><div className="controls"><button className="pixel-button sound" onClick={() => setMuted(!muted)} title={t.sound}>{muted ? '🔇' : '🔊'} <span>{t.sound}</span></button><button className="pixel-button" onClick={() => { const next = locale === 'tr' ? 'en' : 'tr'; setLocale(next); playTone('click', muted) }}>{locale === 'tr' ? 'Dil: TR' : 'Lang: EN'}</button></div></header>
    <main><section className="hero"><div className="hero-copy"><p className="eyebrow">{t.kicker} <span>◆</span> 2009—2026</p><h1>{t.title.split('\n').map((line) => <span key={line}>{line}</span>)}</h1><p className="hero-intro">{t.intro}</p><a className="pixel-button primary" href="#timeline" onClick={() => playTone('click', muted)}>{t.explore} <b>↓</b></a></div><div className="hero-block" aria-hidden="true"><div className="grass-top" /><div className="pixel-cloud cloud-a" /><div className="pixel-cloud cloud-b" /><div className="mountain" /><div className="sun" /><div className="tree"><i /><i /><i /><b /></div></div></section>
      <section className="toolbar" id="timeline"><div className="search-wrap"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></div><div className="filters">{(['all', 'java', 'platforms', 'updates', 'milestones'] as TimelineFilter[]).map((key) => <button className={`filter ${filter === key ? 'active' : ''}`} key={key} onClick={() => setFilterWithSound(key)}>{t[key]}</button>)}</div></section>
      <div className="timeline-heading"><div><p className="eyebrow">{t.timeline}</p><h2>{visible.length} <small>{t.results}</small></h2></div><div className="scroll-buttons"><button className="pixel-button" onClick={() => scroll(-1)}>←</button><button className="pixel-button" onClick={() => scroll(1)}>→</button></div></div>
      {visible.length ? <div className="timeline-scroll" ref={scroller}><div className="timeline-line" />{visible.map((entry, index) => <article className={`milestone ${entry.isMajor ? 'major' : ''} ${index % 2 ? 'lower' : ''}`} key={entry.id}><div className="node"><span>{entry.isMajor ? '◆' : '◇'}</span></div><div className="date-label">{formatDate(entry.date)}</div><button className="card" onClick={() => select(entry)}><div className={`block-icon era-${entry.era}`}><span>{entry.era === 'modern' ? '▦' : entry.era === 'cross-platform' ? '◈' : entry.era === 'release' ? '★' : '◆'}</span></div><div className="card-body"><div className="card-meta"><span>{entry.version}</span><span className="badge">{entry.category === 'java' ? 'JAVA' : entry.category === 'platform' ? 'PLATFORM' : 'MILESTONE'}</span></div><h3>{entry.title[locale]}</h3><p>{entry.summary[locale]}</p><div className="card-footer"><span>{entry.tags[0]}</span><b>↗</b></div></div></button></article>)}</div> : <div className="empty-state">{t.noResults}</div>}
      <footer><span>© DIERDIO ARCHIVE</span><span>Minecraft is a trademark of Mojang Studios.</span><span>{locale === 'tr' ? 'Veri kaynakları: Minecraft Wiki' : 'Sources: Minecraft Wiki'}</span></footer>
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><aside className="detail-panel" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label={t.close}>×</button><div className={`detail-art era-${selected.era}`}><div className="detail-sun" /><div className="detail-cube">◆</div><span>{selected.version}</span></div><div className="detail-content"><p className="eyebrow">{t.selected} · {selected.category.toUpperCase()}</p><h2>{selected.title[locale]}</h2><p className="detail-date">◷ {t.release}: <strong>{formatDate(selected.date)}</strong></p><p className="detail-summary">{selected.details[locale]}</p><h3>{t.highlights}</h3><ul>{selected.features.map((feature) => <li key={feature.en}> <span>✓</span>{feature[locale]}</li>)}</ul><a className="pixel-button primary" href={selected.sources[0]} target="_blank" rel="noreferrer">{t.source} ↗</a></div></aside></div>}
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
