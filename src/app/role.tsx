import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "../components/back-button";
import { BrandLogo } from "../components/brand";
import { PrimaryButton } from "../components/primary-button";
import { useAccount } from "../context/account";

type RoleOption = {
  title: string;
  badge: string;
  value: "seeker" | "agent" | "owner";
  description: string;
  destinationNote: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const roles: RoleOption[] = [
  {
    title: "Property Seeker",
    badge: "Buyer & Renter",
    value: "seeker",
    description: "I want to find, explore, and buy or rent verified properties.",
    destinationNote: "Access Home, Search, Saved properties, and Profile",
    icon: "home-outline",
  },
  {
    title: "Real Estate Agent",
    badge: "Licensed Agent",
    value: "agent",
    description: "I represent clients and want to post and add properties for sale.",
    destinationNote: "Post and manage property listings with client inquiries",
    icon: "briefcase-outline",
  },
  {
    title: "Property Owner",
    badge: "Direct Owner",
    value: "owner",
    description: "I own properties and want to post and add them for sale directly.",
    destinationNote: "Post your properties and manage buyer inspection bookings",
    icon: "key-outline",
  },
];

export default function RoleScreen() {
  const { account, selectedRole, setSelectedRole, signOut } = useAccount();

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const proceedWithRole = async (chosenRole: "seeker" | "agent" | "owner") => {
    setError("");
    setSaving(true);

    try {
      if (account) {
        await signOut();
      }

      setSelectedRole(chosenRole);

      router.push({
        pathname: "/login",
        params: {
          role: chosenRole,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-6 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <BackButton fallbackRoute="/onboarding" />

        <View className="mt-4 items-center">
          <BrandLogo compact />
        </View>

        <Text className="mt-6 text-3xl font-extrabold text-slate-900">
          Choose Your Account Type
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-500">
          Select how you want to use ProZone to go to the Welcome Back page.
        </Text>

        <View className="mt-6 gap-3.5">
          {roles.map((role) => {
            const selected = selectedRole === role.value;

            return (
              <Pressable
                key={role.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={saving}
                className={`rounded-2xl border p-4 ${
                  selected
                    ? "border-[#6049E8] bg-violet-50/70"
                    : "border-slate-200 bg-white"
                }`}
                onPress={() => {
                  setSelectedRole(role.value);
                  setError("");
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-xl ${
                      selected ? "bg-[#6049E8]" : "bg-slate-100"
                    }`}
                  >
                    <Ionicons
                      name={role.icon}
                      size={24}
                      color={selected ? "#FFFFFF" : "#64748B"}
                    />
                  </View>

                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[16px] font-bold text-slate-900">
                        {role.title}
                      </Text>
                      <View className="rounded-full bg-violet-100 px-2.5 py-0.5">
                        <Text className="text-[10px] font-bold text-[#6049E8]">
                          {role.badge}
                        </Text>
                      </View>
                    </View>

                    <Text className="mt-1 text-xs leading-5 text-slate-500">
                      {role.description}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-1 flex-row items-center">
                    <Ionicons
                      name="information-circle-outline"
                      size={14}
                      color="#64748B"
                    />
                    <Text className="ml-1.5 flex-1 text-[11px] text-slate-500">
                      {role.destinationNote}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    disabled={saving}
                    className="ml-2 flex-row items-center rounded-lg bg-[#6049E8] px-3 py-1.5"
                    onPress={() => void proceedWithRole(role.value)}
                  >
                    <Text className="text-xs font-bold text-white">Sign in</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={12}
                      color="white"
                      style={{ marginLeft: 3 }}
                    />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4 rounded-xl bg-slate-50 p-3.5">
          <Text className="text-xs leading-5 text-slate-500">
            • <Text className="font-semibold text-slate-700">Property Seekers</Text> sign in to view Home, Search, Saved properties, and Profile.
          </Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">
            • <Text className="font-semibold text-slate-700">Agents & Property Owners</Text> sign in to post and add properties for sale. Verification with ID and documents is required.
          </Text>
        </View>

        {error ? (
          <Text
            accessibilityRole="alert"
            className="mt-4 text-center text-sm text-red-600"
          >
            {error}
          </Text>
        ) : null}

        <View className="mt-6">
          <PrimaryButton
            title={
              saving
                ? "Please wait..."
                : `Continue as ${
                    selectedRole === "seeker"
                      ? "Property Seeker"
                      : selectedRole === "agent"
                        ? "Real Estate Agent"
                        : "Property Owner"
                  }`
            }
            onPress={() => void proceedWithRole(selectedRole)}
            disabled={saving}
          />
        </View>

        <View className="mt-5 flex-row justify-center pb-2">
          <Text className="text-sm text-slate-500">
            Need a new account?{" "}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              router.push({
                pathname: "/signup",
                params: { role: selectedRole },
              })
            }
          >
            <Text className="text-sm font-bold text-[#6049E8]">
              Sign up here
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
