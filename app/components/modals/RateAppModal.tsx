import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Platform, TextInput, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Star, Send } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { sendMessage } from "@/lib/api/user";

const HAS_RATED_KEY = "hasRatedApp";

interface RateAppProps {
  userPoints: number;
}

export default function RateApp({ userPoints }: RateAppProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showModal, setShowModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const { token } = useAuth();
  const { t } = useTranslation();

  // ✅ Show modal only once when user reaches 400 points and hasn't rated yet
  useEffect(() => {
    const checkRating = async () => {
      const hasRated = await AsyncStorage.getItem(HAS_RATED_KEY);
      if (hasRated === "true") return;

      if (userPoints >= 400) {
        setShowModal(true);
      }
    };

    checkRating();
  }, [userPoints]);

  // 👉 Later button
  const handleLater = async () => {
    setShowModal(false);
    setSelectedStars(0);
    await AsyncStorage.setItem(HAS_RATED_KEY, "true"); // mark as dismissed permanently
  };

  // 👉 Store success / Feedback success
  const handleRated = async () => {
    setShowModal(false);
    setFeedbackVisible(false);
    setSelectedStars(0);
    setFeedbackText("");
    await AsyncStorage.setItem(HAS_RATED_KEY, "true"); // mark as rated
  };

  const showToast = (type: "success" | "error" | "info", text1: string, text2?: string) => {
    Toast.show({ type, text1, text2 });
  };

  // ⭐ Main action
  const handleRateApp = async () => {
    if (selectedStars === 0) {
      showToast("info", t("rateApp.pleaseSelectRating"));
      return;
    }

    if (selectedStars >= 4) {
      // ✅ Close immediately so it won't reopen
      await handleRated();
      if (Platform.OS === "ios") {
        const appStoreLink = "itms-apps://itunes.apple.com/app/6751187640";
        const webLink = "https://apps.apple.com/app/id6751187640";

        Linking.openURL(appStoreLink).catch(() => {
          Linking.openURL(webLink).catch(() => {
            showToast("error", t("rateApp.couldNotOpenAppStore"));
          });
        });
      } else {
        const playStoreLink = "market://details?id=com.hrynchuk.satprepapp";
        const webLink = "https://play.google.com/store/apps/details?id=com.hrynchuk.satprepapp"; 

        Linking.openURL(playStoreLink).catch(() => {
          Linking.openURL(webLink).catch(() => {
            showToast("error", t("rateApp.couldNotOpenPlayStore"));
          });
        });
      }
    } else {
      // 1–3 stars → feedback
      setShowModal(false);
      setTimeout(() => setFeedbackVisible(true), 400);
    }
  };

  // ✉️ Send feedback
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      showToast("info", t("rateApp.pleaseWriteFeedback"));
      return;
    }

    const success = await sendMessage(token!, "app_feedback", feedbackText);
    if (success) {
      showToast("success", t("rateApp.thankYouFeedback"));
      await handleRated();
    } else {
      showToast("error", t("rateApp.failedSendFeedback"));
    }
  };

  const glassBackground = isDark ? "rgba(20, 20, 25, 0.98)" : "rgba(255, 255, 255, 0.98)";
  const glassBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)";

  return (
    <>
      {/* Rating modal */}
      <Modal isVisible={showModal} onBackdropPress={handleLater}>
        <View
          style={{
            backgroundColor: glassBackground,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: glassBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Header with icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <Star size={28} color="#ffffff" fill="#ffffff" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#1f2937",
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: -0.5,
            }}
          >
            {t("rateApp.rateOurApp")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: isDark ? "rgba(255, 255, 255, 0.5)" : "#6b7280",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {t("rateApp.chooseRating")}
          </Text>

          {/* Stars */}
          <View style={{ flexDirection: "row", marginBottom: 28 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setSelectedStars(star)}
                style={{
                  padding: 4,
                }}
              >
                <Star
                  size={36}
                  color={star <= selectedStars ? "#22c55e" : isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}
                  fill={star <= selectedStars ? "#22c55e" : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <TouchableOpacity
              onPress={handleRateApp}
              activeOpacity={0.8}
              style={{ flex: 1, borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#22c55e", "#16a34a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>
                  {t("rateApp.rate")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLater}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: glassBorder,
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 16,
                  color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563",
                }}
              >
                {t("rateApp.later")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback modal */}
      <Modal isVisible={feedbackVisible} onBackdropPress={() => setFeedbackVisible(false)}>
        <View
          style={{
            backgroundColor: glassBackground,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: glassBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Header with icon */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={["#22c55e", "#16a34a"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <Send size={20} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#1f2937",
                letterSpacing: -0.5,
              }}
            >
              {t("rateApp.tellUsImprove")}
            </Text>
          </View>

          <TextInput
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder={t("rateApp.yourFeedbackPlaceholder")}
            placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.3)" : "#9ca3af"}
            style={{
              minHeight: 120,
              borderWidth: 1,
              borderColor: glassBorder,
              borderRadius: 16,
              padding: 16,
              textAlignVertical: "top",
              color: isDark ? "#ffffff" : "#1f2937",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              marginBottom: 20,
              fontSize: 16,
              lineHeight: 24,
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleSendFeedback}
              activeOpacity={0.8}
              style={{ flex: 1, borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#22c55e", "#16a34a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Send size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>
                  {t("rateApp.submit")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFeedbackVisible(false);
                handleRated();
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: glassBorder,
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 16,
                  color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563",
                }}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}



// import { useEffect, useState } from "react";
// import { View, Text, TouchableOpacity, Linking, Platform, TextInput } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Modal from "react-native-modal";
// import Toast from "react-native-toast-message";

// import { useAuth } from "@/context/AuthContext";
// import { sendMessage } from "@/lib/api/user";

// const LAST_RATE_KEY = "lastRateAppPoints";
// const HAS_RATED_KEY = "hasRatedApp";

// interface RateAppProps {
//   userPoints: number;
// }

// export default function RateApp({ userPoints }: RateAppProps) {
//   const [showModal, setShowModal] = useState(false);
//   const [selectedStars, setSelectedStars] = useState(0);
//   const [feedbackVisible, setFeedbackVisible] = useState(false);
//   const [feedbackText, setFeedbackText] = useState("");
//   const [dismissed, setDismissed] = useState(false);
//   const { token } = useAuth();

//   const checkRating = async () => {
//     if (dismissed) return;

//     const hasRated = await AsyncStorage.getItem(HAS_RATED_KEY);
//     if (hasRated === "true") return;

//     const lastAskedStr = await AsyncStorage.getItem(LAST_RATE_KEY);
//     const lastAsked = lastAskedStr ? parseInt(lastAskedStr, 10) : 0;

//     const nextThreshold = Math.floor(userPoints / 400) * 400;

//     if (userPoints >= 400 && userPoints >= nextThreshold && lastAsked < nextThreshold) {
//       setShowModal(true);
//     }
//   };

//   checkRating();

//   // 👉 Later button
//   const handleLater = async () => {
//     setDismissed(true);
//     setShowModal(false);
//     setSelectedStars(0);
//     await AsyncStorage.setItem(LAST_RATE_KEY, userPoints.toString());
//   };

//   // 👉 Store success / Feedback success
//   const handleRated = async () => {
//     setDismissed(true);
//     setShowModal(false);
//     setFeedbackVisible(false);
//     setSelectedStars(0);
//     setFeedbackText("");
//     await AsyncStorage.setItem(HAS_RATED_KEY, "true");
//   };

//   const showToast = (type: "success" | "error" | "info", text1: string, text2?: string) => {
//     Toast.show({ type, text1, text2 });
//   };

//   // ⭐ Main action
//   const handleRateApp = async () => {
//     if (selectedStars === 0) {
//       showToast("info", t("rateApp.pleaseSelectRating"));
//       return;
//     }

//     if (selectedStars >= 4) {
//       // ✅ Close immediately so it won't reopen after returning
//       await handleRated();
//       const url =
//         Platform.OS === "ios"
//           ? "itms-apps://itunes.apple.com/app/6751187640"
//           : "market://details?id=com.hrynchuk.satprepapp";

//       Linking.openURL(url).catch(() => {
//         showToast("error", "Не вдалося відкрити магазин");
//       });
//     } else {
//       // 1–3 stars → feedback
//       setFeedbackVisible(true);
//     }
//   };

//   // ✉️ Send feedback
//   const handleSendFeedback = async () => {
//     if (!feedbackText.trim()) {
//       showToast("info", t("rateApp.pleaseWriteFeedback"));
//       return;
//     }

//     const success = await sendMessage(token!, "app_feedback", feedbackText);
//     if (success) {
//       showToast("success", t("rateApp.thankYouFeedback"));
//       await handleRated();
//     } else {
//       showToast("error", t("rateApp.failedSendFeedback"));
//     }
//   };

//   return (
//     <>
//       {/* Rating modal */}
//       <Modal isVisible={showModal} onBackdropPress={handleLater}>
//         <View className="bg-white dark:bg-stone-900 rounded-lg p-6 items-center">
//           <Text className="text-2xl font-bold text-center mb-4 text-green-600 dark:text-green-500">
//             Оцініть наш застосунок!
//           </Text>
//           <Text className="text-center mb-3 text-green-600 dark:text-green-500">
//             Оберіть рейтинг ⭐
//           </Text>

//           {/* Stars */}
//           <View className="flex-row mb-6">
//             {[1, 2, 3, 4, 5].map((star) => (
//               <TouchableOpacity key={star} onPress={() => setSelectedStars(star)}>
//                 <Text
//                   style={{
//                     fontSize: 32,
//                     color: star <= selectedStars ? "#22c55e" : "#d1d5db",
//                     marginHorizontal: 4,
//                   }}
//                 >
//                   ★
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Buttons */}
//           <View className="flex-row gap-x-6">
//             <TouchableOpacity onPress={handleRateApp} className="bg-green-600 px-8 py-3 rounded-lg">
//               <Text className="text-white font-semibold text-lg">Оцінити</Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleLater} className="bg-gray-300 px-8 py-3 rounded-lg">
//               <Text className="font-semibold text-lg">Пізніше</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Feedback modal */}
//       <Modal isVisible={feedbackVisible} onBackdropPress={() => setFeedbackVisible(false)}>
//         <View className="bg-white dark:bg-stone-900 rounded-lg p-6">
//           <Text className="text-xl font-bold text-center mb-4 text-green-600 dark:text-green-500">
//             Напишіть, що нам варто покращити 🥹
//           </Text>
//           <TextInput
//             multiline
//             value={feedbackText}
//             onChangeText={setFeedbackText}
//             placeholder="Ваш відгук..."
//             className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 mb-4 text-gray-700 dark:text-gray-200"
//             style={{ minHeight: 100, textAlignVertical: "top" }}
//           />
//           <View className="flex-row justify-center gap-x-4">
//             <TouchableOpacity onPress={handleSendFeedback} className="bg-green-600 px-6 py-2 rounded-lg">
//               <Text className="text-white font-semibold">Надіслати</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => {
//                 setFeedbackVisible(false);
//                 handleRated();
//               }}
//               className="bg-gray-300 px-6 py-2 rounded-lg"
//             >
//               <Text className="font-semibold">Скасувати</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// }
