import { Stack } from "expo-router";

export default function CalendarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Study Calendar" }} />
      <Stack.Screen name="day/[date]" options={{ title: "Day Plan" }} />
    </Stack>
  );
}
