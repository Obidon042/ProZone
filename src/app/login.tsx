
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
import { getSupabaseClient } from "../lib/supabase";

type RequestedRole = "seeker" | "agent" | "owner";

const roleTabs: { role: RequestedRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { role: "seeker", label: "Property Seeker", icon: "home-outline" },
  { role: "agent", label: "Real Estate Agent", icon: "briefcase-outline" },
  { role: "owner", label: "Property Owner", icon: "key-outline" },
];

export default function LoginScreen() {
  const {
    signIn,
    sendPasswordReset,
    refreshAccount,
    selectedRole,
    setSelectedRole,
  } = useAccount();

  const { role: routeRole } = useLocalSearchParams<{ role?: string }>();

  const [userSelectedRole, setUserSelectedRole] =
    useState<RequestedRole | null>(null);

  const loginRole: RequestedRole =
    userSelectedRole ??
    (routeRole === "agent" || routeRole === "owner" || routeRole === "seeker"
      ? routeRole
      : selectedRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const submitSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      await signIn(email, password);

      const client = getSupabaseClient();
      const { data: userData, error: userError } =
        await client.auth.getUser();

      if (userError) {
        throw userError;
      }

      const { data: profile } = await client
        .from("profiles")
        .select("role, is_verified")
        .eq("id", userData.user.id)
        .single();

      const { data: request } = await client
        .from("profile_role_requests")
        .select("requested_role, status, application_submitted")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await refreshAccount();

      // 1. Admin goes to Admin panel
      if (profile?.role === "admin") {
        router.replace("/admin");
        return;
      }

      // 2. Verified professional goes to workspace (where they post & add properties)
      if (profile?.role === "agent" || profile?.role === "owner") {
        if (profile.is_verified) {
          router.replace("/workspace");
        } else {
          router.replace("/add-property");
        }
        return;
      }

      // 3. User with pending agent/owner role request
      if (
        request?.requested_role === "agent" ||
        request?.requested_role === "owner"
      ) {
        if (request.status === "approved" || profile?.is_verified) {
          router.replace("/workspace");
        } else if (request.application_submitted) {
          router.replace("/add-property");
        } else {
          router.replace({
            pathname: "/verification",
            params: { role: request.requested_role },
          });
        }
        return;
      }

      // 4. Default: Property seeker goes to tabs (Home, Search, Saved, Profile)
      router.replace("/(tabs)");
    } catch (signInError) {
      setError(toUserMessage(signInError));
    } finally {
      setSubmitting(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter your account email address first.");
      return;
    }

    setError("");
    setNotice("");
    setResetting(true);

    try {
      await sendPasswordReset(email);

      setNotice(
        "If an account exists for that email, a password reset link has been sent.",
      );
    } catch (resetError) {
      setError(toUserMessage(resetError));
    } finally {
      setResetting(false);
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
                const isActive = loginRole === item.role;
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
                Welcome back
              </Text>
              <View className="rounded-full bg-violet-100 px-3 py-1">
                <Text className="text-xs font-bold text-[#6049E8]">
                  {loginRole === "seeker"
                    ? "Property Seeker"
                    : loginRole === "agent"
                      ? "Real Estate Agent"
                      : "Property Owner"}
                </Text>
              </View>
            </View>

            <Text className="mt-2 text-sm leading-6 text-slate-500">
              {loginRole === "seeker"
                ? "Sign in to access your Home page, Search page, Saved properties, and Profile."
                : "Sign in to post, add, and manage your properties for sale."}
            </Text>

            <Text className="mb-2 mt-6 text-sm font-semibold text-slate-700">
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
              returnKeyType="next"
              value={email}
            />

            <View className="mb-2 mt-5 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-700">
                Password
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={resetting}
                onPress={() => void requestPasswordReset()}
              >
                <Text className="text-xs font-semibold text-[#6049E8]">
                  {resetting ? "Sending link..." : "Forgot password?"}
                </Text>
              </Pressable>
            </View>

            <TextInput
              autoComplete="password"
              className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900"
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              returnKeyType="done"
              secureTextEntry
              value={password}
              onSubmitEditing={() => void submitSignIn()}
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
              <Text
                accessibilityRole="alert"
                className="mt-3 text-sm text-emerald-700"
              >
                {notice}
              </Text>
            ) : null}

            <View className="mt-6">
              <PrimaryButton
                title={submitting ? "Logging in..." : "Login"}
                onPress={() => void submitSignIn()}
                disabled={submitting}
              />
            </View>

            <View className="mt-7 flex-row justify-center">
              <Text className="text-sm text-slate-500">
                Don’t have an account?{" "}
              </Text>

              <Pressable
                accessibilityRole="link"
                onPress={() =>
                  router.push({
                    pathname: "/signup",
                    params: { role: loginRole },
                  })
                }
              >
                <Text className="text-sm font-bold text-[#6049E8]">
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
