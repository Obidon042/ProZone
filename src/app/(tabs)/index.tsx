import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PropertyCard } from "../../components/property-card";
import { usePropertyCatalog } from "../../context/property-catalog";
import { useSearchFilters } from "../../context/search-filters";

export default function HomeScreen() {
  const { properties } = usePropertyCatalog();
  const { filters, setFilters } = useSearchFilters();

  const openCategory = (category: "all" | "apartment" | "house" | "rent") => {
    if (category === "all") {
      setFilters({ ...filters, propertyType: "All", listingType: "All" });
    } else if (category === "apartment") {
      setFilters({ ...filters, propertyType: "Apartment" });
    } else if (category === "house") {
      setFilters({ ...filters, propertyType: "House" });
    } else {
      setFilters({ ...filters, listingType: "For Rent" });
    }

    router.push("/(tabs)/search");
  };

  const availableProperties = properties.filter(
    (property) =>
      property.listingStatus === undefined ||
      property.listingStatus === "Active",
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 pb-4 pt-3">
          <View>
            <Text className="text-xs text-slate-500">Good morning,</Text>
            <Text className="mt-1 text-xl font-extrabold text-slate-900">
              Find your happy place
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Open your profile"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white"
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons name="person-outline" size={21} color="#334155" />
          </Pressable>
        </View>

        <View className="mx-5 mb-5 flex-row items-center rounded-2xl border border-slate-100 bg-white px-4 py-3.5">
          <Ionicons name="location" size={17} color="#6049E8" />
          <View className="ml-2 flex-1">
            <Text className="text-[10px] text-slate-400">Your location</Text>
            <Text className="text-sm font-semibold text-slate-800">
              Lagos, Nigeria
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </View>

        <Pressable
          accessibilityRole="button"
          className="mx-5 mb-6 h-14 flex-row items-center rounded-2xl bg-white px-4"
          onPress={() => router.push("/(tabs)/search")}
        >
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <Text className="ml-3 flex-1 text-sm text-slate-400">
            Search by area, city, or ZIP
          </Text>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#6049E8]">
            <Ionicons name="options-outline" size={18} color="white" />
          </View>
        </Pressable>

        <View className="mb-3 flex-row items-center justify-between px-5">
          <Text className="text-lg font-extrabold text-slate-900">
            Explore categories
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/(tabs)/search")}
          >
            <Text className="text-xs font-semibold text-[#6049E8]">
              See all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="mb-6"
          contentContainerClassName="gap-3 px-5"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <CategoryPill
            icon="home-outline"
            label="All homes"
            active={
              filters.propertyType === "All" && filters.listingType === "All"
            }
            onPress={() => openCategory("all")}
          />

          <CategoryPill
            icon="business-outline"
            label="Apartments"
            active={filters.propertyType === "Apartment"}
            onPress={() => openCategory("apartment")}
          />

          <CategoryPill
            icon="storefront-outline"
            label="Houses"
            active={filters.propertyType === "House"}
            onPress={() => openCategory("house")}
          />

          <CategoryPill
            icon="key-outline"
            label="For rent"
            active={filters.listingType === "For Rent"}
            onPress={() => openCategory("rent")}
          />
        </ScrollView>

        <View className="mb-3 flex-row items-center justify-between px-5">
          <View>
            <Text className="text-lg font-extrabold text-slate-900">
              Featured homes
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              Handpicked places for you
            </Text>
          </View>

          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/(tabs)/search")}
          >
            <Text className="text-xs font-semibold text-[#6049E8]">
              View all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="mb-6"
          contentContainerClassName="gap-4 px-5"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {availableProperties.slice(0, 3).map((property) => (
            <PropertyCard key={property.id} property={property} width={285} />
          ))}
        </ScrollView>

        <View className="mb-3 flex-row items-center justify-between px-5">
          <Text className="text-lg font-extrabold text-slate-900">
            More homes to explore
          </Text>
          <Ionicons name="sparkles-outline" size={18} color="#6049E8" />
        </View>

        <View className="gap-4 px-5">
          {availableProperties.slice(3).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryPill({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon:
    | "home-outline"
    | "business-outline"
    | "storefront-outline"
    | "key-outline";
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-row items-center rounded-full px-4 py-2.5 ${
        active ? "bg-[#6049E8]" : "border border-slate-100 bg-white"
      }`}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={active ? "white" : "#64748B"} />
      <Text
        className={`ml-2 text-xs font-semibold ${
          active ? "text-white" : "text-slate-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
