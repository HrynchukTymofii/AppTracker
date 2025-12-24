import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticTab } from '@/components/HapticTab';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Home, Shield, BarChart3, User, Crosshair } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Custom LockIn Button Component (big center button with target icon)
const LockInButton = ({ onPress, accessibilityState, isDark }: any) => {
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -12,
          overflow: 'hidden',
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <Crosshair
          size={26}
          color="#ffffff"
          strokeWidth={2.5}
        />
      </View>
      <Text
        style={{
          marginTop: 6,
          fontSize: 10,
          fontWeight: '700',
          color: focused ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'),
          letterSpacing: 0.2,
        }}
      >
        LockIn
      </Text>
    </TouchableOpacity>
  );
};

// Tab Icon Component for consistent styling
const TabIcon = ({
  Icon,
  color,
  focused,
  isDark
}: {
  Icon: any;
  color: string;
  focused: boolean;
  isDark: boolean;
}) => (
  <View
    style={{
      width: 44,
      height: 32,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused
        ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
        : 'transparent',
    }}
  >
    <Icon
      size={22}
      color={focused ? '#3b82f6' : color}
      strokeWidth={focused ? 2.2 : 1.8}
    />
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8',
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={[
            styles.tabBarBackground,
            {
              backgroundColor: isDark ? '#000000' : '#ffffff',
              borderTopWidth: 0.5,
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }
          ]} />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom || 12,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.15 : 0.06,
          shadowRadius: 20,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Home} color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="blocking/index"
        options={{
          title: t('tabs.blocking'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Shield} color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="lockin/index"
        options={{
          title: '',
          tabBarButton: (props) => (
            <LockInButton
              {...props}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats/index"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={BarChart3} color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={User} color={color} focused={focused} isDark={isDark} />
          ),
        }}
      />
      {/* Hidden screens - accessible via router but not shown in tab bar */}
      <Tabs.Screen
        name="detox/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="schedule/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="community/index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
