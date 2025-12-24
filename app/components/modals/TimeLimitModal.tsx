import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Timer, X } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from "react-i18next";

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface TimeLimitModalProps {
  visible: boolean;
  appName?: string;
  initialMinutes?: number;
  onConfirm: (totalMinutes: number) => void;
  onCancel: () => void;
}

const NumberPicker = ({
  items,
  selectedValue,
  onValueChange,
  isDark,
}: {
  items: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  isDark: boolean;
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const index = items.indexOf(selectedValue);
    if (index !== -1 && scrollViewRef.current && !isScrolling) {
      scrollViewRef.current.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedValue, items, isScrolling]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    if (items[clampedIndex] !== selectedValue) {
      onValueChange(items[clampedIndex]);
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    setIsScrolling(false);
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    // Snap to exact position
    scrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
    onValueChange(items[clampedIndex]);
  };

  return (
    <View style={styles.pickerContainer}>
      {/* Selection indicator */}
      <View
        style={[
          styles.selectionIndicator,
          {
            backgroundColor: isDark
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(59, 130, 246, 0.1)",
            borderColor: isDark
              ? "rgba(59, 130, 246, 0.4)"
              : "rgba(59, 130, 246, 0.3)",
          },
        ]}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT,
        }}
      >
        {items.map((item, index) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                onValueChange(item);
              }}
              style={styles.pickerItem}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  {
                    color: isSelected
                      ? "#3b82f6"
                      : isDark
                        ? "rgba(255, 255, 255, 0.4)"
                        : "rgba(0, 0, 0, 0.3)",
                    fontWeight: isSelected ? "700" : "500",
                    fontSize: isSelected ? 28 : 22,
                  },
                ]}
              >
                {item.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const TimeLimitModal: React.FC<TimeLimitModalProps> = ({
  visible,
  appName,
  initialMinutes = 30,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [hours, setHours] = useState(Math.floor(initialMinutes / 60));
  const [minutes, setMinutes] = useState(initialMinutes % 60);

  // Reset values when modal opens
  useEffect(() => {
    if (visible) {
      setHours(Math.floor(initialMinutes / 60));
      setMinutes(initialMinutes % 60);
    }
  }, [visible, initialMinutes]);

  const hoursArray = Array.from({ length: 25 }, (_, i) => i); // 0-24
  const minutesArray = Array.from({ length: 60 }, (_, i) => i); // 0-59

  const handleConfirm = () => {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes > 0) {
      onConfirm(totalMinutes);
    }
  };

  const formatTimeDisplay = () => {
    const total = hours * 60 + minutes;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onCancel}
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
              },
            ]}
          >
            <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          </TouchableOpacity>

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(59, 130, 246, 0.1)",
              },
            ]}
          >
            <Timer size={28} color="#3b82f6" />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDark ? "#ffffff" : "#111827" },
            ]}
          >
            {t("blocking.timeLimitModal.title") || "Set Time Limit"}
          </Text>

          {/* App Name */}
          {appName && (
            <Text
              style={[
                styles.appName,
                { color: isDark ? "#9ca3af" : "#6b7280" },
              ]}
            >
              {appName}
            </Text>
          )}

          {/* Time Pickers */}
          <View style={styles.pickersRow}>
            {/* Hours */}
            <View style={styles.pickerWrapper}>
              <Text
                style={[
                  styles.pickerLabel,
                  { color: isDark ? "#9ca3af" : "#6b7280" },
                ]}
              >
                {t("blocking.timeLimitModal.hours") || "Hours"}
              </Text>
              <NumberPicker
                items={hoursArray}
                selectedValue={hours}
                onValueChange={setHours}
                isDark={isDark}
              />
            </View>

            {/* Separator */}
            <Text
              style={[
                styles.separator,
                { color: isDark ? "#ffffff" : "#111827" },
              ]}
            >
              :
            </Text>

            {/* Minutes */}
            <View style={styles.pickerWrapper}>
              <Text
                style={[
                  styles.pickerLabel,
                  { color: isDark ? "#9ca3af" : "#6b7280" },
                ]}
              >
                {t("blocking.timeLimitModal.minutes") || "Minutes"}
              </Text>
              <NumberPicker
                items={minutesArray}
                selectedValue={minutes}
                onValueChange={setMinutes}
                isDark={isDark}
              />
            </View>
          </View>

          {/* Total Time Display */}
          <View
            style={[
              styles.totalDisplay,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.03)",
              },
            ]}
          >
            <Text
              style={[
                styles.totalLabel,
                { color: isDark ? "#9ca3af" : "#6b7280" },
              ]}
            >
              {t("blocking.timeLimitModal.dailyLimit") || "Daily Limit"}
            </Text>
            <Text
              style={[
                styles.totalValue,
                { color: isDark ? "#ffffff" : "#111827" },
              ]}
            >
              {formatTimeDisplay()}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onCancel}
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#ffffff" : "#374151" },
                ]}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: "#3b82f6",
                  opacity: hours === 0 && minutes === 0 ? 0.5 : 1,
                },
              ]}
              disabled={hours === 0 && minutes === 0}
            >
              <Text style={[styles.buttonText, { color: "#ffffff" }]}>
                {t("common.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  appName: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  pickersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerContainer: {
    width: 80,
    height: PICKER_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  selectionIndicator: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 1,
    pointerEvents: "none",
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerItemText: {
    textAlign: "center",
  },
  separator: {
    fontSize: 32,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 24,
  },
  totalDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelButton: {},
  confirmButton: {},
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default TimeLimitModal;
