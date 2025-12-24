import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Smartphone,
  ArrowDown,
  ArrowUp,
  Share2,
  X,
} from "lucide-react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { WeekComparisonData } from "@/lib/usageTracking";

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

  const MiniBarChart = ({ data, color }: { data: { hours: number }[]; color: string }) => {
    const maxHours = Math.max(...data.map((d) => d.hours), 1);
    return (
      <View style={styles.miniChart}>
        {data.map((d, i) => (
          <View
            key={i}
            style={[
              styles.miniBar,
              {
                height: (d.hours / maxHours) * 40,
                backgroundColor: color,
                opacity: 0.3 + (d.hours / maxHours) * 0.7,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Card to capture */}
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <LinearGradient
            colors={improved ? ["#059669", "#10b981", "#34d399"] : ["#dc2626", "#ef4444", "#f87171"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>LockIn</Text>
              </View>
              <Text style={styles.subtitle}>Weekly Progress Report</Text>
            </View>

            {/* Main stat */}
            <View style={styles.mainStat}>
              <View style={styles.trendIconContainer}>
                {improved ? (
                  <TrendingDown size={48} color="#ffffff" strokeWidth={2.5} />
                ) : (
                  <TrendingUp size={48} color="#ffffff" strokeWidth={2.5} />
                )}
              </View>
              <Text style={styles.percentageText}>
                {Math.abs(comp.hoursPercentChange)}%
              </Text>
              <Text style={styles.percentageLabel}>
                {improved ? "Less Screen Time" : "More Screen Time"}
              </Text>
            </View>

            {/* Week comparison */}
            <View style={styles.weeksContainer}>
              {/* This Week */}
              <View style={styles.weekBox}>
                <Text style={styles.weekLabel}>This Week</Text>
                <View style={styles.weekStats}>
                  <View style={styles.statRow}>
                    <Clock size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.statValue}>{thisWeek.totalHours}h</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Smartphone size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.statValue}>{thisWeek.pickups}</Text>
                  </View>
                </View>
                <MiniBarChart
                  data={thisWeek.dailyData}
                  color="#ffffff"
                />
              </View>

              {/* Divider with arrow */}
              <View style={styles.divider}>
                <View style={styles.arrowContainer}>
                  {improved ? (
                    <ArrowDown size={20} color="#ffffff" />
                  ) : (
                    <ArrowUp size={20} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.diffText}>
                  {comp.hoursDiff > 0 ? "+" : ""}{comp.hoursDiff}h
                </Text>
              </View>

              {/* Last Week */}
              <View style={styles.weekBox}>
                <Text style={styles.weekLabel}>Last Week</Text>
                <View style={styles.weekStats}>
                  <View style={styles.statRow}>
                    <Clock size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.statValue}>{lastWeek.totalHours}h</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Smartphone size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.statValue}>{lastWeek.pickups}</Text>
                  </View>
                </View>
                <MiniBarChart
                  data={lastWeek.dailyData}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {improved
                  ? "Making progress! Keep it up! 💪"
                  : "Time to focus! You got this! 🎯"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={20} color="#ffffff" />
          <Text style={styles.shareButtonText}>Share Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: -60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  cardGradient: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  mainStat: {
    alignItems: "center",
    marginBottom: 32,
  },
  trendIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  percentageText: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: -2,
  },
  percentageLabel: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginTop: 4,
  },
  weeksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  weekBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 12,
  },
  weekLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  weekStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  miniChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 40,
    gap: 2,
  },
  miniBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  divider: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  diffText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  footerText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ShareCard;
