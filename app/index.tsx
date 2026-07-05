import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '@/hooks/useAuth'

export default function Index() {
  const { logout } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reproductor</Text>
      <Pressable onPress={logout}>
        <Text style={styles.logout}>cerrar sesión</Text>
      </Pressable>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1209',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: '#E8C97A',
    fontSize: 16,
  },
  logout: {
    color: '#A08040',
    fontSize: 12,
  },
})
