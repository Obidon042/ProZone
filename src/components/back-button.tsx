import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable } from "react-native";

export function handleSafeBack(fallbackRoute: Href = "/") {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute);
  }
}

export function BackButton({ fallbackRoute }: { fallbackRoute?: Href }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-full bg-slate-50"
      onPress={() => handleSafeBack(fallbackRoute)}
    >
      <Ionicons name="arrow-back" size={20} color="#1E293B" />
    </Pressable>
  );
}
