import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Clock,
  Target,
  TrendingUp,
  Brain,
  Zap,
  Award,
  Heart,
  Calendar,
  CheckCircle2,
} from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

type SlideType = {
  id: string;
  type: "pain" | "solution" | "chart" | "testimonial" | "input" | "urgency" | "cta";
  content: any;
};

const onboardingSlides: SlideType[] = [
  {
    id: "1",
    type: "pain",
    content: {
      icon: Clock,
      title: "Feeling the\nPressure?",
      subtitle: "Every minute counts...",
      description:
        "You're staring at the clock. 70 minutes. 44 questions. Your heart races as you realize you're only halfway through and time is slipping away...",
      emotion: "The SAT math section isn't just a test—it's a battle against time, stress, and self-doubt.",
      gradient: ["#EF4444", "#DC2626"],
    },
  },
  {
    id: "2",
    type: "pain",
    content: {
      icon: Brain,
      title: "Stuck on the\nSame Mistakes?",
      subtitle: "It feels impossible to improve",
      description:
        "You practice, but keep making the same errors. Quadratic equations? Still confusing. Word problems? They twist your mind. You don't know WHAT you don't know.",
      emotion: "That sinking feeling when you see the same question type and your mind goes blank... again.",
      gradient: ["#F59E0B", "#D97706"],
    },
  },
  {
    id: "3",
    type: "pain",
    content: {
      icon: Target,
      title: "Your Dream\nSchool Awaits",
      subtitle: "But the SAT stands in your way",
      description:
        "You can see it—walking through campus, proud acceptance letter in hand. But you need a 700+. Maybe 750. And right now? You're not there yet.",
      emotion: "Every point matters. Every question could be the difference between acceptance and rejection.",
      gradient: ["#8B5CF6", "#7C3AED"],
    },
  },
  {
    id: "4",
    type: "input",
    content: {
      icon: Calendar,
      title: "When's Your\nBig Day?",
      subtitle: "Let's create your personalized roadmap",
      description: "When are you planning to take the SAT? This helps us build your unique study plan.",
      placeholder: "e.g., March 2025",
      inputKey: "testDate",
      gradient: ["#06B6D4", "#0891B2"],
    },
  },
  {
    id: "5",
    type: "input",
    content: {
      icon: Target,
      title: "What's Your\nTarget Score?",
      subtitle: "Dream big—we'll get you there",
      description: "What's your goal score for SAT Math? Let's make it official.",
      placeholder: "e.g., 750",
      inputKey: "targetScore",
      gradient: ["#10B981", "#059669"],
    },
  },
  {
    id: "6",
    type: "chart",
    content: {
      icon: TrendingUp,
      title: "Students Like You\nAre Winning",
      subtitle: "Real results. Real transformations.",
      stats: [
        { label: "Average Score Increase", value: "+180 pts", color: "#10B981" },
        { label: "Students Reaching Goals", value: "94%", color: "#06B6D4" },
        { label: "Study Time Saved", value: "50hrs", color: "#8B5CF6" },
      ],
      description: "Our students don't just pass—they excel. Imagine seeing your score jump by 180 points.",
      gradient: ["#10B981", "#059669"],
    },
  },
  {
    id: "7",
    type: "solution",
    content: {
      icon: Zap,
      title: "Everything You Need\nIn One Place",
      subtitle: "No more scattered resources",
      features: [
        { icon: "📚", text: "400+ Official SAT-Style Problems", color: "#06B6D4" },
        { icon: "🎯", text: "AI-Powered Weakness Detection", color: "#8B5CF6" },
        { icon: "⏱️", text: "Timed Practice Tests (Real Exam Feel)", color: "#F59E0B" },
        { icon: "💡", text: "Step-by-Step Video Explanations", color: "#10B981" },
        { icon: "📊", text: "Progress Tracking Dashboard", color: "#EF4444" },
        { icon: "🔄", text: "Wrong Answer Recovery System", color: "#EC4899" },
      ],
      gradient: ["#06B6D4", "#0891B2"],
    },
  },
  {
    id: "8",
    type: "testimonial",
    content: {
      icon: Heart,
      title: "You're Not\nAlone in This",
      subtitle: "Join thousands who transformed their scores",
      testimonials: [
        { name: "Sarah M.", score: "610 → 780", quote: "I finally understood what I was doing wrong!" },
        { name: "James K.", score: "550 → 720", quote: "The timed tests made all the difference." },
        { name: "Maya P.", score: "680 → 800", quote: "Got into my dream school. Worth every second!" },
      ],
      gradient: ["#EC4899", "#DB2777"],
    },
  },
  {
    id: "9",
    type: "cta",
    content: {
      icon: Award,
      title: "Your Breakthrough\nStarts Now",
      subtitle: "Limited time offer for new students",
      benefits: [
        "Full access to all 400+ practice problems",
        "Personalized AI study plan (based on YOUR weaknesses)",
        "Unlimited practice tests",
        "Expert video explanations for every question",
        "30-day money-back guarantee",
      ],
      urgency: "🔥 23 students joined in the last hour",
      priceNote: "One-time investment. Lifetime impact.",
      gradient: ["#8B5CF6", "#7C3AED"],
    },
  },
];

export default function SellingOnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync("sellingOnboardingCompleted", "true");
    router.replace("/");
  };

  const handleGetPro = async () => {
    // Save user's answers
    if (Object.keys(answers).length > 0) {
      await SecureStore.setItemAsync("userOnboardingData", JSON.stringify(answers));
    }
    await SecureStore.setItemAsync("sellingOnboardingCompleted", "true");
    router.push("/payment");
  };

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const renderPainSlide = (item: SlideType, index: number) => {
    const { icon: Icon, title, subtitle, description, emotion, gradient } = item.content;

    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    return (
      <View style={{ width, paddingHorizontal: 24 }} className="flex-1 justify-center">
        <LinearGradient
          colors={gradient}
          style={{
            borderRadius: 24,
            padding: 32,
            shadowColor: gradient[0],
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: scrollX.interpolate({
                    inputRange,
                    outputRange: [0.8, 1, 0.8],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
            className="items-center mb-6"
          >
            <View className="bg-white/20 rounded-full p-6 mb-4">
              <Icon size={56} color="#FFF" strokeWidth={2.5} />
            </View>
          </Animated.View>

          <Text className="text-sm font-semibold text-white/80 text-center mb-2 tracking-wider uppercase">
            {subtitle}
          </Text>

          <Text className="text-4xl font-extrabold text-white text-center mb-6 leading-tight">
            {title}
          </Text>

          <Text className="text-base text-white/95 text-center leading-7 mb-4">{description}</Text>

          <View className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <Text className="text-sm text-white italic text-center leading-6">{emotion}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderSolutionSlide = (item: SlideType, index: number) => {
    const { icon: Icon, title, subtitle, features, gradient } = item.content;

    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    return (
      <View style={{ width, paddingHorizontal: 24 }} className="flex-1 justify-center">
        <View>
          <View className="items-center mb-8">
            <View className="bg-cyan-500 rounded-full p-4 mb-4">
              <Icon size={48} color="#FFF" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center mb-2 tracking-wider uppercase">
              {subtitle}
            </Text>
            <Text className="text-4xl font-extrabold text-gray-900 dark:text-white text-center leading-tight">
              {title}
            </Text>
          </View>

          <View className="space-y-3">
            {features.map((feature: any, idx: number) => (
              <Animated.View
                key={idx}
                style={{
                  opacity: scrollX.interpolate({
                    inputRange,
                    outputRange: [0, 1, 0],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange,
                        outputRange: [50, 0, -50],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                }}
                className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md mb-3"
              >
                <Text className="text-3xl mr-3">{feature.icon}</Text>
                <Text className="flex-1 text-base font-semibold text-gray-800 dark:text-white">
                  {feature.text}
                </Text>
                <CheckCircle2 size={20} color={feature.color} />
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderChartSlide = (item: SlideType, index: number) => {
    const { icon: Icon, title, subtitle, stats, description, gradient } = item.content;

    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    return (
      <View style={{ width, paddingHorizontal: 24 }} className="flex-1 justify-center">
        <View>
          <View className="items-center mb-8">
            <View className="bg-green-500 rounded-full p-4 mb-4">
              <Icon size={48} color="#FFF" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center mb-2 tracking-wider uppercase">
              {subtitle}
            </Text>
            <Text className="text-4xl font-extrabold text-gray-900 dark:text-white text-center leading-tight mb-4">
              {title}
            </Text>
          </View>

          <View className="space-y-4 mb-6">
            {stats.map((stat: any, idx: number) => (
              <View key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {stat.label}
                </Text>
                <Text
                  className="text-5xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </Text>
                <View className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <Animated.View
                    style={{
                      width: scrollX.interpolate({
                        inputRange,
                        outputRange: ["0%", "100%", "100%"],
                        extrapolate: "clamp",
                      }),
                      backgroundColor: stat.color,
                      height: "100%",
                    }}
                  />
                </View>
              </View>
            ))}
          </View>

          <Text className="text-base text-gray-700 dark:text-gray-300 text-center leading-6 italic">
            {description}
          </Text>
        </View>
      </View>
    );
  };

  const renderTestimonialSlide = (item: SlideType, _index: number) => {
    const { icon: Icon, title, subtitle, testimonials, gradient } = item.content;

    return (
      <View style={{ width, paddingHorizontal: 24 }} className="flex-1 justify-center">
        <View>
          <View className="items-center mb-8">
            <View className="bg-pink-500 rounded-full p-4 mb-4">
              <Icon size={48} color="#FFF" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center mb-2 tracking-wider uppercase">
              {subtitle}
            </Text>
            <Text className="text-4xl font-extrabold text-gray-900 dark:text-white text-center leading-tight">
              {title}
            </Text>
          </View>

          <View className="space-y-4">
            {testimonials.map((test: any, idx: number) => (
              <View
                key={idx}
                className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 shadow-md border border-pink-200 dark:border-gray-600"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white">
                    {test.name}
                  </Text>
                  <View className="bg-green-500 px-3 py-1 rounded-full">
                    <Text className="text-white font-bold text-xs">{test.score}</Text>
                  </View>
                </View>
                <Text className="text-gray-700 dark:text-gray-300 italic leading-6">
                  "{test.quote}"
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderInputSlide = (item: SlideType, _index: number) => {
    const { icon: Icon, title, subtitle, description, placeholder, inputKey, gradient } =
      item.content;

    return (
      <View style={{ width, paddingHorizontal: 24 }} className="flex-1 justify-center">
        <View>
          <View className="items-center mb-8">
            <LinearGradient
              colors={gradient}
              style={{
                borderRadius: 9999,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Icon size={48} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center mb-2 tracking-wider uppercase">
              {subtitle}
            </Text>
            <Text className="text-4xl font-extrabold text-gray-900 dark:text-white text-center leading-tight mb-4">
              {title}
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400 text-center leading-6">
              {description}
            </Text>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <TextInput
              className="text-center text-2xl font-bold text-gray-900 dark:text-white py-4"
              placeholder={placeholder}
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={answers[inputKey] || ""}
              onChangeText={(text) => handleAnswer(inputKey, text)}
              style={{ outlineStyle: "none" } as any}
            />
          </View>

          <View className="bg-cyan-50 dark:bg-gray-800 rounded-2xl p-4 mt-6 border border-cyan-200 dark:border-gray-700">
            <Text className="text-sm text-cyan-900 dark:text-cyan-300 text-center">
              💡 This helps us create a personalized study plan just for you
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCTASlide = (item: SlideType, _index: number) => {
    const { icon: Icon, title, subtitle, benefits, urgency, priceNote, gradient } = item.content;

    return (
      <View style={{ width, paddingHorizontal: 24 }} className="flex-1 justify-center">
        <View>
          <LinearGradient
            colors={gradient}
            style={{
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              shadowColor: gradient[0],
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <View className="items-center mb-4">
              <View className="bg-white/20 rounded-full p-4 mb-4">
                <Icon size={56} color="#FFF" strokeWidth={2.5} />
              </View>
              <Text className="text-sm font-semibold text-white/80 text-center mb-2 tracking-wider uppercase">
                {subtitle}
              </Text>
              <Text className="text-4xl font-extrabold text-white text-center leading-tight">
                {title}
              </Text>
            </View>
          </LinearGradient>

          <View className="space-y-3 mb-6">
            {benefits.map((benefit: string, idx: number) => (
              <View key={idx} className="flex-row items-start">
                <CheckCircle2 size={24} color="#10B981" className="mr-3 mt-0.5" />
                <Text className="flex-1 text-base text-gray-800 dark:text-white leading-6">
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
            <Text className="text-red-600 dark:text-red-400 font-bold text-center">
              {urgency}
            </Text>
          </View>

          <Text className="text-sm text-gray-600 dark:text-gray-400 text-center italic">
            {priceNote}
          </Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }: any) => {
    let content;

    switch (item.type) {
      case "pain":
        content = renderPainSlide(item, index);
        break;
      case "solution":
        content = renderSolutionSlide(item, index);
        break;
      case "chart":
        content = renderChartSlide(item, index);
        break;
      case "testimonial":
        content = renderTestimonialSlide(item, index);
        break;
      case "input":
        content = renderInputSlide(item, index);
        break;
      case "cta":
        content = renderCTASlide(item, index);
        break;
      default:
        content = null;
    }

    return content;
  };

  const currentSlide = onboardingSlides[currentIndex];
  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Skip Button */}
      <View className="absolute top-14 right-6 z-50">
        <TouchableOpacity
          onPress={handleSkip}
          className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full"
          activeOpacity={0.7}
        >
          <Text className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingSlides}
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
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Bottom Navigation */}
      <View className="px-6 pb-8">
        {/* Pagination Dots */}
        <View className="flex-row items-center justify-center gap-2 mb-6">
          {onboardingSlides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

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
                className="h-2 bg-cyan-500 rounded-full"
              />
            );
          })}
        </View>

        {/* CTA Buttons */}
        {isLastSlide ? (
          <TouchableOpacity
            onPress={handleGetPro}
            className="rounded-2xl overflow-hidden shadow-xl"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white font-bold text-xl">🚀 Unlock PRO & Transform Your Score</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleContinue}
            className="rounded-2xl overflow-hidden shadow-lg"
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["#14B8A6", "#06B6D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white font-semibold text-lg">Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip} className="mt-4" activeOpacity={0.7}>
            <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
              I'll explore on my own
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
