import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Smartphone,
  Share2,
  X,
  Sparkles,
} from "lucide-react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { WeekComparisonData } from "@/lib/usageTracking";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ShareCardProps {
  comparison: WeekComparisonData;
  onClose: () => void;
  isDark: boolean;
}

export const ShareCard: React.FC<ShareCardProps> = ({
  comparison,
  onClose,
  isDark,
}) => {
  const cardRef = useRef<View>(null);

  const { thisWeek, lastWeek, comparison: comp } = comparison;
  const improved = comp.improved;

  const handleShare = async () => {
    try {
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: "png",
          quality: 1,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share your progress",
          });
        } else {
          await Share.share({
            message: `📱 My Screen Time Progress\n\nThis Week: ${thisWeek.totalHours}h\nLast Week: ${lastWeek.totalHours}h\n${improved ? "📉" : "📈"} ${Math.abs(comp.hoursPercentChange)}% ${improved ? "less" : "more"} screen time!\n\n#LockIn #DigitalWellbeing`,
          });
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Combine both weeks' data for the bar chart
  const allData = [...thisWeek.dailyData.map(d => d.hours), ...lastWeek.dailyData.map(d => d.hours)];
  const maxHours = Math.max(...allData, 1);

  const BarChart = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return (
      <View style={{ marginBottom: 20 }}>
        {/* Labels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.9)', marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>This Week</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Last Week</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 100, alignItems: 'flex-end' }}>
          {thisWeek.dailyData.map((d, i) => {
            const thisHeight = (d.hours / maxHours) * 80;
            const lastHeight = (lastWeek.dailyData[i]?.hours || 0) / maxHours * 80;
            return (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: 8 }}>
                  {/* Last week bar */}
                  <View style={{
                    width: 10,
                    height: Math.max(lastHeight, 4),
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }} />
                  {/* This week bar */}
                  <View style={{
                    width: 10,
                    height: Math.max(thisHeight, 4),
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                  }} />
                </View>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{days[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}>
      <View style={{
        width: "100%",
        paddingHorizontal: 20,
        alignItems: "center",
      }}>
        {/* Close button */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: -60,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          onPress={onClose}
        >
          <X size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Card to capture - Glassy Design */}
        <View
          ref={cardRef}
          collapsable={false}
          style={{
            width: "100%",
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: improved ? "#10b981" : "#ef4444",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.4,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          {/* Background gradient - subtle */}
          <LinearGradient
            colors={improved
              ? ['#0a0a0a', '#0f1f1a', '#0a0a0a']
              : ['#0a0a0a', '#1f0f0f', '#0a0a0a']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 28 }}
          >
            {/* Glassy overlay effect */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: improved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Sparkles size={18} color={improved ? '#10b981' : '#ef4444'} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff', letterSpacing: -0.3 }}>LockIn</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Weekly Report</Text>
                </View>
              </View>

              {/* Improvement badge */}
              <View style={{
                backgroundColor: improved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: improved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: improved ? '#10b981' : '#ef4444',
                }}>
                  {improved ? '↓ Improved' : '↑ Increased'}
                </Text>
              </View>
            </View>

            {/* Main stat */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {improved ? (
                  <TrendingDown size={36} color="#10b981" strokeWidth={2.5} style={{ marginRight: 12 }} />
                ) : (
                  <TrendingUp size={36} color="#ef4444" strokeWidth={2.5} style={{ marginRight: 12 }} />
                )}
                <Text style={{
                  fontSize: 64,
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: -3,
                }}>
                  {Math.abs(comp.hoursPercentChange)}%
                </Text>
              </View>
              <Text style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.6)',
                fontWeight: '500',
              }}>
                {improved ? 'Less Screen Time' : 'More Screen Time'}
              </Text>
            </View>

            {/* Bar Chart */}
            <BarChart />

            {/* Stats comparison */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }}>
              {/* This Week */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 6 }}>THIS WEEK</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Clock size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffffff' }}>{thisWeek.totalHours}h</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Smartphone size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{thisWeek.pickups} pickups</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16 }} />

              {/* Last Week */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 6 }}>LAST WEEK</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Clock size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>{lastWeek.totalHours}h</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Smartphone size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{lastWeek.pickups} pickups</Text>
                </View>
              </View>

              {/* Difference */}
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16 }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 6 }}>CHANGE</Text>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: improved ? '#10b981' : '#ef4444',
                }}>
                  {comp.hoursDiff > 0 ? '+' : ''}{comp.hoursDiff}h
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: improved ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)',
                }}>
                  {improved ? 'saved' : 'more'}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={{
              marginTop: 20,
              alignItems: 'center',
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.06)',
            }}>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.3)',
                fontWeight: '500',
              }}>
                lockin.app
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Share button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 16,
            overflow: 'hidden',
          }}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          />
          <Share2 size={18} color="#ffffff" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>Share Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShareCard;
