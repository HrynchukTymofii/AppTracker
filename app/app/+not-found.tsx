// app/+not-found.tsx
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>404 — Page Not Found</Text>
    </View>
  );
}
