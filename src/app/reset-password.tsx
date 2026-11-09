import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAccount } from "../context/account";

export default function ResetPasswordScreen() {
  const { account, authLoading, authError, updatePassword } = useAccount();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const savePassword = async () => {
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updatePassword(password);
      router.replace("/(tabs)");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update your password. Request a new reset link.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center bg-white px-6">
      <View className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
          <Ionicons name="lock-closed-outline" size={28} color="#6049E8" />
        </View>
        <Text className="mt-5 text-2xl font-extrabold text-slate-900">
          Set a new password
        </Text>
      </View>

      {authLoading ? (
        <Text className="mt-6 text-center text-sm text-slate-500">
          Verifying your reset link...
        </Text>
      ) : account ? (
        <View className="mt-6 gap-3">
          <TextInput
            accessibilityLabel="New password"
            autoComplete="new-password"
            className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900"
            onChangeText={setPassword}
            placeholder="New password (at least 8 characters)"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
          />
          <TextInput
            accessibilityLabel="Confirm new password"
            autoComplete="new-password"
            className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900"
            onChangeText={setConfirmation}
            placeholder="Confirm new password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={confirmation}
          />
          {error ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            className="mt-2 h-12 items-center justify-center rounded-xl bg-[#6049E8]"
            disabled={saving}
            onPress={() => void savePassword()}
          >
            <Text className="text-sm font-bold text-white">
              {saving ? "Updating..." : "Update password"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-5">
          <Text accessibilityRole="alert" className="text-center text-sm text-red-600">
            {authError ??
              "This reset link is invalid or expired. Request a new one and open it on this device."}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-5 h-12 items-center justify-center rounded-xl bg-[#6049E8]"
            onPress={() => router.replace("/login")}
          >
            <Text className="text-sm font-bold text-white">Back to sign in</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
