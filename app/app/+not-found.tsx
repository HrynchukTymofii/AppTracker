// app/+not-found.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Compass, Home, ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NotFound() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      {/* Hero Icon */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        <Compass size={56} color="#8b5cf6" />
      </View>

      {/* 404 Text */}
      <Text
        style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          position: 'absolute',
          top: '20%',
        }}
      >
        404
      </Text>

      {/* Main Title */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#111827',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        Looks like you're lost
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          fontSize: 16,
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 8,
          paddingHorizontal: 20,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: isDark ? '#6b7280' : '#9ca3af',
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        Don't worry, it happens to the best of us.
      </Text>

      {/* Action Buttons */}
      <View style={{ gap: 12, width: '100%', maxWidth: 300 }}>
        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={{
            backgroundColor: '#8b5cf6',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            shadowColor: '#8b5cf6',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
          activeOpacity={0.8}
        >
          <Home size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text
            style={{
              color: '#ffffff',
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            Go Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: isDark ? '#9ca3af' : '#6b7280',
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* Decorative Elements */}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#8b5cf6',
            marginHorizontal: 4,
            opacity: 0.3,
          }}
        />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#8b5cf6',
            marginHorizontal: 4,
            opacity: 0.5,
          }}
        />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#8b5cf6',
            marginHorizontal: 4,
            opacity: 0.7,
          }}
        />
      </View>
    </View>
  );
}
