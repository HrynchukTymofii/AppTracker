import React from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

type Props = {
  onLogin: () => void;
};

export const AppleLoginButton = ({ onLogin }: Props) => {
  if (Platform.OS !== "ios") return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={{ width: "100%", height: 44, marginTop: 12 }}
      onPress={onLogin}
    />
  );
};
