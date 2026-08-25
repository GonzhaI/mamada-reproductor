import { Tabs } from 'expo-router'
import { TabBar } from '@/components/TabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Player'   }} />
      <Tabs.Screen name="library"  options={{ title: 'Music'    }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
