import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { PropertyCard } from "../components/property-card";
import { usePropertyCatalog } from "../context/property-catalog";
import { useAccount } from "../context/account";

const statusFilters = ["All", "Active", "Pending", "Sold"] as const;

export default function MyListingsScreen() {
  const {
    properties,
    removeProperty,
    updateListingStatus,
    loading,
    error,
  } = usePropertyCatalog();
  const { account } = useAccount();
  const [activeFilter, setActiveFilter] =
    useState<(typeof statusFilters)[number]>("All");
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const myListings = properties.filter(
    (property) => property.ownerListing && property.ownerId === account?.id,
  );
  const filteredListings = myListings.filter(
    (property) =>
      activeFilter === "All" ||
      (property.listingStatus ?? "Active") === activeFilter,
  );

  const handleStatusChange = async (
    id: string,
    status: "Active" | "Pending" | "Sold",
  ) => {
    setActionError("");
    try {
      await updateListingStatus(id, status);
    } catch (statusError) {
      setActionError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update this listing.",
      );
    }
  };

  const handleRemove = async (id: string) => {
    setActionError("");
    try {
      await removeProperty(id);
      setPendingRemovalId(null);
    } catch (removeError) {
      setActionError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove this listing.",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/workspace")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="text-base font-extrabold text-slate-900">
          My Listings
        </Text>
        <Pressable
          accessibilityLabel="Add a property"
          className="h-10 w-10 items-center justify-center rounded-full bg-violet-50"
          onPress={() => router.push("/add-property")}
        >
          <Ionicons name="add" size={23} color="#6049E8" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-5"
        showsVerticalScrollIndicator={false}
      >
        {error || actionError ? (
          <Text accessibilityRole="alert" className="mt-4 text-sm text-red-600">
            {actionError || error}
          </Text>
        ) : null}
        {loading ? (
          <Text className="mt-8 text-center text-sm text-slate-500">
            Loading your listings...
          </Text>
        ) : null}
        <View className="mt-5 flex-row gap-2">
          {statusFilters.map((filter) => {
            const selected = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`rounded-full px-4 py-2.5 ${selected ? "bg-[#6049E8]" : "bg-white"
                  }`}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  className={`text-xs font-semibold ${selected ? "text-white" : "text-slate-600"
                    }`}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-3 mt-5 flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-slate-900">
            Your properties
          </Text>
          <Text className="text-xs text-slate-500">
            {filteredListings.length} listings
          </Text>
        </View>

        {!loading && filteredListings.length ? (
          <View className="gap-4">
            {filteredListings.map((property) => (
              <View
                key={property.id}
                className="overflow-hidden rounded-2xl bg-white"
              >
                <PropertyCard property={property} />
                <View className="flex-row items-center justify-between px-4 pb-3">
                  <View className="flex-row items-center">
                    <View
                      className={`mr-2 h-2 w-2 rounded-full ${property.listingStatus === "Active"
                          ? "bg-emerald-500"
                          : property.listingStatus === "Sold"
                            ? "bg-slate-400"
                            : "bg-amber-500"
                        }`}
                    />
                    <Text className="text-xs font-semibold text-slate-600">
                      {property.listingStatus ?? "Active"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        const nextStatus =
                          property.listingStatus === "Active"
                            ? "Pending"
                            : property.listingStatus === "Pending"
                              ? "Sold"
                              : "Active";
                        void handleStatusChange(property.id, nextStatus);
                      }}
                    >
                      <Text className="text-xs font-semibold text-[#6049E8]">
                        Mark as{" "}
                        {property.listingStatus === "Active"
                          ? "Pending"
                          : property.listingStatus === "Pending"
                            ? "Sold"
                            : "Active"}
                      </Text>
                    </Pressable>
                    {pendingRemovalId === property.id ? (
                      <Text className="text-xs text-slate-600">Remove this listing?</Text>
                    ) : null}
                    {pendingRemovalId === property.id ? (
                      <View className="flex-row items-center gap-3">
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setPendingRemovalId(null)}
                        >
                          <Text className="text-xs font-semibold text-slate-500">
                            Cancel
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`Confirm removal of ${property.name}`}
                          accessibilityRole="button"
                          onPress={() => {
                            void handleRemove(property.id);
                          }}
                        >
                          <Text className="text-xs font-bold text-rose-600">
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    ) : !loading ? (
                      <Pressable
                        accessibilityLabel={`Remove ${property.name}`}
                        accessibilityRole="button"
                        className="flex-row items-center"
                        onPress={() => setPendingRemovalId(property.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color="#E54870"
                        />
                        <Text className="ml-1 text-xs font-semibold text-rose-600">
                          Remove
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="mt-8 items-center rounded-3xl bg-white px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-violet-50">
              <Ionicons name="business-outline" size={28} color="#6049E8" />
            </View>
            <Text className="mt-4 text-lg font-extrabold text-slate-900">
              No listings yet
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              Add your first property to start managing your listings.
            </Text>
          </View>
        )}

      </ScrollView>
      <View className="border-t border-slate-200 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Add a property"
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-center rounded-2xl bg-[#6049E8]"
          onPress={() => router.push("/add-property")}
        >
          <Ionicons name="add-circle-outline" size={21} color="white" />
          <Text className="ml-2 text-base font-extrabold text-white">
            Add Property
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
