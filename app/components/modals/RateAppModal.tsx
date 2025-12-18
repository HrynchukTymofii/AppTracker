import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Platform, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";

import { useAuth } from "@/context/AuthContext";
import { sendMessage } from "@/lib/api/user";

const HAS_RATED_KEY = "hasRatedApp";

interface RateAppProps {
  userPoints: number;
}

export default function RateApp({ userPoints }: RateAppProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const { token } = useAuth();

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
      showToast("info", "Будь ласка, оберіть кількість зірок ⭐");
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
            showToast("error", "Не вдалося відкрити App Store");
          });
        });
      } else {
        const playStoreLink = "market://details?id=com.hrynchuk.satprepapp";
        const webLink = "https://play.google.com/store/apps/details?id=com.hrynchuk.satprepapp"; 

        Linking.openURL(playStoreLink).catch(() => {
          Linking.openURL(webLink).catch(() => {
            showToast("error", "Не вдалося відкрити Google Play");
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
      showToast("info", "Будь ласка, напишіть ваш відгук");
      return;
    }

    const success = await sendMessage(token!, "app_feedback", feedbackText);
    if (success) {
      showToast("success", "Дякуємо за ваш відгук!");
      await handleRated();
    } else {
      showToast("error", "Не вдалося надіслати відгук. Спробуйте ще раз.");
    }
  };

  return (
    <>
      {/* Rating modal */}
      <Modal isVisible={showModal} onBackdropPress={handleLater}>
        <View className="bg-white dark:bg-stone-900 rounded-lg p-6 items-center">
          <Text className="text-2xl font-bold text-center mb-4 text-green-600 dark:text-green-500">
            Оцініть наш застосунок!
          </Text>
          <Text className="text-center mb-3 text-green-600 dark:text-green-500">
            Оберіть рейтинг ⭐
          </Text>

          {/* Stars */}
          <View className="flex-row mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setSelectedStars(star)}>
                <Text
                  style={{
                    fontSize: 32,
                    color: star <= selectedStars ? "#22c55e" : "#d1d5db",
                    marginHorizontal: 4,
                  }}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Buttons */}
          <View className="flex-row gap-x-6">
            <TouchableOpacity onPress={handleRateApp} className="bg-green-600 px-8 py-3 rounded-lg">
              <Text className="text-white font-semibold text-lg">Оцінити</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLater} className="bg-gray-300 px-8 py-3 rounded-lg">
              <Text className="font-semibold text-lg">Пізніше</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback modal */}
      <Modal isVisible={feedbackVisible} onBackdropPress={() => setFeedbackVisible(false)}>
        <View className="bg-white dark:bg-stone-900 rounded-lg p-6">
          <Text className="text-xl font-bold text-center mb-4 text-green-600 dark:text-green-500">
            Напишіть, що нам варто покращити 🥹
          </Text>
          <TextInput
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="Ваш відгук..."
            className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 mb-4 text-gray-700 dark:text-gray-200"
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
          <View className="flex-row justify-center gap-x-4">
            <TouchableOpacity onPress={handleSendFeedback} className="bg-green-600 px-6 py-2 rounded-lg">
              <Text className="text-white font-semibold">Надіслати</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setFeedbackVisible(false);
                handleRated();
              }}
              className="bg-gray-300 px-6 py-2 rounded-lg"
            >
              <Text className="font-semibold">Скасувати</Text>
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
//       showToast("info", "Будь ласка, оберіть кількість зірок ⭐");
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
//       showToast("info", "Будь ласка, напишіть ваш відгук");
//       return;
//     }

//     const success = await sendMessage(token!, "app_feedback", feedbackText);
//     if (success) {
//       showToast("success", "Дякуємо за ваш відгук!");
//       await handleRated();
//     } else {
//       showToast("error", "Не вдалося надіслати відгук. Спробуйте ще раз.");
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
