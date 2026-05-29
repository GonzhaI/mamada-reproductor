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
      <Tabs.Screen name="library"  options={{ title: 'Library'  }} />
      <Tabs.Screen name="search"   options={{ title: 'Search'   }} />
      <Tabs.Screen name="queue"    options={{ title: 'Queue'    }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
