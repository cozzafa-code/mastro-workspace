// constants/design-system.ts
// MASTRO WORKSPACE — Design System Teal v1.0 — IMMUTABILE

export const DS = {
  colors: {
    background: '#F8FAFC',
    topbar: '#0B1F2A',
    teal: '#14B8A6',
    tealDark: '#0F766E',
    tealHover: '#115E59',
    tealLight: '#CCFBF1',
    green: '#1A9E73',
    greenLight: '#D1FAE5',
    red: '#DC4444',
    redLight: '#FEE2E2',
    blue: '#3B7FE0',
    blueLight: '#DBEAFE',
    amber: '#D08008',
    amberLight: '#FEF3C7',
    purple: '#7C3AED',
    purpleLight: '#EDE9FE',
    rose: '#E11D48',
    roseLight: '#FFE4E6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    surface: '#FFFFFF',
  },
  fonts: {
    ui: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.12)',
  },
} as const

// Badge colori per stato
export const STATE_COLORS: Record<string, { bg: string; text: string }> = {
  attivo:      { bg: DS.colors.greenLight,  text: DS.colors.green },
  completato:  { bg: DS.colors.greenLight,  text: DS.colors.green },
  fatto:       { bg: DS.colors.greenLight,  text: DS.colors.green },
  'in_corso':  { bg: DS.colors.blueLight,   text: DS.colors.blue },
  'in corso':  { bg: DS.colors.blueLight,   text: DS.colors.blue },
  aperto:      { bg: DS.colors.blueLight,   text: DS.colors.blue },
  pausa:       { bg: DS.colors.amberLight,  text: DS.colors.amber },
  bloccato:    { bg: DS.colors.amberLight,  text: DS.colors.amber },
  urgente:     { bg: DS.colors.redLight,    text: DS.colors.red },
  alta:        { bg: DS.colors.redLight,    text: DS.colors.red },
  pianificato: { bg: DS.colors.purpleLight, text: DS.colors.purple },
  beta:        { bg: DS.colors.tealLight,   text: DS.colors.tealDark },
  lancio:      { bg: DS.colors.tealLight,   text: DS.colors.tealDark },
  sviluppo:    { bg: DS.colors.blueLight,   text: DS.colors.blue },
}

export const LOG_TYPE_CONFIG = {
  decisione: { icon: '⚖️', label: 'Decisione', color: DS.colors.blue,   bg: DS.colors.blueLight },
  nota:      { icon: '📝', label: 'Nota',      color: DS.colors.textSecondary, bg: DS.colors.borderLight },
  milestone: { icon: '🏁', label: 'Milestone', color: DS.colors.green,  bg: DS.colors.greenLight },
  problema:  { icon: '⚠️', label: 'Problema',  color: DS.colors.red,    bg: DS.colors.redLight },
  meeting:   { icon: '🤝', label: 'Meeting',   color: DS.colors.purple, bg: DS.colors.purpleLight },
} as const
