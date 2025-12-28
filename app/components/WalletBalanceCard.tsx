import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, Dumbbell, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEarnedTime } from '@/context/EarnedTimeContext';
import { useRouter } from 'expo-router';

interface WalletBalanceCardProps {
  isDark: boolean;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ isDark }) => {
  const router = useRouter();
  const { wallet, getTodayEarned } = useEarnedTime();

  const todayEarned = getTodayEarned();

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/lockin')}
      activeOpacity={0.8}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          overflow: 'hidden',
          marginRight: 14,
        }}
      >
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={24} color="#ffffff" />
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 2,
          }}
        >
          Screen Time Balance
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#3b82f6',
            }}
          >
            {wallet.availableMinutes.toFixed(1)}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: isDark ? '#6b7280' : '#9ca3af',
              marginLeft: 4,
            }}
          >
            min
          </Text>
          {todayEarned > 0 && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#10b981',
                marginLeft: 8,
              }}
            >
              +{todayEarned.toFixed(1)} today
            </Text>
          )}
        </View>
      </View>

      {/* Earn More Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
        }}
      >
        <Dumbbell size={16} color="#10b981" />
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#10b981',
            marginLeft: 6,
          }}
        >
          Earn
        </Text>
        <ChevronRight size={16} color="#10b981" style={{ marginLeft: 2 }} />
      </View>
    </TouchableOpacity>
  );
};

export default WalletBalanceCard;
