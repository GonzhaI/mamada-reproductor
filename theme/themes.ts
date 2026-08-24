export interface ThemeColors {
  bg: string
  surface: string
  surfaceAlt: string
  label: string
  labelDark: string
  reel: string
  tape: string
  text: string
  textMuted: string
  accent: string
  eqBar: string
  border: string
  black: string
}

export type ThemeName = 'tierra' | 'arena' | 'neon'

export const themes: Record<ThemeName, ThemeColors> = {
  tierra: {
    bg:        '#1A1209',
    surface:   '#2E1F0E',
    surfaceAlt: '#3D2B10',
    label:     '#C49A4A',
    labelDark: '#8B6914',
    reel:      '#3D2B10',
    tape:      '#7A5C2E',
    text:      '#E8C97A',
    textMuted: '#A08040',
    accent:    '#D4832A',
    eqBar:     '#C49A4A',
    border:    '#4A3520',
    black:     '#0D0802',
  },

  arena: {
    bg:        '#EAE0C8',
    surface:   '#F6EDD4',
    surfaceAlt: '#DCCB9C',
    label:     '#C49A4A',
    labelDark: '#8B6914',
    reel:      '#C9B27C',
    tape:      '#A08040',
    text:      '#4A3A1F',
    textMuted: '#8A7450',
    accent:    '#B5651D',
    eqBar:     '#8B6914',
    border:    '#C2B089',
    black:     '#3A2E18',
  },

  neon: {
    bg:        '#0B0B14',
    surface:   '#17172A',
    surfaceAlt: '#23234A',
    label:     '#2E2E5E',
    labelDark: '#7A6CFF',
    reel:      '#1B1B3A',
    tape:      '#4A4A8A',
    text:      '#E8E8FF',
    textMuted: '#8A8AC0',
    accent:    '#00E5A0',
    eqBar:     '#00E5A0',
    border:    '#3A3A6A',
    black:     '#07070D',
  },
}
