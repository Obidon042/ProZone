import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PropertyCard } from "../../components/property-card";
import { usePropertyCatalog } from "../../context/property-catalog";
import { useSearchFilters } from "../../context/search-filters";

const listingTypes = ["All", "For Rent", "For Sale"] as const;

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { filters, setFilters } = useSearchFilters();
  const { properties } = usePropertyCatalog();

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const minimumPrice = Number(filters.minimumPrice) || 0;
    const maximumPrice = Number(filters.maximumPrice) || Infinity;

    return properties.filter((property) => {
      const isAvailable =
        property.listingStatus === undefined ||
        property.listingStatus === "Active";
      const matchesQuery =
        !normalizedQuery ||
        `${property.name} ${property.location} ${property.category}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesListingType =
        filters.listingType === "All" ||
        (filters.listingType === "For Rent" && property.period === "month") ||
        (filters.listingType === "For Sale" && property.period === "total");
      const matchesType =
        filters.propertyType === "All" ||
        property.category === filters.propertyType;
      const matchesLocation =
        filters.location === "All locations" ||
        property.location
          .trim()
          .toLocaleLowerCase()
          .includes(filters.location.trim().toLocaleLowerCase());
      const matchesBedrooms =
        filters.bedrooms === null ||
        (filters.bedrooms === 4
          ? property.bedrooms >= 4
          : property.bedrooms === filters.bedrooms);
      const price = Number(property.price.replace(/\D/g, ""));
      const matchesPrice = price >= minimumPrice && price <= maximumPrice;

      return (
        matchesQuery &&
        matchesListingType &&
        matchesType &&
        matchesLocation &&
        matchesBedrooms &&
        matchesPrice &&
        isAvailable
      );
    });
  }, [filters, properties, query]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-3">
          <View className="h-10 w-10" />
          <Text className="text-lg font-extrabold text-slate-900">Search</Text>
          <Pressable
            accessibilityLabel="Open property filters"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center"
            onPress={() => router.push("/filter")}
          >
            <Ionicons name="options-outline" size={21} color="#6049E8" />
          </Pressable>
        </View>

        <View className="mt-4 h-12 flex-row items-center rounded-xl border border-slate-100 bg-white px-3">
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            accessibilityLabel="Search properties"
            autoCapitalize="none"
            className="ml-2 flex-1 text-xs text-slate-900"
            onChangeText={setQuery}
            placeholder="Search for a place"
            placeholderTextColor="#94A3B8"
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        <View className="mt-4 flex-row gap-2">
          {listingTypes.map((type) => {
            const selected =
              (type === "All" && filters.listingType === "All") ||
              type === filters.listingType;
            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                className={`rounded-full px-4 py-2 ${
                  selected ? "bg-[#6049E8]" : "bg-white"
                }`}
                onPress={() => {
                  setFilters({
                    ...filters,
                    listingType: type === "All" ? "All" : type,
                  });
                }}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    selected ? "text-white" : "text-slate-600"
                  }`}
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-3 mt-5 flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-slate-900">
            {filters.location === "All locations"
              ? "All Results"
              : filters.location}
          </Text>
          <Text className="text-[10px] text-slate-500">
            {filteredProperties.length} properties
          </Text>
        </View>

        {filteredProperties.length ? (
          <View className="gap-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                layout="compact"
                property={property}
              />
            ))}
          </View>
        ) : (
          <View className="items-center rounded-2xl bg-white px-6 py-12">
            <Ionicons name="search-outline" size={32} color="#A78BFA" />
            <Text className="mt-3 text-base font-bold text-slate-800">
              No homes found
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-500">
              Try changing your search or filters.
            </Text>
            <Pressable
              accessibilityRole="button"
              className="mt-4"
              onPress={() => router.push("/filter")}
            >
              <Text className="text-sm font-semibold text-[#6049E8]">
                Edit filters
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
