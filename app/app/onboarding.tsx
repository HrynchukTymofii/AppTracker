import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    title: "Master SAT Math\nWith Confidence",
    description:
      "Your complete SAT Math preparation platform with comprehensive lessons, practice problems, mock exams, and detailed test modes to help you achieve your target score.",
    imageLight: require("@/assets/images/onboarding1l.png"),
    imageDark: require("@/assets/images/onboarding1d.png"),
    badge: "700+ practice problems",
  },
  {
    id: "2",
    title: "Learn and Revise\nEvery Topic",
    description:
      "Follow our expertly designed curriculum covering all SAT Math topics. From algebra to advanced problem-solving, master every concept step by step.",
    imageLight: require("@/assets/images/onboarding2l.png"),
    imageDark: require("@/assets/images/onboarding2d.png"),
    badge: "Complete SAT curriculum",
  },
  {
    id: "3",
    title: "Practice Like\nThe Real Exam",
    description:
      "Take full-length practice exams, timed tests, and review your mistakes. Track your progress and identify areas that need improvement.",
    imageLight: require("@/assets/images/onboarding3l.png"),
    imageDark: require("@/assets/images/onboarding3d.png"),
    badge: "Real exam experience",
  },
];

function UCurve({ width = "100%", height = 200, fill = "#ffffff" }) {
  return (
    <Svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      width={width}
      height={height}
    >
      <Path
        d="M0 80
           C 200 260, 400 300, 600 280
           C 800 260, 1000 200, 1200 80
           L1200 400 L0 400 Z"
        fill={fill}
      />
    </Svg>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter()
  const colorScheme = useColorScheme();
  // useEffect(() => {
  //     console.log("🧠 Onboarding mounted");
  
  //     return () => {
  //       console.log("🧹 Onboarding unmounted");
  //     };
  //   }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleContinue = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.replace('/auth' as any)
    }
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <View style={{ width }} className="flex-1">
        {/* Top Section with Phone Image */}
        <View
          className="relative bg-white dark:bg-gray-900"
          style={{ height: height * 0.58 }}
        >
          {/* Phone Screenshot Image */}
          <View className="absolute bottom-0 left-0 right-0 items-center z-10">
            <Animated.View
              style={{
                transform: [{ scale }, { translateY }],
                opacity,
              }}
              className="items-center"
            >
              <Image
                source={colorScheme === 'dark' ? item.imageDark : item.imageLight}
                style={{
                  width: width * 0.75,
                  height: undefined,
                  aspectRatio: 2 / 3,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Badge */}
          <View className="absolute bottom-1 left-0 right-0 items-center z-50">
            <View
              style={{
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 25,
              }}
            >
              <View
                className="bg-white dark:bg-gray-900 px-6 py-2.5 rounded-full"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 8,
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  borderTopColor: "rgba(255, 255, 255, 0.5)",
                  borderBottomColor: "rgba(0, 0, 0, 0.1)",
                }}
              >
                <Text className="text-gray-600 dark:text-white text-xs font-semibold">
                  {item.badge}
                </Text>
              </View>
            </View>
          </View>

          {/* Curve Overlay */}
          <View className="absolute bottom-0 left-0 right-0 z-20">
            <UCurve height={80} fill={colorScheme === 'light' ? "#111827" : "#000"} />
          </View>
        </View>

        {/* Bottom Content Section */}
        <View className="flex-1 bg-gray-900 dark:bg-black px-6 pt-6">
          <View className="flex-1 justify-between">
            {/* Text Content */}
            <View className="items-center">
              <Text className="text-3xl font-bold text-center text-white mb-3 leading-9">
                {item.title}
              </Text>
              <Text className="text-[15px] text-center text-gray-300 leading-[22px]">
                {item.description}
              </Text>
            </View>

            {/* Bottom Section with Dots and Buttons */}
            <View className="pb-8">
              {/* Pagination Dots */}
              <View className="flex-row items-center justify-center gap-2 mb-6">
                {onboardingData.map((_, i) => {
                  const inputRange = [
                    (i - 1) * width,
                    i * width,
                    (i + 1) * width,
                  ];

                  const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: "clamp",
                  });

                  const dotOpacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                  });

                  return (
                    <Animated.View
                      key={i}
                      style={{
                        width: dotWidth,
                        opacity: dotOpacity,
                      }}
                      className="h-2 bg-white rounded-full"
                    />
                  );
                })}
              </View>

              {/* Navigation Buttons */}
              <View className="flex-row gap-3">
                {currentIndex < onboardingData.length - 1 ? (
                    <TouchableOpacity
                      onPress={handleContinue}
                      className="flex-[1.5] bg-white rounded-full py-5 items-center justify-center"
                      activeOpacity={0.8}
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 16 },
                        shadowOpacity: 0.3,
                        shadowRadius: 32,
                        elevation: 12,
                      }}
                    >
                      <Text className="text-black font-bold text-base tracking-wide">
                        Continue
                      </Text>
                    </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleContinue}
                    className="flex-1 bg-white rounded-full py-5 items-center justify-center"
                    activeOpacity={0.8}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 16 },
                      shadowOpacity: 0.3,
                      shadowRadius: 32,
                      elevation: 12,
                    }}
                  >
                    <Text className="text-black font-bold text-base tracking-wide">
                      Let's Get Started
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <StatusBar barStyle="dark-content" />

      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        bounces={false}
      />
    </SafeAreaView>
  );
}


// type OnboardingStep = {
//   type:
//     | "welcome"
//     | "text"
//     | "avatar"
//     | "select"
//     | "timepicker"
//     | "passionSelect"
//     | "loginRedirect";
//   title: string;
//   description?: string;
//   key: string;
//   placeholder?: string;
//   options?: string[];
// };

// const passionsList = [
//   "Science",
//   "Technology",
//   "Art",
//   "Music",
//   "Sports",
//   "Literature",
//   "History",
//   "Business",
//   "Medicine",
//   "Engineering",
//   "Travel",
//   "Languages",
//   "Other",
// ];

// const onboardingQuestions: OnboardingStep[] = [
//   {
//     type: "welcome",
//     title: "Welcome to SAT Prep",
//     description: "Let's personalize your journey with a few quick questions.",
//     key: "welcome",
//   },
//   {
//     type: "text",
//     title: "What's your name?",
//     placeholder: "Enter your name",
//     key: "name",
//   },
//   { type: "avatar", title: "Pick an avatar", key: "avatar" },
//   {
//     type: "select",
//     title: "Have you tried SAT before?",
//     options: ["Never", "Once", "Multiple times"],
//     key: "satExperience",
//   },
//   {
//     type: "timepicker",
//     title: "When do you plan to take the SAT?",
//     key: "satDate",
//   },
//   {
//     type: "select",
//     title: "Most difficult part for you?",
//     options: ["Math", "Reading", "Writing", "Time management"],
//     key: "difficulty",
//   },
//   {
//     type: "passionSelect",
//     title: "What's your passion?",
//     key: "passion",
//   },
//   {
//     type: "loginRedirect",
//     title: "You're all set! 🎉",
//     description: "Final step: create your account to begin your journey.",
//     key: "gotoRegister",
//   },
// ];

// export default function Onboarding() {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [answers, setAnswers] = useState<Record<string, string>>({});
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const router = useRouter();

//   const fadeAnim = useState(new Animated.Value(0))[0];
//   const slideAnim = useState(new Animated.Value(20))[0];

//   const step = onboardingQuestions[currentStep];
//   const totalSteps = onboardingQuestions.length;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 400,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 400,
//         easing: Easing.out(Easing.exp),
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [currentStep]);

//   const handleNext = async () => {
//     if (currentStep < totalSteps - 1) {
//       fadeAnim.setValue(0);
//       slideAnim.setValue(20);
//       setCurrentStep(currentStep + 1);
//     } else {
//       try {
//         await SecureStore.setItemAsync("onboardingCompleted", "true");

//         await SecureStore.setItemAsync("onboardingAnswers", JSON.stringify(answers));

//         router.push({ pathname: "/login", params: { tab: "register" } });
//       } catch (err) {
//         console.error("Error saving onboarding data:", err);
//         router.push({ pathname: "/login", params: { tab: "register" } });
//       }
//     }
//   };

//   const handleAnswer = (key: string, value: string) => {
//     setAnswers((prev) => ({ ...prev, [key]: value }));
//   };

//   const progress = ((currentStep + 1) / totalSteps) * 100;

//   return (
//     <LinearGradient
//       colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={{ flex: 1 }}

//     >
//       <ScrollView
//         className="flex-1 px-6"
//         contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
//       >
//         {/* Progress Bar */}
//         <View className="w-full h-2 bg-white/20 rounded-full mb-8 overflow-hidden">
//           <View
//             style={{
//               width: `${progress}%`,
//               height: "100%",
//               backgroundColor: "white",
//             }}
//           />
//         </View>

//         {/* Step Content */}
//         <Animated.View
//           style={{
//             opacity: fadeAnim,
//             transform: [{ translateY: slideAnim }],
//           }}
//         >
//           <MotiText
//             from={{ opacity: 0, translateY: 10 }}
//             animate={{ opacity: 1, translateY: 0 }}
//             transition={{ delay: 100 }}
//             className="text-3xl font-extrabold text-white text-center mb-3"
//           >
//             {step.title}
//           </MotiText>

//           {step.description && (
//             <MotiText
//               from={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 150 }}
//               className="text-center text-white/90 mb-8 text-base"
//             >
//               {step.description}
//             </MotiText>
//           )}

//           {/* Text Input (Glass style) */}
//           {step.type === "text" && (
//             <View className="bg-white/15 rounded-2xl mb-6 ">
//               <TextInput
//                 className="bg-white/20 rounded-2xl text-white px-4 py-3 text-base"
//                 placeholder={step.placeholder}
//                 placeholderTextColor="rgba(255,255,255,0.7)"
//                 value={answers[step.key] || ""}
//                 onChangeText={(text) => handleAnswer(step.key, text)}
//               />
//             </View>
//           )}

//           {/* Avatar Selection */}
//           {step.type === "avatar" && (
//             <View className="flex-row items-center gap-8 mb-6 mx-auto">
//               {["👩‍🎓", "🧑‍🎓", "🎓"].map((emoji) => (
//                 <TouchableOpacity
//                   key={emoji}
//                   className={`p-4 px-5 rounded-full border-2 ${
//                     answers[step.key] === emoji
//                       ? "border-yellow-400 bg-white/30"
//                       : "border-white/40"
//                   }`}
//                   onPress={() => handleAnswer(step.key, emoji)}
//                 >
//                   <Text style={{ fontSize: 36 }}>{emoji}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}

//           {/* Select Options */}
//           {step.type === "select" &&
//             step.options?.map((opt) => (
//               <TouchableOpacity
//                 key={opt}
//                 className={`p-4 mb-3 rounded-xl ${
//                   answers[step.key] === opt
//                     ? "bg-white"
//                     : "bg-white/20 border border-white/30"
//                 }`}
//                 onPress={() => handleAnswer(step.key, opt)}
//               >
//                 <Text
//                   className={`text-center ${
//                     answers[step.key] === opt
//                       ? "text-blue-600 font-bold"
//                       : "text-white"
//                   }`}
//                 >
//                   {opt}
//                 </Text>
//               </TouchableOpacity>
//             ))}

//           {/* Time Picker */}
//           {step.type === "timepicker" && (
//             <View className="items-center">
//               <TouchableOpacity
//                 onPress={() => setShowDatePicker(true)}
//                 className="bg-white/20 border border-white/30 p-4 rounded-xl mb-4"
//               >
//                 <Text className="text-white text-center">
//                   {answers[step.key]
//                     ? `📅 ${answers[step.key]}`
//                     : "Select your exam date"}
//                 </Text>
//               </TouchableOpacity>

//               {showDatePicker && (
//                 <DateTimePicker
//                   mode="date"
//                   value={new Date()}
//                   display={Platform.OS === "ios" ? "spinner" : "default"}
//                   onChange={(event, date) => {
//                     setShowDatePicker(false);
//                     if (date) {
//                       handleAnswer(step.key, date.toDateString());
//                     }
//                   }}
//                 />
//               )}
//             </View>
//           )}

//           {/* Passion Select */}
//           {step.type === "passionSelect" && (
//             <View className="flex flex-wrap flex-row justify-center gap-3 mb-6">
//               {passionsList.map((p) => (
//                 <TouchableOpacity
//                   key={p}
//                   onPress={() => handleAnswer(step.key, p)}
//                   className={`px-4 py-2 rounded-full ${
//                     answers[step.key] === p
//                       ? "bg-white"
//                       : "bg-white/20 border border-white/30"
//                   }`}
//                 >
//                   <Text
//                     className={`${
//                       answers[step.key] === p
//                         ? "text-blue-600 font-bold"
//                         : "text-white"
//                     }`}
//                   >
//                     {p}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}

//           {/* Next Button */}
//           <TouchableOpacity
//             activeOpacity={0.9}
//             onPress={handleNext}
//             className="rounded-2xl overflow-hidden shadow-lg mt-6"
//           >
//             <LinearGradient
//               colors={["#f59e0b", "#fbbf24"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={{ paddingVertical: 14 }}
//             >
//               <Text className="text-center text-white font-semibold text-base">
//                 {currentStep === totalSteps - 1 ? "Go to Register" : "Next"}
//               </Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </Animated.View>

//       </ScrollView>
//       <View className="items-center justify-center py-6 mb-12">
//         <TouchableOpacity
//           onPress={() => router.replace("/login")}
//           activeOpacity={0.8}
//         >
//           <Text className="text-white/80 text-sm font-semibold mt-1 underline underline-offset-4">
//             Already have an account? Log in
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   );
// }
