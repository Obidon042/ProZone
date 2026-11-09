import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../components/brand";

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#3723B8]">
      <View className="flex-1 items-center justify-between px-7 py-12">
        <View className="flex-1 items-center justify-center">
          <BrandLogo light />
          <Text className="mt-4 text-center text-base text-violet-100">
            Your property, your zone.
          </Text>
        </View>

        <View className="w-full items-center">
          <Text className="mb-6 text-center text-sm leading-6 text-violet-100">
            Find a place to call home, or discover your next great investment.
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-white"
            onPress={() => router.push("/onboarding")}
          >
            <Text className="text-base font-bold text-[#3723B8]">
              Get started
            </Text>
            <Ionicons
              className="ml-2"
              name="arrow-forward"
              size={18}
              color="#3723B8"
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="mt-3.5 h-12 w-full flex-row items-center justify-center rounded-2xl border border-white/30 bg-white/10"
            onPress={() => router.push("/role")}
          >
            <Text className="text-sm font-semibold text-white">
              Already have an account? Sign in
            </Text>
          </Pressable>

          <Text className="mt-4 text-xs text-violet-200">
            A better way to find your place
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
