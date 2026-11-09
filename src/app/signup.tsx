import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "../components/back-button";
import { BrandLogo } from "../components/brand";
import { PrimaryButton } from "../components/primary-button";
import { toUserMessage, useAccount } from "../context/account";

type RequestedRole = "seeker" | "agent" | "owner";

const roleTabs: { role: RequestedRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { role: "seeker", label: "Property Seeker", icon: "home-outline" },
  { role: "agent", label: "Real Estate Agent", icon: "briefcase-outline" },
  { role: "owner", label: "Property Owner", icon: "key-outline" },
];

export default function SignupScreen() {
  const { signUp, selectedRole, setSelectedRole } = useAccount();

  const { role: routeRole } = useLocalSearchParams<{ role?: string }>();

  const [userSelectedRole, setUserSelectedRole] =
    useState<RequestedRole | null>(null);

  const accountRole: RequestedRole =
    userSelectedRole ??
    (routeRole === "agent" || routeRole === "owner" || routeRole === "seeker"
      ? routeRole
      : selectedRole);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createAccount = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Complete all fields to create your account.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      const { emailConfirmationRequired } = await signUp(
        name,
        email,
        password,
        accountRole,
      );

      if (emailConfirmationRequired) {
        setNotice(
          accountRole === "seeker"
            ? "Check your email to confirm your account, then sign in to access Home, Search, Saved properties, and Profile."
            : `Check your email to confirm your account. After signing in, continue to upload your government ID and documents for ${accountRole === "owner" ? "Property Owner" : "Real Estate Agent"
            } verification.`,
        );
      } else {
        if (accountRole === "seeker") {
          router.replace("/(tabs)");
        } else {
          router.replace({
            pathname: "/verification",
            params: {
              role: accountRole,
            },
          });
        }
      }
    } catch (signupError) {
      setError(toUserMessage(signupError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-3">
            <BackButton fallbackRoute="/role" />

            <View className="mt-6 items-center">
              <BrandLogo compact />
              <Text className="mt-2 text-xs text-slate-500">
                Your property, your zone.
              </Text>
            </View>

            {/* Role switch pills */}
            <View className="mt-6 flex-row rounded-2xl bg-slate-100 p-1">
              {roleTabs.map((item) => {
                const isActive = accountRole === item.role;
                return (
                  <Pressable
                    key={item.role}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`flex-1 flex-row items-center justify-center rounded-xl py-2 px-1 ${isActive ? "bg-white shadow-sm" : ""
                      }`}
                    onPress={() => {
                      setUserSelectedRole(item.role);
                      setSelectedRole(item.role);
                      setError("");
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={isActive ? "#6049E8" : "#64748B"}
                    />
                    <Text
                      numberOfLines={1}
                      className={`ml-1 text-[11px] font-bold ${isActive ? "text-[#6049E8]" : "text-slate-600"
                        }`}
                    >
                      {item.role === "seeker"
                        ? "Seeker"
                        : item.role === "agent"
                          ? "Agent"
                          : "Owner"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-3xl font-extrabold text-slate-900">
                Create account
              </Text>
              <View className="rounded-full bg-violet-100 px-3 py-1">
                <Text className="text-xs font-bold text-[#6049E8]">
                  {accountRole === "seeker"
                    ? "Property Seeker"
                    : accountRole === "agent"
                      ? "Real Estate Agent"
                      : "Property Owner"}
                </Text>
              </View>
            </View>

            <Text className="mt-2 text-sm leading-6 text-slate-500">
              {accountRole === "seeker"
                ? "Create your account to find, search, and save properties to buy."
                : "Create your account to post, add, and sell properties on ProZone."}
            </Text>

            <Text className="mb-2 mt-6 text-sm font-semibold text-slate-700">
              Full name
            </Text>

            <TextInput
              autoComplete="name"
              className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900"
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#94A3B8"
              value={name}
            />

            <Text className="mb-2 mt-4 text-sm font-semibold text-slate-700">
              Email address
            </Text>

            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
            />

            <Text className="mb-2 mt-4 text-sm font-semibold text-slate-700">
              Password
            </Text>

            <TextInput
              autoComplete="new-password"
              className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900"
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
            />

            {error ? (
              <Text
                accessibilityRole="alert"
                className="mt-3 text-sm text-red-600"
              >
                {error}
              </Text>
            ) : null}

            {notice ? (
              <View className="mt-4 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
                <Text
                  accessibilityRole="alert"
                  className="text-sm font-medium text-emerald-800"
                >
                  {notice}
                </Text>
                <Pressable
                  className="mt-2 h-10 items-center justify-center rounded-lg bg-[#6049E8]"
                  onPress={() =>
                    router.push({
                      pathname: "/login",
                      params: { role: accountRole },
                    })
                  }
                >
                  <Text className="text-xs font-bold text-white">
                    Proceed to Sign in
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View className="mt-6">
              <PrimaryButton
                title={submitting ? "Creating account..." : "Create account"}
                onPress={() => void createAccount()}
                disabled={submitting}
              />
            </View>

            <Text className="mt-4 text-center text-xs leading-5 text-slate-400">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </Text>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-sm text-slate-500">
                Already have an account?{" "}
              </Text>

              <Pressable
                accessibilityRole="link"
                onPress={() =>
                  router.push({
                    pathname: "/login",
                    params: { role: accountRole },
                  })
                }
              >
                <Text className="text-sm font-bold text-[#6049E8]">
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
