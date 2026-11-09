import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InquirySentScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-7">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <Ionicons name="checkmark-circle" size={48} color="#22A06B" />
      </View>
      <Text className="mt-6 text-center text-2xl font-extrabold text-slate-900">
        Inquiry saved
      </Text>
      <Text className="mt-3 text-center text-sm leading-6 text-slate-500">
        Your message has been delivered to the listing contact. You can return
        to the marketplace or find the contact details in your account.
      </Text>
      <Pressable
        accessibilityRole="button"
        className="mt-8 h-12 w-full items-center justify-center rounded-xl bg-[#6049E8]"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-sm font-bold text-white">Back to home</Text>
      </Pressable>
    </SafeAreaView>
  );
}
