import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../../components/back-button";
import { useAccount } from "../../context/account";
import { usePropertyInquiries } from "../../context/property-inquiries";
import { usePropertyCatalog } from "../../context/property-catalog";

export default function ContactAgentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { account } = useAccount();
  const { addInquiry } = usePropertyInquiries();
  const { properties } = usePropertyCatalog();
  const property = properties.find((item) => item.id === id);
  const [name, setName] = useState(account?.name ?? "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!property) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-base font-semibold text-slate-700">
          Property not found.
        </Text>
        <Pressable className="mt-4" onPress={() => handleSafeBack("/(tabs)")}>
          <Text className="font-semibold text-[#6049E8]">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const submitInquiry = async () => {
    if (!account) {
      router.push("/login");
      return;
    }
    if (property.ownerId && property.ownerId === account?.id) {
      setError("You cannot send an inquiry to your own listing.");
      return;
    }
    if (!name.trim() || phone.replace(/\D/g, "").length < 7 || !message.trim()) {
      setError("Enter your name, a valid phone number, and a message.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addInquiry({
        propertyId: property.id,
        senderName: name.trim(),
        senderPhone: phone.trim(),
        message: message.trim(),
      });
      router.replace("/inquiry-sent");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your inquiry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          Contact listing contact
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 rounded-2xl bg-white p-4">
          <Text className="text-sm font-bold text-slate-900">
            {property.name}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            {property.location}
          </Text>
        </View>
        <Text className="mb-1 mt-6 text-base font-extrabold text-slate-900">
          Send an inquiry
        </Text>
        <Text className="mb-4 text-xs leading-5 text-slate-500">
          Your contact details and message will be shared with the listing
          contact for follow-up.
        </Text>
        <View className="gap-3">
          <InquiryInput
            label="Your name"
            value={name}
            onChangeText={setName}
            placeholder="Full name"
          />
          <InquiryInput
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
          <TextInput
            accessibilityLabel="Your message"
            className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            multiline
            onChangeText={setMessage}
            placeholder="I’m interested in this property..."
            placeholderTextColor="#94A3B8"
            textAlignVertical="top"
            value={message}
          />
        </View>
        {error ? (
          <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          className="mt-5 h-12 items-center justify-center rounded-xl bg-[#6049E8]"
          disabled={submitting}
          onPress={() => void submitInquiry()}
        >
          <Text className="text-sm font-bold text-white">
            {submitting ? "Sending..." : "Send inquiry"}
          </Text>
        </Pressable>
        <Text className="mt-3 text-center text-[11px] leading-5 text-slate-400">
          Sign in to send a message and track it with the listing contact.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InquiryInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      value={value}
    />
  );
}
