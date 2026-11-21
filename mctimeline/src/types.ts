export type Locale = 'tr' | 'en'

export type TimelineFilter = 'all' | 'java' | 'platforms' | 'milestones'

export type Era = 'pre-classic' | 'classic' | 'indev' | 'infdev' | 'alpha' | 'beta'

export type TimelineCategory = 'java' | 'platform' | 'milestone'

export interface LocalizedText {
  tr: string
  en: string
}

export interface TimelineMedia {
  type: 'screenshot' | 'icon' | 'texture'
  src: string
  alt: LocalizedText
  credit?: string
}

export interface TimelineMilestone {
  id: string
  date: string
  datePrecision: 'day' | 'month' | 'year'
  version: string
  era: Era
  category: TimelineCategory
  title: LocalizedText
  summary: LocalizedText
  details: LocalizedText
  features: LocalizedText[]
  tags: string[]
  media?: TimelineMedia
  sources: string[]
}
