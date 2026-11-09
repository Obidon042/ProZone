import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { useSavedProperties } from "../context/saved-properties";
import type { Property } from "../data/properties";

export function PropertyCard({
  property,
  width = "100%",
  layout = "default",
}: {
  property: Property;
  width?: number | `${number}%`;
  layout?: "default" | "compact";
}) {
  const { savedIds, toggleSaved } = useSavedProperties();
  const [saveError, setSaveError] = useState("");
  const isSaved = savedIds.has(property.id);

  return (
    <View
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-white ${
        layout === "compact" ? "flex-row" : ""
      }`}
      style={{ width }}
    >
      <View
        className="relative"
        style={{ width: layout === "compact" ? 108 : "100%" }}
      >
        <Pressable
          accessibilityLabel={`View ${property.name}`}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/property/[id]",
              params: { id: property.id },
            })
          }
        >
          <Image
            accessibilityLabel={property.name}
            className={`w-full bg-slate-100 ${
              layout === "compact" ? "h-28" : "h-44"
            }`}
            resizeMode="cover"
            source={{ uri: property.image }}
          />
        </Pressable>
        <View
          className={`absolute ${
            layout === "compact" ? "left-1.5 top-1.5 px-2 py-1" : "left-3 top-3 px-3 py-1.5"
          } rounded-full bg-white/95`}
        >
          <Text className="text-[9px] font-bold uppercase tracking-wide text-[#6049E8]">
            {property.period === "month" ? "For rent" : "For sale"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={isSaved ? "Remove from saved homes" : "Save home"}
          accessibilityRole="button"
          className={`absolute ${
            layout === "compact"
              ? "right-1.5 top-1.5 h-7 w-7"
              : "right-3 top-3 h-9 w-9"
          } items-center justify-center rounded-full bg-white/95`}
          onPress={() => {
            setSaveError("");
            void toggleSaved(property.id).catch((error: unknown) =>
              setSaveError(
                error instanceof Error ? error.message : "Unable to save property.",
              ),
            );
          }}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={layout === "compact" ? 16 : 19}
            color={isSaved ? "#E54870" : "#334155"}
          />
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel={`View details for ${property.name}`}
        accessibilityRole="button"
        className={`flex-1 ${layout === "compact" ? "justify-center p-3" : "p-4"}`}
        onPress={() =>
          router.push({
            pathname: "/property/[id]",
            params: { id: property.id },
          })
        }
      >
        <View className="flex-row items-start justify-between">
          <Text
            className="mr-2 flex-1 text-[15px] font-bold text-slate-900"
            numberOfLines={1}
          >
            {property.name}
          </Text>
          <Text className="text-[10px] font-semibold text-slate-500">
            {property.category}
          </Text>
        </View>
        <View className="mt-1 flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#94A3B8" />
          <Text className="ml-1 text-xs text-slate-500" numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        {layout === "default" ? (
          <View className="my-3 h-px bg-slate-100" />
        ) : null}

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-baseline">
            <Text
              className="text-[15px] font-extrabold text-[#6049E8]"
              numberOfLines={1}
            >
              {property.price}
            </Text>
            {property.period === "month" ? (
              <Text className="ml-1 text-[10px] text-slate-400">/ month</Text>
            ) : null}
          </View>
          {layout === "default" ? (
            <Text className="text-[10px] text-slate-500">
              {property.bedrooms} bd · {property.bathrooms} ba · {property.area} m²
            </Text>
          ) : null}
        </View>
        {layout === "compact" ? (
          <Text className="mt-1 text-[10px] text-slate-500">
            {property.bedrooms} bd · {property.bathrooms} ba · {property.area} m²
          </Text>
        ) : null}
      </Pressable>
      {saveError ? (
        <View className="absolute bottom-1 right-2 rounded bg-white px-2 py-1">
          <Text className="text-[10px] font-semibold text-rose-600">
            {saveError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
