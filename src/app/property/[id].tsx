import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../../components/back-button";
import { useAccount } from "../../context/account";
import { usePropertyCatalog } from "../../context/property-catalog";
import { useSavedProperties } from "../../context/saved-properties";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { account } = useAccount();
  const { properties } = usePropertyCatalog();
  const { savedIds, toggleSaved } = useSavedProperties();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const property = properties.find((item) => item.id === id);

  if (!property) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8F8FC] px-6">
        <Ionicons name="home-outline" size={42} color="#A78BFA" />
        <Text className="mt-4 text-lg font-bold text-slate-900">
          Property not found
        </Text>
        <Pressable className="mt-4" onPress={() => handleSafeBack("/(tabs)")}>
          <Text className="font-semibold text-[#6049E8]">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isSaved = savedIds.has(property.id);
  const isOwnListing = property.ownerId === account?.id;
  const photos = [
    property.image,
    ...properties
      .filter((item) => item.id !== property.id)
      .slice(0, 3)
      .map((item) => item.image),
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="relative">
          <Image
            accessibilityLabel={property.name}
            className="h-[310px] w-full bg-slate-200"
            resizeMode="cover"
            source={{ uri: property.image }}
          />
          <View className="absolute left-5 right-5 top-3 flex-row justify-between">
            <CircleButton
              label="Go back"
              icon="arrow-back"
              onPress={() => handleSafeBack("/(tabs)")}
            />
            <View className="flex-row gap-2">
              <CircleButton
                label={isSaved ? "Remove from saved" : "Save property"}
                icon={isSaved ? "heart" : "heart-outline"}
                color={isSaved ? "#E54870" : "#1E293B"}
                onPress={() => toggleSaved(property.id)}
              />
              <CircleButton
                label="View property photos"
                icon="images-outline"
                onPress={() =>
                  router.push({
                    pathname: "/gallery/[id]",
                    params: { id: property.id },
                  })
                }
              />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            className="absolute bottom-4 right-5 flex-row items-center rounded-full bg-black/55 px-3 py-2"
            onPress={() =>
              router.push({
                pathname: "/gallery/[id]",
                params: { id: property.id },
              })
            }
          >
            <Ionicons name="images-outline" size={14} color="white" />
            <Text className="ml-1.5 text-xs font-semibold text-white">
              View all photos
            </Text>
          </Pressable>
        </View>

        <View className="-mt-3 rounded-t-3xl bg-[#F8F8FC] px-5 pt-5">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <View className="self-start rounded-full bg-violet-100 px-3 py-1">
                <Text className="text-[10px] font-bold uppercase text-[#6049E8]">
                  {property.period === "month" ? "For rent" : "For sale"}
                </Text>
              </View>
              <Text className="mt-2 text-xl font-extrabold text-slate-900">
                {property.name}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-extrabold text-[#6049E8]">
                {property.price}
              </Text>
              {property.period === "month" ? (
                <Text className="text-xs text-slate-500">per month</Text>
              ) : null}
            </View>
          </View>

          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text className="ml-1.5 text-sm text-slate-500">
              {property.location}
            </Text>
          </View>

          <View className="mt-5 flex-row rounded-2xl border border-slate-100 bg-white py-4">
            <PropertyStat icon="bed-outline" value={`${property.bedrooms}`} label="Bedrooms" />
            <View className="w-px bg-slate-100" />
            <PropertyStat icon="water-outline" value={`${property.bathrooms}`} label="Bathrooms" />
            <View className="w-px bg-slate-100" />
            <PropertyStat icon="resize-outline" value={`${property.area} m²`} label="Living area" />
          </View>

          <SectionHeading title="About this property" />
          <Text
            className="text-sm leading-6 text-slate-600"
            numberOfLines={descriptionExpanded ? undefined : 3}
          >
            {property.description ??
              `${property.name} is a thoughtfully designed ${property.category.toLowerCase()} in ${property.location}. Enjoy comfortable living spaces, quality finishes, and a convenient location close to the places that matter.`}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDescriptionExpanded((current) => !current)}
          >
            <Text className="mt-1 text-sm font-bold text-[#6049E8]">
              {descriptionExpanded ? "Read less" : "Read more"}
            </Text>
          </Pressable>

          <SectionHeading title="Property features" />
          <View className="flex-row flex-wrap gap-2">
            {["Modern kitchen", "Parking", "Natural light", "24/7 security"].map(
              (feature) => (
                <View
                  key={feature}
                  className="flex-row items-center rounded-xl bg-white px-3 py-2.5"
                >
                  <Ionicons name="checkmark-circle" size={15} color="#6049E8" />
                  <Text className="ml-1.5 text-xs font-medium text-slate-600">
                    {feature}
                  </Text>
                </View>
              ),
            )}
          </View>

          <SectionHeading title="Location" />
          <View className="flex-row items-center rounded-2xl border border-slate-100 bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <Ionicons name="map-outline" size={20} color="#6049E8" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-slate-800">
                {property.location}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Lagos, Nigeria
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
          </View>

          <SectionHeading title="Listed by" />
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center rounded-2xl border border-slate-100 bg-white p-4"
            onPress={() => {
              if (property.agentId || !property.ownerId) {
                router.push({
                  pathname: "/agent/[id]",
                  params: { id: property.agentId ?? "demo-agent" },
                });
              } else {
                router.push({
                  pathname: "/contact-agent/[id]",
                  params: { id: property.id },
                });
              }
            }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-violet-100">
              <Ionicons name="business" size={22} color="#6049E8" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-slate-900">
                {property.listedBy ?? "ProZone Sample Agent"}
              </Text>
              <View className="mt-1 flex-row items-center">
                <Text className="ml-1 text-[11px] text-slate-500">
                  {property.agentId
                    ? property.agentId === "demo-agent"
                      ? "Agent listing · sample profile"
                      : "Agent listing"
                    : property.ownerId
                      ? "Owner listing"
                      : "Sample listing"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
          </Pressable>

          <SectionHeading title="More photos" />
          <ScrollView
            horizontal
            contentContainerClassName="gap-3"
            showsHorizontalScrollIndicator={false}
          >
            {photos.map((image, index) => (
              <Pressable
                key={`${image}-${index}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/gallery/[id]",
                    params: { id: property.id },
                  })
                }
              >
                <Image
                  className="h-20 w-28 rounded-xl bg-slate-200"
                  resizeMode="cover"
                  source={{ uri: image }}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View className="border-t border-slate-200 bg-white px-5 py-3">
        <View className="flex-row items-center">
          <Pressable
            accessibilityRole="button"
            className={`mr-3 h-14 flex-1 flex-row items-center justify-center rounded-2xl border ${isOwnListing
                ? "border-slate-200 bg-slate-50"
                : "border-[#6049E8] bg-white"
              }`}
            onPress={() => {
              if (isOwnListing) {
                router.push("/my-listings");
              } else {
                router.push({
                  pathname: "/contact-agent/[id]",
                  params: { id: property.id },
                });
              }
            }}
          >
            <Ionicons
              name={isOwnListing ? "create-outline" : "chatbubble-ellipses-outline"}
              size={18}
              color={isOwnListing ? "#64748B" : "#6049E8"}
            />
            <Text
              className={`ml-2 text-sm font-extrabold ${isOwnListing ? "text-slate-600" : "text-[#6049E8]"
                }`}
            >
              {isOwnListing ? "Manage listing" : "Contact agent"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-14 flex-[1.35] flex-row items-center justify-center rounded-2xl bg-[#6049E8]"
            onPress={() =>
              isOwnListing
                ? router.push("/my-listings")
                : router.push({
                  pathname: "/book-inspection/[id]",
                  params: { id: property.id },
                })
            }
          >
            <Text className="text-sm font-extrabold text-white">
              {isOwnListing ? "Your listing" : "Book inspection"}
            </Text>
            <Ionicons
              className="ml-2"
              name={isOwnListing ? "checkmark" : "arrow-forward"}
              size={18}
              color="white"
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function CircleButton({
  label,
  icon,
  color = "#1E293B",
  onPress,
}: {
  label: string;
  icon: "arrow-back" | "heart" | "heart-outline" | "images-outline";
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-full bg-white/95"
      onPress={onPress}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}

function PropertyStat({
  icon,
  value,
  label,
}: {
  icon: "bed-outline" | "water-outline" | "resize-outline";
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Ionicons name={icon} size={19} color="#6049E8" />
      <Text className="mt-1 text-sm font-bold text-slate-800">{value}</Text>
      <Text className="mt-0.5 text-[10px] text-slate-500">{label}</Text>
    </View>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <Text className="mb-3 mt-6 text-base font-extrabold text-slate-900">
      {title}
    </Text>
  );
}
