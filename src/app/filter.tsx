import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { usePropertyCatalog } from "../context/property-catalog";
import { useSearchFilters, type SearchFilters } from "../context/search-filters";

const propertyTypes = ["All", "House", "Apartment", "Villa"] as const;
const listingTypes = ["For Rent", "For Sale"] as const;
const bedroomOptions = [
  { label: "Any", value: null },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4+", value: 4 },
] as const;
const sliderMaximum = 1_500_000_000;

export default function FilterScreen() {
  const { filters, setFilters, clearFilters } = useSearchFilters();
  const { properties } = usePropertyCatalog();
  const [draft, setDraft] = useState(filters);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [showLocations, setShowLocations] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const activePriceThumb = useRef<"minimumPrice" | "maximumPrice" | null>(null);

  const update = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    clearFilters();
    setDraft({
      propertyType: "All",
      listingType: "All",
      minimumPrice: "",
      maximumPrice: "",
      location: "All locations",
      bedrooms: null,
    });
  };

  const apply = () => {
    const minimum = Number(draft.minimumPrice) || 0;
    const maximum = Number(draft.maximumPrice) || Infinity;
    if (maximum < minimum) {
      return;
    }
    setFilters(draft);
    handleSafeBack("/(tabs)/search");
  };

  const updatePriceFromSlider = (locationX: number) => {
    if (!sliderWidth || !activePriceThumb.current) {
      return;
    }

    const fraction = Math.min(1, Math.max(0, locationX / sliderWidth));
    const value = Math.round((fraction * sliderMaximum) / 1_000_000) * 1_000_000;
    const minimum = Number(draft.minimumPrice) || 0;
    const maximum = Number(draft.maximumPrice) || sliderMaximum;

    if (activePriceThumb.current === "minimumPrice") {
      const nextMinimum = Math.min(value, maximum);
      update("minimumPrice", nextMinimum === 0 ? "" : String(nextMinimum));
    } else {
      const nextMaximum = Math.max(value, minimum);
      update(
        "maximumPrice",
        nextMaximum === sliderMaximum ? "" : String(nextMaximum),
      );
    }
  };

  const minimumPrice = Number(draft.minimumPrice) || 0;
  const maximumPrice = Number(draft.maximumPrice) || sliderMaximum;
  const minimumPosition = `${(minimumPrice / sliderMaximum) * 100}%`;
  const maximumPosition = `${(maximumPrice / sliderMaximum) * 100}%`;
  const locations = [
    "All locations",
    ...Array.from(
      new Map(
        properties.map((property) => [
          property.location.trim().toLocaleLowerCase(),
          property.location.trim(),
        ]),
      ).values(),
    ),
  ];
  const normalizedLocationQuery = locationQuery.trim().toLocaleLowerCase();
  const matchingLocations = locations.filter(
    (location) =>
      !normalizedLocationQuery ||
      location.toLocaleLowerCase().includes(normalizedLocationQuery),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/(tabs)/search")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="text-lg font-extrabold text-slate-900">Filter</Text>
        <Pressable accessibilityRole="button" onPress={reset}>
          <Text className="text-sm font-semibold text-[#6049E8]">Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <FilterSection title="Property Type">
          <View className="flex-row flex-wrap gap-2">
            {propertyTypes.map((type) => (
              <ChoicePill
                key={type}
                label={type}
                selected={draft.propertyType === type}
                onPress={() => update("propertyType", type)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Listing Type">
          <View className="flex-row gap-3">
            {listingTypes.map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected: draft.listingType === type }}
                className={`h-12 flex-1 items-center justify-center rounded-xl border ${draft.listingType === type
                    ? "border-[#6049E8] bg-violet-50"
                    : "border-slate-200 bg-white"
                  }`}
                onPress={() =>
                  update(
                    "listingType",
                    draft.listingType === type ? "All" : type,
                  )
                }
              >
                <Text
                  className={`text-sm font-semibold ${draft.listingType === type
                      ? "text-[#6049E8]"
                      : "text-slate-600"
                    }`}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Price Range">
          <Text className="mb-3 text-xs leading-5 text-slate-500">
            Set your budget in Nigerian naira.
          </Text>
          <View
            className="h-9 justify-center"
            onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => {
              const touchX = event.nativeEvent.locationX;
              const minimumX = (minimumPrice / sliderMaximum) * sliderWidth;
              const maximumX = (maximumPrice / sliderMaximum) * sliderWidth;
              activePriceThumb.current =
                Math.abs(touchX - minimumX) <= Math.abs(touchX - maximumX)
                  ? "minimumPrice"
                  : "maximumPrice";
              updatePriceFromSlider(touchX);
            }}
            onResponderMove={(event) =>
              updatePriceFromSlider(event.nativeEvent.locationX)
            }
            onResponderRelease={() => {
              activePriceThumb.current = null;
            }}
            onResponderTerminate={() => {
              activePriceThumb.current = null;
            }}
          >
            <View className="absolute left-0 right-0 h-1 rounded-full bg-violet-100" />
            <View
              className="absolute h-1 rounded-full bg-[#6049E8]"
              style={{
                left: minimumPosition,
                width: `${((maximumPrice - minimumPrice) / sliderMaximum) * 100}%`,
              }}
            />
            <View
              className="absolute h-4 w-4 rounded-full border-2 border-[#6049E8] bg-white"
              style={{
                left: minimumPosition,
                marginLeft: -8,
              }}
            />
            <View
              className="absolute h-4 w-4 rounded-full border-2 border-[#6049E8] bg-white"
              style={{
                left: maximumPosition,
                marginLeft: -8,
              }}
            />
          </View>
          <View className="mb-3 flex-row justify-between">
            <Text className="text-[10px] font-medium text-slate-500">
              ₦{minimumPrice.toLocaleString("en-NG")}
            </Text>
            <Text className="text-[10px] font-medium text-slate-500">
              ₦{maximumPrice.toLocaleString("en-NG")}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <PriceInput
              label="Minimum price"
              value={draft.minimumPrice}
              onChangeText={(value) => update("minimumPrice", value)}
            />
            <PriceInput
              label="Maximum price"
              value={draft.maximumPrice}
              onChangeText={(value) => update("maximumPrice", value)}
            />
          </View>
          {draft.minimumPrice &&
            draft.maximumPrice &&
            Number(draft.maximumPrice) < Number(draft.minimumPrice) ? (
            <Text className="mt-2 text-xs text-red-600">
              Maximum price must be greater than minimum price.
            </Text>
          ) : null}
        </FilterSection>

        <FilterSection title="Location">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showLocations }}
            className="h-12 flex-row items-center justify-between rounded-xl border border-slate-200 px-4"
            onPress={() => setShowLocations((current) => !current)}
          >
            <Text className="text-sm text-slate-700">{draft.location}</Text>
            <Ionicons
              name={showLocations ? "chevron-up" : "chevron-down"}
              size={17}
              color="#64748B"
            />
          </Pressable>
          {showLocations ? (
            <View className="mt-2 gap-2">
              <TextInput
                accessibilityLabel="Search locations"
                autoCapitalize="words"
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm text-slate-900"
                onChangeText={setLocationQuery}
                placeholder="Search a city or neighborhood"
                placeholderTextColor="#94A3B8"
                value={locationQuery}
              />
              {normalizedLocationQuery ? (
                <Pressable
                  accessibilityRole="button"
                  className="rounded-xl bg-violet-50 px-4 py-3"
                  onPress={() => {
                    update("location", locationQuery.trim());
                    setLocationQuery("");
                    setShowLocations(false);
                  }}
                >
                  <Text className="text-sm font-semibold text-[#6049E8]">
                    Search for “{locationQuery.trim()}”
                  </Text>
                </Pressable>
              ) : null}
              {matchingLocations.map((location) => (
                <Pressable
                  key={location}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: draft.location === location }}
                  className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${draft.location === location
                      ? "border-[#6049E8] bg-violet-50"
                      : "border-slate-200 bg-white"
                    }`}
                  onPress={() => {
                    update("location", location);
                    setLocationQuery("");
                    setShowLocations(false);
                  }}
                >
                  <Text
                    className={`text-sm ${draft.location === location
                        ? "font-semibold text-[#6049E8]"
                        : "text-slate-700"
                      }`}
                  >
                    {location}
                  </Text>
                  {draft.location === location ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#6049E8"
                    />
                  ) : null}
                </Pressable>
              ))}
              {matchingLocations.length === 0 && !normalizedLocationQuery ? (
                <Text className="px-4 py-3 text-sm text-slate-500">
                  No property locations are available yet.
                </Text>
              ) : null}
            </View>
          ) : null}
        </FilterSection>

        <FilterSection title="Bedrooms">
          <View className="flex-row gap-2">
            {bedroomOptions.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityState={{
                  selected: draft.bedrooms === option.value,
                }}
                className={`h-11 flex-1 items-center justify-center rounded-xl border ${draft.bedrooms === option.value
                    ? "border-[#6049E8] bg-[#6049E8]"
                    : "border-slate-200 bg-white"
                  }`}
                onPress={() => update("bedrooms", option.value)}
              >
                <Text
                  className={`text-sm font-semibold ${draft.bedrooms === option.value
                      ? "text-white"
                      : "text-slate-600"
                    }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </FilterSection>
      </ScrollView>

      <View className="border-t border-slate-100 px-5 pb-4 pt-3">
        <Pressable
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-center rounded-2xl bg-[#6049E8]"
          onPress={apply}
        >
          <Text className="text-[15px] font-bold text-white">Apply Filters</Text>
          <Ionicons
            className="ml-2"
            name="arrow-forward"
            size={18}
            color="white"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="border-b border-slate-100 py-5">
      <Text className="mb-3 text-[15px] font-bold text-slate-900">{title}</Text>
      {children}
    </View>
  );
}

function ChoicePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`rounded-full border px-4 py-2.5 ${selected
          ? "border-[#6049E8] bg-violet-50"
          : "border-slate-200 bg-white"
        }`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-semibold ${selected ? "text-[#6049E8]" : "text-slate-600"
          }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PriceInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View className="h-12 flex-1 flex-row items-center rounded-xl border border-slate-200 px-3">
      <Text className="mr-2 text-sm font-semibold text-slate-500">₦</Text>
      <TextInput
        accessibilityLabel={label}
        className="flex-1 text-sm text-slate-900"
        keyboardType="number-pad"
        onChangeText={(text) => onChangeText(text.replace(/\D/g, ""))}
        placeholder={label}
        placeholderTextColor="#94A3B8"
        value={value}
      />
    </View>
  );
}
