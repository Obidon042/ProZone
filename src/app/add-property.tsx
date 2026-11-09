import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { useAccount } from "../context/account";
import { usePropertyCatalog } from "../context/property-catalog";
import type { Property } from "../data/properties";

const categories: Property["category"][] = ["House", "Apartment", "Villa"];
const transactions = [
  { label: "For Rent", period: "month" },
  { label: "For Sale", period: "total" },
] as const;

export default function AddPropertyScreen() {
  const { addProperty } = usePropertyCatalog();
  const { account, roleRequest } = useAccount();

  const isVerified = Boolean(
    account?.isVerified && (account.role === "owner" || account.role === "agent"),
  );
  const isApplicationSubmitted = Boolean(roleRequest?.applicationSubmitted);
  const requestedRole =
    roleRequest?.requestedRole ??
    (account?.role === "owner" ? "owner" : "agent");

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [area, setArea] = useState("180");
  const [category, setCategory] = useState<Property["category"]>("House");
  const [period, setPeriod] = useState<Property["period"]>("month");
  const [imageAsset, setImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const choosePhoto = async () => {
    if (!isVerified) {
      setError(
        "You cannot add property pictures until your document and government ID are verified.",
      );
      return;
    }

    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setImageAsset(result.assets[0]);
      }
    } catch (pickerError) {
      setError(
        pickerError instanceof Error
          ? pickerError.message
          : "Unable to open your photos.",
      );
    }
  };

  const publishListing = async () => {
    if (!isVerified) {
      setError(
        "You cannot add property pictures or publish properties for sale until your document and government ID are verified.",
      );
      return;
    }

    const numericPrice = Number(price.replace(/\D/g, ""));
    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathrooms);
    const numericArea = Number(area);
    const coverImage = imageAsset?.uri ?? "";
    if (!account || (account.role !== "owner" && account.role !== "agent")) {
      setError("Sign in with an owner or agent profile to publish a listing.");
      return;
    }
    if (
      !name.trim() ||
      !location.trim() ||
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 1 ||
      !Number.isInteger(numericBathrooms) ||
      numericBathrooms < 1 ||
      !Number.isFinite(numericArea) ||
      numericArea <= 0 ||
      !coverImage
    ) {
      setError(
        "Enter a name, location, valid price, positive room and area values, and a cover photo.",
      );
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addProperty({
        name: name.trim(),
        location: location.trim(),
        price: `₦${numericPrice.toLocaleString("en-NG")}`,
        period,
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        area: numericArea,
        category,
        image: coverImage,
        imageContentType: imageAsset?.mimeType ?? "image/jpeg",
        description:
          description.trim() ||
          `${name.trim()} is available in ${location.trim()}. Contact us to arrange a visit.`,
      });
      router.replace("/my-listings");
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Unable to publish the property. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top"]}>
      <View className="flex-row items-center border-b border-slate-100 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/workspace")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          Add Property
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Verification status banner if not verified */}
          {!isVerified ? (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <View className="flex-row items-center">
                <Ionicons name="shield-outline" size={22} color="#D97706" />
                <Text className="ml-2 text-sm font-bold text-amber-950">
                  {isApplicationSubmitted
                    ? "Verification in Progress"
                    : "Verification Required"}
                </Text>
              </View>
              <Text className="mt-1 text-xs leading-5 text-amber-900">
                {isApplicationSubmitted
                  ? "Your document and government ID have been submitted and are under review. You have access to this Add Property page, but adding property pictures and publishing for sale is locked until your verification is approved."
                  : "Please upload your document and government ID to unlock adding property pictures and publishing listings for sale."}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-3 self-start rounded-xl bg-amber-200/90 px-3.5 py-2"
                onPress={() =>
                  router.push({
                    pathname: "/verification",
                    params: { role: requestedRole },
                  })
                }
              >
                <Text className="text-xs font-bold text-amber-950">
                  {isApplicationSubmitted
                    ? "Check verification status"
                    : "Upload documents & ID"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Property Photos Section */}
          <View className="mb-2 mt-5 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-slate-900">
              Property photos
            </Text>
            {!isVerified ? (
              <View className="flex-row items-center rounded-full bg-amber-100 px-2.5 py-1">
                <Ionicons name="lock-closed" size={11} color="#B45309" />
                <Text className="ml-1 text-[11px] font-bold text-amber-900">
                  Locked
                </Text>
              </View>
            ) : null}
          </View>

          {!isVerified ? (
            <>
              <View className="h-40 items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Ionicons name="lock-closed-outline" size={24} color="#B45309" />
                </View>
                <Text className="mt-2 text-sm font-bold text-slate-900">
                  Adding Property Pictures Locked
                </Text>
                <Text className="mt-1 text-center text-xs text-slate-600 px-4">
                  You cannot add property pictures for sell until your document and government ID are verified.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                className="mt-3 h-12 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-100"
                onPress={() => {
                  setError(
                    "You cannot add property pictures until your document and government ID are verified.",
                  );
                }}
              >
                <Ionicons name="lock-closed-outline" size={17} color="#64748B" />
                <Text className="ml-2 text-sm font-semibold text-slate-500">
                  Choose property photo (Locked until verified)
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {imageAsset ? (
                <Image
                  className="h-48 w-full rounded-xl bg-slate-200"
                  resizeMode="cover"
                  source={{ uri: imageAsset.uri }}
                />
              ) : (
                <View className="h-36 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons name="image-outline" size={32} color="#94A3B8" />
                  <Text className="mt-2 text-xs text-slate-500">
                    Select a property photo to continue
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                className="mt-3 h-11 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white"
                onPress={() => void choosePhoto()}
              >
                <Ionicons name="images-outline" size={17} color="#6049E8" />
                <Text className="ml-2 text-sm font-semibold text-[#6049E8]">
                  {imageAsset ? "Choose a different photo" : "Choose property photo"}
                </Text>
              </Pressable>
              <Text className="mt-2 text-[11px] text-slate-500">
                JPG, PNG, or WebP photos are uploaded securely to ProZone.
              </Text>
            </>
          )}

          <FormLabel label="Property Name" />
          <FormInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Palm View Residence"
          />

          <FormLabel label="Property Type" />
          <View className="flex-row gap-2">
            {categories.map((item) => (
              <Choice
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>

          <FormLabel label="Location" />
          <FormInput
            value={location}
            onChangeText={setLocation}
            placeholder="Area, city"
          />

          <FormLabel label="Description (optional)" />
          <TextInput
            accessibilityLabel="Property description"
            className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
            multiline
            onChangeText={setDescription}
            placeholder="Describe the property and its key features"
            placeholderTextColor="#94A3B8"
            textAlignVertical="top"
            value={description}
          />

          <FormLabel label="Transaction Type" />
          <View className="flex-row gap-3">
            {transactions.map((transaction) => (
              <Choice
                key={transaction.period}
                label={transaction.label}
                selected={period === transaction.period}
                onPress={() => setPeriod(transaction.period)}
              />
            ))}
          </View>

          <FormLabel label="Price (₦)" />
          <FormInput
            value={price}
            onChangeText={(value) => setPrice(value.replace(/\D/g, ""))}
            placeholder="Enter price"
            keyboardType="number-pad"
          />

          <View className="mt-4 flex-row gap-3">
            <FormInput
              label="Bedrooms"
              value={bedrooms}
              onChangeText={(value) => setBedrooms(value.replace(/\D/g, ""))}
              keyboardType="number-pad"
            />
            <FormInput
              label="Bathrooms"
              value={bathrooms}
              onChangeText={(value) => setBathrooms(value.replace(/\D/g, ""))}
              keyboardType="number-pad"
            />
            <FormInput
              label="Area (m²)"
              value={area}
              onChangeText={(value) => setArea(value.replace(/\D/g, ""))}
              keyboardType="number-pad"
            />
          </View>

          {error ? (
            <Text accessibilityRole="alert" className="mt-4 text-sm text-red-600">
              {error}
            </Text>
          ) : null}

          {!isVerified ? (
            <View className="mt-6">
              <Pressable
                accessibilityRole="button"
                className="h-14 flex-row items-center justify-center rounded-2xl bg-slate-200"
                onPress={() => {
                  setError(
                    "You cannot add property pictures or publish properties for sale until your document and government ID are verified.",
                  );
                }}
              >
                <Ionicons name="lock-closed" size={17} color="#64748B" />
                <Text className="ml-2 text-sm font-bold text-slate-600">
                  Publish Property (Verification Required)
                </Text>
              </Pressable>
              <Text className="mt-2 text-center text-[11px] leading-5 text-slate-500">
                Adding pictures and publishing for sell will unlock once your document and ID are verified.
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                className="mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-[#6049E8]"
                disabled={submitting}
                onPress={() => void publishListing()}
              >
                <Text className="text-sm font-bold text-white">
                  {submitting ? "Publishing..." : "Publish Property"}
                </Text>
                <Ionicons className="ml-2" name="arrow-forward" size={17} color="white" />
              </Pressable>
              <Text className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                Listings are published to the ProZone marketplace after submission.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormLabel({ label }: { label: string }) {
  return (
    <Text className="mb-2 mt-4 text-xs font-bold text-slate-700">{label}</Text>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View className="flex-1">
      {label ? (
        <Text className="mb-2 text-xs font-bold text-slate-700">{label}</Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
      />
    </View>
  );
}

function Choice({
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
      className={`flex-1 items-center justify-center rounded-xl border px-3 py-3 ${
        selected ? "border-[#6049E8] bg-violet-50" : "border-slate-200 bg-white"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-semibold ${
          selected ? "text-[#6049E8]" : "text-slate-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
