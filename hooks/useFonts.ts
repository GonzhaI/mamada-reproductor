import { useFonts as useExpoFonts } from 'expo-font'
import {
  PressStart2P_400Regular,
} from '@expo-google-fonts/press-start-2p'
import {
  VT323_400Regular,
} from '@expo-google-fonts/vt323'

export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    PressStart2P_400Regular,
    VT323_400Regular,
  })

  return { fontsLoaded, fontError }
}
