import { UserType } from "@/context/AuthContext";
import * as AppleAuthentication from "expo-apple-authentication";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";

export async function handleAppleLogin({
  setToken,
  setUser,
  router,
  safeReturnUrl,
  loadUserInBackground,
}: {
  setToken: (token: string) => void;
  setUser: (user: UserType) => void;
  router: any;
  safeReturnUrl: string;
  loadUserInBackground: (opts: { token: string; setUser: (user: UserType) => void; forceSync?: boolean }) => Promise<void>;
}) {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      const res = await fetch("https://www.satlearner.com/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: credential.identityToken,
          name: credential.fullName
            ? `${credential.fullName.givenName ?? ""} ${credential.fullName.familyName ?? ""}`.trim()
            : null,
          email: credential.email ?? null, }),
      });

      const data = await res.json();

      if (data.token) {
        setToken(data.token);
        loadUserInBackground({token:data.token, setUser, forceSync: true});

        // Check if this is first login and user should see selling onboarding
        const sellingOnboardingCompleted = await SecureStore.getItemAsync(
          "sellingOnboardingCompleted"
        );
        const isFirstLogin = data.isNewUser || sellingOnboardingCompleted !== "true";

        // Navigate to selling onboarding if first time, else go to safe return URL
        if (isFirstLogin) {
          router.replace("/selling-onboarding" as any);
        } else {
          router.replace(safeReturnUrl as any);
        }
      } else {
        Toast.show({ type: "error", text1: "Apple login failed" });
      }
    }
  } catch (e: any) {
    if (e.code === "ERR_CANCELED") {
      // user canceled
    } else {
      console.error("[Apple Login Error]", e);
      Toast.show({
        type: "error",
        text1: "Apple login failed",
        text2: e.message || "Error",
      });
    }
  }
}
