import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Lightbulb, X } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import AutoHeightWebView from "react-native-autoheight-webview";
import { wrapHtmlContent } from "@/lib/htmlWrapper";

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  hint?: string;
  hintImageUrl?: string;
}

export const HintModal = ({
  isOpen,
  onClose,
  hint,
  hintImageUrl,
}: HintModalProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!hint) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            padding: 20,
            borderRadius: 16,
            width: "100%",
            maxWidth: 600,
            maxHeight: "80%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Lightbulb size={24} color="#f59e0b" fill="#f59e0b" />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: isDark ? "#ffffff" : "#1f2937",
                  marginLeft: 8,
                }}
              >
                Hint
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={{
                padding: 8,
                backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
                borderRadius: 8,
              }}
            >
              <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 500 }}
          >
            <AutoHeightWebView
              source={{
                html: wrapHtmlContent(hint, { isDark }),
              }}
              style={{
                width: "100%",
                minHeight: 50,
              }}
              scrollEnabled={false}
            />
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={{
              marginTop: 16,
              backgroundColor: "#06B6D4",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: "#06B6D4",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Got it!
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
