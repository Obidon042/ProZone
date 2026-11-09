import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../../components/back-button";
import { PropertyCard } from "../../components/property-card";
import { useAccount } from "../../context/account";
import { usePropertyCatalog } from "../../context/property-catalog";

export default function AgentProfileScreen() {
  const { id, property: propertyParam } = useLocalSearchParams<{
    id: string;
    property?: string;
  }>();
  const { account } = useAccount();
  const { properties } = usePropertyCatalog();
  const isSampleProfile = id === "demo-agent";
  const agentProperties = properties.filter(
    (property) =>
      property.agentId === id && property.listingStatus === "Active",
  );
  const name =
    isSampleProfile
      ? "ProZone Sample Agent"
      : agentProperties[0]?.listedBy ??
        (account?.id === id ? account.name : "Agent profile");
  const contactProperty =
    agentProperties.find((property) => property.id === propertyParam) ??
    agentProperties[0];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          Agent Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 items-center rounded-3xl bg-white px-5 py-7">
          <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-violet-50 bg-violet-100">
            <Ionicons name="person" size={36} color="#6049E8" />
          </View>
          <View className="mt-4 flex-row items-center">
            <Text className="text-xl font-extrabold text-slate-900">
              {name}
            </Text>
          </View>
          <View className="mt-2 rounded-full bg-violet-50 px-3 py-1.5">
            <Text className="text-xs font-semibold text-[#6049E8]">
              {isSampleProfile ? "Sample agent profile" : "Agent profile"}
            </Text>
          </View>

          <View className="mt-6 w-full flex-row rounded-2xl bg-[#F8F8FC] py-4">
            <AgentStat
              value={`${agentProperties.length}`}
              label="Properties"
              icon="home-outline"
            />
          </View>

          <Text className="mt-5 text-center text-sm leading-6 text-slate-600">
            {isSampleProfile
              ? "This is sample listing data. Agent identity, credentials, and reviews will be provided by the connected marketplace."
              : "View this agent’s active property listings."}
          </Text>

          {contactProperty ? (
            <Pressable
              accessibilityRole="button"
              className="mt-5 h-12 w-full flex-row items-center justify-center rounded-xl bg-[#6049E8]"
              onPress={() =>
                router.push({
                  pathname: "/contact-agent/[id]",
                  params: { id: contactProperty.id },
                })
              }
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="white"
              />
              <Text className="ml-2 text-sm font-bold text-white">
                Contact Agent
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-slate-900">
            Properties by {name}
          </Text>
          <Text className="text-xs text-slate-500">
            {agentProperties.length} listings
          </Text>
        </View>
        <View className="gap-4">
          {agentProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
          {!agentProperties.length ? (
            <Text className="rounded-2xl bg-white px-5 py-7 text-center text-sm text-slate-500">
              No active listings are available on this profile yet.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AgentStat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: "home-outline";
}) {
  return (
    <View className="flex-1 items-center">
      <Ionicons
        name={icon}
        size={17}
        color="#6049E8"
      />
      <Text className="mt-1 text-sm font-bold text-slate-900">{value}</Text>
      <Text className="mt-0.5 text-[10px] text-slate-500">{label}</Text>
    </View>
  );
}
