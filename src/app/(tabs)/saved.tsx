import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PropertyCard } from "../../components/property-card";
import { usePropertyCatalog } from "../../context/property-catalog";
import { useSavedProperties } from "../../context/saved-properties";

export default function SavedScreen() {
  const { savedIds } = useSavedProperties();
  const { properties } = usePropertyCatalog();
  const savedProperties = properties.filter((property) =>
    savedIds.has(property.id),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="pt-4 text-2xl font-extrabold text-slate-900">
          Saved homes
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          Keep your favorite places close.
        </Text>

        {savedProperties.length ? (
          <View className="mt-5 gap-4">
            {savedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>
        ) : (
          <View className="mt-8 items-center rounded-3xl bg-white px-7 py-12">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-violet-50">
              <Ionicons name="heart-outline" size={29} color="#6049E8" />
            </View>
            <Text className="mt-5 text-lg font-extrabold text-slate-900">
              No saved homes yet
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              Tap the heart on a home you love and it’ll show up here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
