import "../../global.css";
import { useState } from "react";
import { Redirect, Stack, useSegments, type Href } from "expo-router";
import { PropertyCatalogProvider } from "../context/property-catalog";
import { InspectionBookingsProvider } from "../context/inspection-bookings";
import { SearchFiltersProvider } from "../context/search-filters";
import { SavedPropertiesProvider } from "../context/saved-properties";
import { AccountProvider, useAccount } from "../context/account";
import { PropertyInquiriesProvider } from "../context/property-inquiries";
import { isSupabaseConfigured } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  if (!isSupabaseConfigured) {
    return <SupabaseSetupScreen />;
  }

  return (
    <AccountProvider>
      <AccountScopedProviders />
    </AccountProvider>
  );
}

function AccountScopedProviders() {
  const { account } = useAccount();

  return <AccountDataProviders key={account?.id ?? "signed-out"} />;
}

function AccountDataProviders() {
  return (
    <InspectionBookingsProvider>
      <PropertyInquiriesProvider>
        <SavedPropertiesProvider>
          <PropertyCatalogProvider>
            <SearchFiltersProvider>
              <AuthNavigationStack />
            </SearchFiltersProvider>
          </PropertyCatalogProvider>
        </SavedPropertiesProvider>
      </PropertyInquiriesProvider>
    </InspectionBookingsProvider>
  );
}

function AuthNavigationStack() {
  const { account, roleRequest, authLoading, authError, refreshAccount } =
    useAccount();

  const segments = useSegments();
  const rootSegment: string = segments[0] ?? "";
  const secondSegment: string = segments[1] ?? "";

  const [retrying, setRetrying] = useState(false);

  const publicRoutes = new Set([
    "index",
    "login",
    "signup",
    "onboarding",
    "role",
    "reset-password",
  ]);

  const accountChoiceRoutes = new Set(["index", "onboarding", "role"]);

  const managementRoutes = new Set([
    "add-property",
    "my-listings",
    "inquiries",
    "inspection-bookings",
  ]);

  const isPublicRoute = publicRoutes.has(rootSegment);

  const isProfessional = account?.role === "owner" || account?.role === "agent";

  const hasPendingProfessionalRequest =
    account?.role === "seeker" &&
    (roleRequest?.requestedRole === "owner" ||
      roleRequest?.requestedRole === "agent");

  const homeRoute: Href =
    account?.role === "admin"
      ? ("/admin" as Href)
      : isProfessional
        ? (account?.isVerified ? "/workspace" : "/add-property")
        : hasPendingProfessionalRequest
          ? (roleRequest?.applicationSubmitted ? "/add-property" : "/verification")
          : "/(tabs)";

  // Public pages remain visible while Supabase checks the session.
  // Protected pages wait until the account check finishes.
  if (authLoading && rootSegment !== "" && !isPublicRoute) {
    return <AuthLoadingScreen />;
  }

  // Show account errors on protected pages, not over the Welcome page.
  if (authError && rootSegment !== "" && !isPublicRoute) {
    return (
      <AuthErrorScreen
        message={authError}
        retrying={retrying}
        onRetry={async () => {
          setRetrying(true);

          try {
            await refreshAccount();
          } catch {
            return;
          } finally {
            setRetrying(false);
          }
        }}
      />
    );
  }

  // Visitors without an account can only access public screens.
  // Never redirect before the initial session check has finished.
  if (
    !account &&
    !authLoading &&
    !authError &&
    rootSegment !== "" &&
    !isPublicRoute
  ) {
    return <Redirect href="/login" />;
  }

  // Existing users can still open Welcome,
  // Onboarding and Account Type selection screens.
  if (account && (rootSegment === "login" || rootSegment === "signup")) {
    return <Redirect href={homeRoute} />;
  }

  // Administrators can visit the account-choice screens.
  // All other protected screens remain restricted to Admin.
  if (
    account?.role === "admin" &&
    rootSegment !== "admin" &&
    !accountChoiceRoutes.has(rootSegment) &&
    rootSegment !== "reset-password"
  ) {
    return <Redirect href={"/admin" as Href} />;
  }

  // Non-administrators cannot access the Admin dashboard.
  if (account && account.role !== "admin" && rootSegment === "admin") {
    return <Redirect href={homeRoute} />;
  }

  // Pending Agent and Owner applications must complete verification.
  // Once verification documents are submitted, they have access to the Add Property page.
  if (
    account &&
    hasPendingProfessionalRequest &&
    rootSegment !== "verification" &&
    rootSegment !== "role" &&
    rootSegment !== "reset-password" &&
    !(roleRequest?.applicationSubmitted && rootSegment === "add-property")
  ) {
    return <Redirect href="/verification" />;
  }

  // Unverified approved professionals cannot enter their workspace yet (directed to add-property).
  if (
    account &&
    isProfessional &&
    !account.isVerified &&
    rootSegment === "workspace"
  ) {
    return <Redirect href="/add-property" />;
  }

  // Approved Agents and Owners use their professional workspace.
  // Their profile route remains accessible.
  if (
    isProfessional &&
    rootSegment === "(tabs)" &&
    secondSegment !== "profile"
  ) {
    return <Redirect href="/workspace" />;
  }

  // Seekers and pending applicants cannot enter the workspace.
  if (account && !isProfessional && rootSegment === "workspace") {
    return <Redirect href={homeRoute} />;
  }

  // Only professional accounts can access management screens.
  // Allow add-property if hasPendingProfessionalRequest has submitted verification.
  if (
    account &&
    managementRoutes.has(rootSegment) &&
    !isProfessional &&
    !(hasPendingProfessionalRequest && roleRequest?.applicationSubmitted && rootSegment === "add-property")
  ) {
    return <Redirect href={homeRoute} />;
  }

  // Unverified professionals cannot manage properties (except add-property which has locked photo upload).
  if (
    account &&
    isProfessional &&
    !account.isVerified &&
    managementRoutes.has(rootSegment) &&
    rootSegment !== "add-property"
  ) {
    return <Redirect href="/add-property" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8F8FC" },
      }}
    />
  );
}

function AuthLoadingScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#F8F8FC]">
      <ActivityIndicator color="#6049E8" size="large" />

      <Text className="mt-3 text-sm text-slate-500">
        Checking your account...
      </Text>
    </SafeAreaView>
  );
}

function AuthErrorScreen({
  message,
  retrying,
  onRetry,
}: {
  message: string;
  retrying: boolean;
  onRetry: () => Promise<void>;
}) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#F8F8FC] px-6">
      <View className="w-full rounded-3xl bg-white p-6">
        <Text className="text-xl font-extrabold text-slate-900">
          Could not verify your session
        </Text>

        <Text
          accessibilityRole="alert"
          className="mt-2 text-sm leading-6 text-slate-600"
        >
          {message}
        </Text>

        <Pressable
          accessibilityRole="button"
          className="mt-5 h-12 items-center justify-center rounded-xl bg-[#6049E8]"
          disabled={retrying}
          onPress={() => void onRetry()}
        >
          <Text className="text-sm font-bold text-white">
            {retrying ? "Checking..." : "Try again"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SupabaseSetupScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#F8F8FC] px-6">
      <View className="w-full rounded-3xl bg-white p-6">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
          <Ionicons name="server-outline" size={27} color="#6049E8" />
        </View>

        <Text className="mt-5 text-2xl font-extrabold text-slate-900">
          Connect Supabase
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-600">
          Add your project URL and publishable key to{" "}
          <Text className="font-bold">.env.local</Text> in the Zone folder, then
          restart Expo.
        </Text>

        <Pressable
          accessibilityRole="link"
          className="mt-5 h-12 flex-row items-center justify-center rounded-xl bg-[#6049E8]"
          onPress={() => Linking.openURL("https://supabase.com/dashboard")}
        >
          <Text className="text-sm font-bold text-white">
            Open Supabase Dashboard
          </Text>
        </Pressable>

        <Text className="mt-4 text-xs leading-5 text-slate-500">
          Never put a database password or service-role key in the app. Use only
          the publishable (or legacy anon) key.
        </Text>
      </View>
    </SafeAreaView>
  );
}
