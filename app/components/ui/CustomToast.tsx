import React from "react";
import { View, Text, useColorScheme } from "react-native";
import Toast, { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react-native";

const CustomSuccessToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 8,
        minWidth: "90%",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#10b981",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <CheckCircle size={22} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
              lineHeight: 18,
            }}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const CustomErrorToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 8,
        minWidth: "90%",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#ef4444",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <XCircle size={22} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
              lineHeight: 18,
            }}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const CustomWarningToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 8,
        minWidth: "90%",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#f59e0b",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <AlertCircle size={22} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
              lineHeight: 18,
            }}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const CustomInfoToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 8,
        minWidth: "90%",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#3b82f6",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Info size={22} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
              lineHeight: 18,
            }}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => <CustomSuccessToast {...props} />,
  error: (props) => <CustomErrorToast {...props} />,
  warning: (props) => <CustomWarningToast {...props} />,
  info: (props) => <CustomInfoToast {...props} />,
};

// Helper functions for showing toasts
export const showSuccessToast = (title: string, message?: string) => {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 2500,
    topOffset: 60,
  });
};

export const showErrorToast = (title: string, message?: string) => {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    topOffset: 60,
  });
};

export const showWarningToast = (title: string, message?: string) => {
  Toast.show({
    type: "warning",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    topOffset: 60,
  });
};

export const showInfoToast = (title: string, message?: string) => {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 2500,
    topOffset: 60,
  });
};

export default toastConfig;
