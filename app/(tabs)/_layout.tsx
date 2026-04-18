import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_ITEMS: { name: string; label: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'index',       label: 'Dashboard',    icon: 'view-dashboard-outline', activeIcon: 'view-dashboard' },
  { name: 'devices',     label: 'Dispositivos', icon: 'devices',                activeIcon: 'devices' },
  { name: 'diagnostics', label: 'Diagnóstico',  icon: 'wifi-cog',               activeIcon: 'wifi-cog' },
  { name: 'speed',       label: 'Velocidade',   icon: 'speedometer-slow',       activeIcon: 'speedometer' },
  { name: 'security',    label: 'Segurança',    icon: 'shield-outline',         activeIcon: 'shield-check' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <View style={styles.iconWrapper}>
                {focused && <View style={styles.activeIndicator} />}
                <MaterialCommunityIcons
                  name={focused ? tab.activeIcon : tab.icon}
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(10,14,30,0.97)',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'android' ? 8 : 16,
    paddingTop: 8,
    height: Platform.OS === 'android' ? 60 : 72,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 2,
    backgroundColor: Colors.cyan,
    borderRadius: 2,
  },
});
