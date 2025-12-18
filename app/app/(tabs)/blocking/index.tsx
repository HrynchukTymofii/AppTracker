import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  BookOpen,
  GraduationCap,
  Heart,
  X,
  Lock,
  Target,
  Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { LoginRequiredModal } from "@/components/modals/LoginRequiredModal";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function QuizzesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { token, user } = useAuth();

  return (
    <SafeAreaView
      style={{ flex: 1}}
      edges={["bottom"]}
    >
      
    </SafeAreaView>
  );
}
