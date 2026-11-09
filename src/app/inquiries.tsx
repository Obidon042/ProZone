import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { useAccount } from "../context/account";
import {
  usePropertyInquiries,
  type PropertyInquiry,
} from "../context/property-inquiries";

export default function InquiriesScreen() {
  const { account } = useAccount();
  const { inquiries, markContacted, loading, error } = usePropertyInquiries();
  const [actionError, setActionError] = useState("");
  const myInquiries = inquiries.filter(
    (inquiry) => inquiry.recipientId === account?.id,
  );

  const handleMarkContacted = async (id: string) => {
    setActionError("");
    try {
      await markContacted(id);
    } catch (markError) {
      setActionError(
        markError instanceof Error
          ? markError.message
          : "Unable to update this inquiry.",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/workspace")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          Property inquiries
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        {error || actionError ? (
          <Text accessibilityRole="alert" className="mt-4 text-sm text-red-600">
            {actionError || error}
          </Text>
        ) : null}
        {loading ? (
          <Text className="mt-8 text-center text-sm text-slate-500">
            Loading inquiries...
          </Text>
        ) : myInquiries.length ? (
          <View className="mt-5 gap-3">
            {myInquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                onMarkContacted={() => void handleMarkContacted(inquiry.id)}
              />
            ))}
          </View>
        ) : (
          <View className="mt-8 items-center rounded-3xl bg-white px-6 py-10">
            <Ionicons
              name="chatbubbles-outline"
              size={34}
              color="#6049E8"
            />
            <Text className="mt-4 text-lg font-extrabold text-slate-900">
              No inquiries yet
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              Messages about properties you list will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InquiryCard({
  inquiry,
  onMarkContacted,
}: {
  inquiry: PropertyInquiry;
  onMarkContacted: () => void;
}) {
  return (
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-extrabold text-slate-900">
            {inquiry.senderName}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            {inquiry.senderPhone}
          </Text>
        </View>
        <Text
          className={`text-xs font-bold ${
            inquiry.status === "New" ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {inquiry.status}
        </Text>
      </View>
      <View className="my-3 border-t border-slate-100" />
      <Text className="text-sm font-bold text-slate-800">
        {inquiry.propertyName}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600">
        {inquiry.message}
      </Text>
      {inquiry.status === "New" ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 h-10 items-center justify-center rounded-xl bg-[#6049E8]"
          onPress={onMarkContacted}
        >
          <Text className="text-sm font-bold text-white">Mark contacted</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
