import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../../components/back-button";
import { usePropertyCatalog } from "../../context/property-catalog";

export default function PropertyGalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { properties } = usePropertyCatalog();
  const property = properties.find((item) => item.id === id);

  if (!property) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-base font-semibold text-slate-700">
          Property photos are unavailable.
        </Text>
        <Pressable className="mt-4" onPress={() => handleSafeBack("/(tabs)")}>
          <Text className="font-semibold text-[#6049E8]">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const photos = [
    property.image,
    ...properties
      .filter((item) => item.id !== property.id)
      .map((item) => item.image),
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <View className="items-center">
          <Text className="text-base font-extrabold text-slate-900">
            Property Gallery
          </Text>
          <Text className="text-[11px] text-slate-500">{property.name}</Text>
        </View>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-row flex-wrap justify-between gap-y-3 px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {photos.map((image, index) => (
          <View
            key={`${image}-${index}`}
            className="w-[48.5%] overflow-hidden rounded-xl bg-slate-100"
          >
            <Image
              accessibilityLabel={`${property.name} photo ${index + 1}`}
              className="h-40 w-full"
              resizeMode="cover"
              source={{ uri: image }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
