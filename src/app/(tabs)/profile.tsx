import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../../components/brand";
import { useAccount } from "../../context/account";

const sharedOptions = [
  { icon: "person-outline" as const, title: "Personal information" },
  { icon: "notifications-outline" as const, title: "Notifications" },
  { icon: "help-circle-outline" as const, title: "Help and support" },
  { icon: "shield-checkmark-outline" as const, title: "Privacy and security" },
];

export default function ProfileScreen() {
  const { account, roleRequest, refreshAccount, signOut } = useAccount();

  const [signOutError, setSignOutError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const isProfessional = account?.role === "agent" || account?.role === "owner";

  const handleRefreshAccess = async () => {
    setRefreshError("");
    setRefreshing(true);

    try {
      await refreshAccount();
      router.replace("/");
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? error.message
          : "Unable to refresh your approved profile.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutError("");

    try {
      await signOut();
      router.dismissAll();
      router.replace("/login");
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    }
  };

  const managementOptions = isProfessional
    ? [
        { icon: "business-outline" as const, title: "My Listings" },
        { icon: "chatbubbles-outline" as const, title: "Property inquiries" },
        { icon: "calendar-outline" as const, title: "Inspection bookings" },
        { icon: "add-circle-outline" as const, title: "Add Property" },
      ]
    : [{ icon: "calendar-outline" as const, title: "My inspections" }];

  const options = [
    ...managementOptions,
    ...sharedOptions.filter(
      (option) => account !== null || option.title !== "Personal information",
    ),
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="pt-4 text-2xl font-extrabold text-slate-900">
          Profile
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            account
              ? `${account.name}, ${account.role} profile`
              : "Guest user. Sign in to manage your account."
          }
          className="mt-5 flex-row items-center rounded-2xl bg-white p-4"
          onPress={() => router.push(account ? "/account-info" : "/login")}
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-violet-100">
            <Ionicons name="person" size={25} color="#6049E8" />
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-base font-bold text-slate-900">
              {account?.name ?? "Guest user"}
            </Text>

            <Text className="mt-1 text-xs text-slate-500">
              {account
                ? `${account.role === "seeker" ? "Property seeker" : account.role === "agent" ? "Real estate agent" : account.role === "owner" ? "Property owner" : "Administrator"} · ${account.email}`
                : "Sign in to manage your account"}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        {account && roleRequest ? (
          <View className="mt-4 rounded-2xl bg-white p-4">
            <Text className="text-sm font-bold text-slate-900">
              {roleRequest.status === "needs_info"
                ? "More verification information requested"
                : roleRequest.status === "pending"
                  ? roleRequest.applicationSubmitted
                    ? "Verification application is awaiting review"
                    : "Complete verification to submit your application"
                  : roleRequest.status === "approved"
                    ? account.isVerified
                      ? `${roleRequest.requestedRole === "agent" ? "Agent" : "Owner"} verification approved`
                      : "Identity verification is still required to publish"
                    : "Previous verification application was not approved"}
            </Text>

            {roleRequest.status === "pending" ? (
              <Text className="mt-1 text-xs leading-5 text-slate-500">
                {roleRequest.applicationSubmitted
                  ? "Your application is being reviewed. Publishing remains disabled until approval."
                  : "Submit your legal details and verification documents. Applying is free."}
              </Text>
            ) : null}

            {roleRequest.decisionReason ? (
              <Text className="mt-2 text-sm leading-5 text-slate-600">
                {roleRequest.decisionReason}
              </Text>
            ) : null}

            {refreshError ? (
              <Text
                accessibilityRole="alert"
                className="mt-2 text-sm text-red-600"
              >
                {refreshError}
              </Text>
            ) : null}

            {!account.isVerified ? (
              <Pressable
                accessibilityRole="button"
                className="mt-3 h-11 items-center justify-center rounded-xl bg-violet-50"
                onPress={() =>
                  router.push({
                    pathname: "/verification",
                    params: { role: roleRequest.requestedRole },
                  })
                }
              >
                <Text className="text-sm font-semibold text-[#6049E8]">
                  {roleRequest.status === "pending" &&
                  roleRequest.applicationSubmitted
                    ? "Check application status"
                    : "Complete verification"}
                </Text>
              </Pressable>
            ) : null}

            {roleRequest.applicationSubmitted && !account.isVerified ? (
              <Pressable
                accessibilityRole="button"
                className="mt-2 h-10 items-center justify-center"
                disabled={refreshing}
                onPress={() => void handleRefreshAccess()}
              >
                <Text className="text-xs font-semibold text-slate-500">
                  {refreshing ? "Checking..." : "Refresh status"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {account && !account.isVerified && isProfessional && !roleRequest ? (
          <Pressable
            accessibilityRole="button"
            className="mt-4 flex-row items-center rounded-2xl bg-amber-50 p-4"
            onPress={() =>
              router.push({
                pathname: "/verification",
                params: { role: account.role },
              })
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#B45309"
            />

            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-amber-900">
                Verify your account to publish
              </Text>

              <Text className="mt-1 text-xs text-amber-800">
                Verification is free and required for property publishing.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Text className="mb-3 mt-7 text-base font-bold text-slate-900">
          Account settings
        </Text>

        <View className="overflow-hidden rounded-2xl bg-white px-4">
          {options.map((option, index) => (
            <Pressable
              key={option.title}
              accessibilityRole="button"
              className={`flex-row items-center py-4 ${
                index < options.length - 1 ? "border-b border-slate-100" : ""
              }`}
              onPress={() => {
                if (option.title === "My Listings") {
                  router.push("/my-listings");
                  return;
                }

                if (option.title === "Inspection bookings") {
                  router.push("/inspection-bookings");
                  return;
                }

                if (option.title === "Add Property") {
                  router.push("/add-property");
                  return;
                }

                if (option.title === "Property inquiries") {
                  router.push("/inquiries");
                  return;
                }

                if (option.title === "My inspections") {
                  router.push("/my-inspections");
                  return;
                }

                if (option.title === "Personal information") {
                  router.push("/account-info");
                  return;
                }

                Alert.alert(
                  option.title,
                  `${option.title} is not configured in this version yet.`,
                );
              }}
            >
              <Ionicons name={option.icon} size={20} color="#64748B" />

              <Text className="ml-3 flex-1 text-sm font-medium text-slate-700">
                {option.title}
              </Text>

              <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
            </Pressable>
          ))}
        </View>

        {account ? (
          <>
            {signOutError ? (
              <Text
                accessibilityRole="alert"
                className="mt-4 text-center text-sm text-red-600"
              >
                {signOutError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              className="mt-5 h-12 items-center justify-center rounded-xl border border-slate-200 bg-white"
              onPress={() => router.push("/role")}
            >
              <Text className="text-sm font-semibold text-slate-700">
                {isProfessional
                  ? "Professional account settings"
                  : "Apply as Agent or Owner"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="mt-3 h-12 items-center justify-center rounded-xl border border-rose-200 bg-white"
              onPress={() => void handleSignOut()}
            >
              <Text className="text-sm font-semibold text-rose-600">
                Sign out
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            className="mt-6 h-14 items-center justify-center rounded-2xl border border-[#6049E8] bg-white"
            onPress={() => router.push("/role")}
          >
            <Text className="text-sm font-bold text-[#6049E8]">
              Sign in or create account
            </Text>
          </Pressable>
        )}

        <View className="mt-5 items-center">
          <BrandLogo compact />
          <Text className="text-xs text-slate-400">Find your place</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
