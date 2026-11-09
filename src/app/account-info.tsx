import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { useAccount } from "../context/account";

export default function AccountInfoScreen() {
  const { account, updateAccount } = useAccount();
  const [name, setName] = useState(account?.name ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateAccount(name);
      handleSafeBack("/(tabs)/profile");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          Personal information
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-5 rounded-2xl bg-white p-4">
          <Text className="mb-2 text-xs font-bold text-slate-700">Full name</Text>
          <TextInput
            accessibilityLabel="Full name"
            autoCapitalize="words"
            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            onChangeText={setName}
            value={name}
          />
          <Text className="mb-2 mt-4 text-xs font-bold text-slate-700">
            Email address
          </Text>
          <TextInput
            accessibilityLabel="Email address"
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
            editable={false}
            value={account?.email ?? ""}
          />
          <Text className="mt-3 text-[11px] leading-5 text-slate-400">
            Password resets can be requested from the sign-in screen.
          </Text>
        </View>
        {error ? (
          <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          className="mt-5 h-12 items-center justify-center rounded-xl bg-[#6049E8]"
          disabled={saving}
          onPress={() => void save()}
        >
          <Text className="text-sm font-bold text-white">
            {saving ? "Saving..." : "Save changes"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
