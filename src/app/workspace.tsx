
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAccount } from "../context/account";
import { usePropertyCatalog } from "../context/property-catalog";

export default function WorkspaceScreen() {
  const { account } = useAccount();
  const { properties, loading, error } = usePropertyCatalog();

  if (!account) {
    return null;
  }

  const myProperties = properties.filter(
    (property) =>
      property.ownerId === account.id ||
      property.agentId === account.id
  );

  const activeListings = myProperties.filter(
    (property) => property.listingStatus === "Active"
  ).length;

  const pendingListings = myProperties.filter(
    (property) => property.listingStatus === "Pending"
  ).length;

  const isAgent = account.role === "agent";

  const menuItems = [
    {
      title: "My Listings",
      description: "Manage your properties",
      icon: "business-outline" as const,
      route: "/my-listings" as const,
    },
    {
      title: "Add Property",
      description: "Create a new property listing",
      icon: "add-circle-outline" as const,
      route: "/add-property" as const,
    },
    {
      title: "Property Inquiries",
      description: "View messages from interested buyers",
      icon: "chatbubble-ellipses-outline" as const,
      route: "/inquiries" as const,
    },
    {
      title: "Inspection Bookings",
      description: "Manage property inspections",
      icon: "calendar-outline" as const,
      route: "/inspection-bookings" as const,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 35 }}
      >
        <View className="px-5 pt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500">
                PROZONE PROFESSIONAL
              </Text>
              <Text className="mt-1 text-2xl font-bold text-[#19152D]">
                Dashboard
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="person-outline" size={23} color="#19152D" />
            </Pressable>
          </View>

          <View className="mt-6 rounded-2xl bg-[#3723B8] p-5">
            <Text className="text-sm text-white/80">
              Welcome back,
            </Text>

            <Text className="mt-1 text-2xl font-bold text-white">
              {account.name}
            </Text>

            <View className="mt-4 flex-row items-center">
              <View className="rounded-full bg-white/15 px-3 py-2">
                <Text className="text-sm font-semibold text-white">
                  {isAgent ? "Real Estate Agent" : "Property Owner"}
                </Text>
              </View>

              <View className="ml-2 flex-row items-center rounded-full bg-white/15 px-3 py-2">
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color="#FFFFFF"
                />
                <Text className="ml-1 text-xs font-semibold text-white">
                  Verified
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/add-property")}
            className="mt-4 flex-row items-center justify-center rounded-2xl bg-[#6049E8] py-4 px-4"
          >
            <Ionicons name="add-circle" size={22} color="white" />
            <Text className="ml-2.5 text-base font-bold text-white">
              Post & Add Property for Sale
            </Text>
          </Pressable>

          <Text className="mb-3 mt-7 text-lg font-bold text-[#19152D]">
            Listing Overview
          </Text>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#3723B8" />
            </View>
          ) : (
            <View className="flex-row">
              <View className="mr-3 flex-1 rounded-2xl bg-white p-4">
                <Ionicons
                  name="business-outline"
                  size={25}
                  color="#3723B8"
                />
                <Text className="mt-3 text-2xl font-bold text-[#19152D]">
                  {myProperties.length}
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Total listings
                </Text>
              </View>

              <View className="mr-3 flex-1 rounded-2xl bg-white p-4">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={25}
                  color="#16A34A"
                />
                <Text className="mt-3 text-2xl font-bold text-[#19152D]">
                  {activeListings}
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Active
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-white p-4">
                <Ionicons
                  name="time-outline"
                  size={25}
                  color="#D97706"
                />
                <Text className="mt-3 text-2xl font-bold text-[#19152D]">
                  {pendingListings}
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Pending
                </Text>
              </View>
            </View>
          )}

          {error ? (
            <Text className="mt-3 text-sm text-red-600">{error}</Text>
          ) : null}

          <Text className="mb-3 mt-8 text-lg font-bold text-[#19152D]">
            Manage Your Business
          </Text>

          {menuItems.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.route)}
              className="mb-3 flex-row items-center rounded-2xl bg-white p-4"
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#F0EDFF]">
                <Ionicons
                  name={item.icon}
                  size={24}
                  color="#3723B8"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-bold text-[#19152D]">
                  {item.title}
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  {item.description}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9CA3AF"
              />
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            className="mt-4 flex-row items-center justify-center rounded-xl border border-[#3723B8] py-4"
          >
            <Ionicons name="person-outline" size={19} color="#3723B8" />
            <Text className="ml-2 font-semibold text-[#3723B8]">
              My Account and Profile
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
