// constants/design-system.ts
// MASTRO WORKSPACE — Design System v2.0 Ultra-Clean — IMMUTABILE

export const DS = {
  colors: {
    background: '#F7F8FA',
    backgroundAlt: '#F0F2F5',
    topbar: '#FFFFFF',
    teal: '#0A8A7A',
    tealDark: '#076B5E',
    tealHover: '#054F46',
    tealLight: '#E6F7F5',
    tealMid: '#B2E8E3',
    green: '#0F7B5A',
    greenLight: '#E6F5EE',
    red: '#C93535',
    redLight: '#FCEAEA',
    blue: '#2563EB',
    blueLight: '#EEF3FD',
    amber: '#B45309',
    amberLight: '#FEF3E2',
    purple: '#6D28D9',
    purpleLight: '#F0EBFC',
    rose: '#BE185D',
    roseLight: '#FDF0F6',
    textPrimary: '#0D1117',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    textDisabled: '#D1D5DB',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderFocus: '#0A8A7A',
    surface: '#FFFFFF',
    surfaceHover: '#F9FAFB',
    sidebarBg: '#FFFFFF',
    sidebarBorder: '#F0F2F5',
    sidebarActive: '#F0F7F6',
    sidebarActiveText: '#0A8A7A',
    sidebarText: '#6B7280',
    sidebarHover: '#F7F8FA',
  },
  fonts: {
    ui: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"DM Mono", "Fira Code", monospace',
    display: '"DM Sans", sans-serif',
  },
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    sm: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    lg: '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    xl: '0 24px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)',
  },
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
  },
} as const

export const STATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  attivo:        { bg: DS.colors.greenLight,  text: DS.colors.green,  border: '#B2D9C8' },
  completato:    { bg: DS.colors.greenLight,  text: DS.colors.green,  border: '#B2D9C8' },
  fatto:         { bg: DS.colors.greenLight,  text: DS.colors.green,  border: '#B2D9C8' },
  'in_corso':    { bg: DS.colors.blueLight,   text: DS.colors.blue,   border: '#BFCFEE' },
  'in corso':    { bg: DS.colors.blueLight,   text: DS.colors.blue,   border: '#BFCFEE' },
  aperto:        { bg: DS.colors.blueLight,   text: DS.colors.blue,   border: '#BFCFEE' },
  pausa:         { bg: DS.colors.amberLight,  text: DS.colors.amber,  border: '#E8C99A' },
  bloccato:      { bg: DS.colors.amberLight,  text: DS.colors.amber,  border: '#E8C99A' },
  urgente:       { bg: DS.colors.redLight,    text: DS.colors.red,    border: '#F0BEBE' },
  alta:          { bg: DS.colors.redLight,    text: DS.colors.red,    border: '#F0BEBE' },
  pianificato:   { bg: DS.colors.purpleLight, text: DS.colors.purple, border: '#D4C5F5' },
  beta:          { bg: DS.colors.tealLight,   text: DS.colors.teal,   border: DS.colors.tealMid },
  lancio:        { bg: DS.colors.tealLight,   text: DS.colors.teal,   border: DS.colors.tealMid },
  sviluppo:      { bg: DS.colors.blueLight,   text: DS.colors.blue,   border: '#BFCFEE' },
  archiviato:    { bg: DS.colors.borderLight, text: DS.colors.textMuted, border: DS.colors.border },
}

export const LOG_TYPE_CONFIG = {
  decisione: { icon: 'D', label: 'Decisione', color: DS.colors.blue,   bg: DS.colors.blueLight },
  nota:      { icon: 'N', label: 'Nota',      color: DS.colors.textSecondary, bg: DS.colors.borderLight },
  milestone: { icon: 'M', label: 'Milestone', color: DS.colors.green,  bg: DS.colors.greenLight },
  problema:  { icon: 'P', label: 'Problema',  color: DS.colors.red,    bg: DS.colors.redLight },
  meeting:   { icon: 'R', label: 'Meeting',   color: DS.colors.purple, bg: DS.colors.purpleLight },
} as const

// SVG icons — no emoji, no external deps
export const ICONS = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
  projects:  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4.5C2 3.12 3.12 2 4.5 2h7C12.88 2 14 3.12 14 4.5v7C14 12.88 12.88 14 11.5 14h-7C3.12 14 2 12.88 2 11.5v-7z" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 8h5M5.5 5.5h5M5.5 10.5h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  tasks:     `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  campaigns: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 10V6l10-4v12L2 10zm0 0h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  clients:   `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10.5 7.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  mrr:       `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12l3.5-4 3 2.5L12 5l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ideas:     `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.5V11H6v-1.5C4.8 8.8 4 7.5 4 6a4 4 0 014-4z" stroke="currentColor" stroke-width="1.5"/><path d="M6 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  finance:   `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M8 8v.01M5.5 10.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  personal:  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  chevron:   `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  plus:      `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  close:     `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
} as const

