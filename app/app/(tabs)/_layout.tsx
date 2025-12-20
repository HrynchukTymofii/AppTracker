import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Home, Shield, Sparkles, BarChart3, User, Square, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '@/context/TourContext';
import { TourTooltip } from '@/components/Tour/TourTooltip';
import { TOUR_STEPS, TOTAL_TOUR_STEPS, getTourStepInfo } from '@/constants/tourSteps';
import { useDetox } from '@/context/DetoxContext';
import { useTranslation } from 'react-i18next';

// Custom Detox Button Component
const DetoxButton = ({ children, onPress, isDark }: any) => {
  const pathname = usePathname();
  const { isActive, stopDetox, startDetox } = useDetox();

  // Check if we're on the detox page
  const isOnDetoxPage = pathname.includes('/detox');

  const handlePress = () => {
    if (isOnDetoxPage) {
      // If on detox page, control the timer
      if (isActive) {
        stopDetox();
      } else {
        startDetox();
      }
    } else {
      // If not on detox page, just navigate
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isOnDetoxPage && isActive ? '#ef4444' : isDark ? '#ffffff' : '#111827',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.35,
          shadowRadius: 30,
          elevation: 15,
          borderWidth: 1.5,
          borderColor: isOnDetoxPage && isActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.3)',
          borderTopColor: isOnDetoxPage && isActive ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.5)',
          borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {isOnDetoxPage ? (
          isActive ? (
            <Square size={32} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={32} color={isDark ? '#111827' : '#ffffff'} fill={isDark ? '#111827' : '#ffffff'} />
          )
        ) : (
          children
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Tour
  const { tourActive, currentStep, setCurrentStep, endTour, skipTour } = useTour();

  const handleTourNext = () => {
    if (currentStep === TOTAL_TOUR_STEPS - 1) {
      endTour();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleTourPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const testsInfo = getTourStepInfo(TOUR_STEPS.TESTS_TAB);
  const courseInfo = getTourStepInfo(TOUR_STEPS.COURSE_TAB);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#ffffff' : '#111827',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={[
            styles.tabBarBackground,
            {
              backgroundColor: isDark ? '#000000' : '#ffffff',
            }
          ]} />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 66 + insets.bottom,
          borderTopWidth: 1.5,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          paddingTop: 4,
          paddingBottom: insets.bottom || 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }
            ]}>
              <Home
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="blocking/index"
        options={{
          title: t('tabs.blocking'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }
            ]}>
              <Shield
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="detox/index"
        options={{
          title: t('tabs.detox'),
          tabBarButton: (props) => <DetoxButton {...props} isDark={isDark} />,
          tabBarIcon: ({ focused }) => (
            <Sparkles
              size={32}
              color={isDark ? '#111827' : '#ffffff'}
              strokeWidth={focused ? 2.5 : 2}
              fill={isDark ? '#111827' : '#ffffff'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats/index"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }
            ]}>
              <BarChart3
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }
            ]}>
              <User
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarBackground: {
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


// import { Tabs } from 'expo-router';
// import React from 'react';
// import { View, StyleSheet } from 'react-native';
// import { HapticTab } from '@/components/HapticTab';
// import { IconSymbol } from '@/components/ui/IconSymbol';
// import { useColorScheme } from '@/hooks/useColorScheme';

// export default function TabLayout() {
//   const colorScheme = useColorScheme();

//   const tabBarBackgroundColor =
//     colorScheme === 'dark'
//       ? 'rgba(15,23,42,0.92)' // dark slate
//       : 'rgba(255,255,255,0.92)'; // light semi-transparent

//   const activeIconColor = '#22d3ee'; // bright teal-blue
//   const inactiveIconColor = '#94a3b8'; // soft gray

//   return (
//     <Tabs
//       initialRouteName="index"
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: activeIconColor,
//         tabBarInactiveTintColor: inactiveIconColor,
//         tabBarButton: HapticTab,
//         tabBarBackground: () => (
//           <View style={[styles.tabBarBackground, { backgroundColor: tabBarBackgroundColor }]} />
//         ),
//         tabBarStyle: {
//           position: 'absolute',
//           bottom: 0,
//           left: 16,
//           right: 16,
//           height: 105,
//           borderRadius: 20,
//           elevation: 5,
//           shadowColor: '#000',
//           shadowOffset: { width: 0, height: 5 },
//           shadowOpacity: 0.15,
//           shadowRadius: 10,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="tests/index"
//         options={{
//           title: 'Tests',
//           tabBarIcon: ({ color }) => <IconSymbol size={26} name="checkmark.circle.fill" color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="course/index"
//         options={{
//           title: 'Course',
//           tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="profile/index"
//         options={{
//           title: 'Profile',
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
//         }}
//       />
//     </Tabs>
//   );
// }

// const styles = StyleSheet.create({
//   tabBarBackground: {
//     flex: 1,
//     borderTopEndRadius: 20,
//     borderTopStartRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 5,
//   },
// });
