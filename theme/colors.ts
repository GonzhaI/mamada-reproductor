export { themes } from './themes'
export type { ThemeColors, ThemeName } from './themes'

import { themes } from './themes'
import type { ThemeColors } from './themes'

// Re-export de la paleta por defecto (tierra) para compatibilidad con módulos
// que no viven dentro del árbol de React (ej. constantes a nivel módulo).
export const colors: ThemeColors = themes.tierra
