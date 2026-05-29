import { StyleSheet } from 'react-native'
import { colors } from './colors'

export const typography = StyleSheet.create({
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: colors.text,
    lineHeight: 18,
  },
  trackName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: colors.text,
    lineHeight: 16,
  },
  body: {
    fontFamily: 'VT323_400Regular',
    fontSize: 20,
    color: colors.text,
    lineHeight: 24,
  },
  meta: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.labelDark,
    lineHeight: 18,
  },
})
