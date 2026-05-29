import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reproductor</Text>
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
  },
  text: {
    color: '#E8C97A',
    fontSize: 16,
  },
})
