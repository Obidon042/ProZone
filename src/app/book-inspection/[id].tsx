import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../../components/back-button";
import { useAccount } from "../../context/account";
import { useInspectionBookings } from "../../context/inspection-bookings";
import { usePropertyCatalog } from "../../context/property-catalog";

const times = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "4:00 PM"];

export default function BookInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { account } = useAccount();
  const { properties } = usePropertyCatalog();
  const { addBooking } = useInspectionBookings();
  const property = properties.find((item) => item.id === id);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeError, setTimeError] = useState(false);
  const [visitorName, setVisitorName] = useState(account?.name ?? "");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorError, setVisitorError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });

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

  if (bookingConfirmed) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-7">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <Ionicons name="checkmark-circle" size={48} color="#22A06B" />
        </View>
        <Text className="mt-6 text-center text-2xl font-extrabold text-slate-900">
          Request sent
        </Text>
        <Text className="mt-3 text-center text-sm leading-6 text-slate-500">
          Your inspection request for{" "}
          {dates[selectedDate].toLocaleDateString("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          at {selectedTime} has been sent to the listing contact. Track the
          request and its status in My inspections.
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-8 h-12 w-full items-center justify-center rounded-xl bg-[#6049E8]"
          onPress={() => router.replace("/my-inspections")}
        >
          <Text className="text-sm font-bold text-white">View my inspections</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const confirmBooking = async () => {
    if (!account) {
      router.push("/login");
      return;
    }
    if (!visitorName.trim() || visitorPhone.trim().replace(/\D/g, "").length < 7) {
      setVisitorError("Enter your name and a valid phone number.");
      return;
    }
    if (!selectedTime) {
      setVisitorError("");
      setTimeError(true);
      return;
    }
    const date = dates[selectedDate];
    setSubmitting(true);
    try {
      await addBooking({
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
        propertyId: property.id,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        time: selectedTime,
      });
      setVisitorError("");
      setTimeError(false);
      setBookingConfirmed(true);
    } catch (bookingError) {
      setVisitorError(
        bookingError instanceof Error
          ? bookingError.message
          : "Unable to send your inspection request. Please try again.",
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
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => handleSafeBack("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          Book Inspection
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 flex-row items-center rounded-2xl bg-white p-3">
          <Image
            accessibilityLabel={property.name}
            className="h-16 w-20 rounded-xl bg-slate-100"
            resizeMode="cover"
            source={{ uri: property.image }}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
              {property.name}
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              {property.location}
            </Text>
            <Text className="mt-1 text-xs font-bold text-[#6049E8]">
              {property.price}
            </Text>
          </View>
        </View>

        <Text className="mb-1 mt-6 text-base font-extrabold text-slate-900">
          Your contact details
        </Text>
        <Text className="mb-3 text-xs text-slate-500">
          The listing contact will use these details to confirm your visit.
        </Text>
        <View className="gap-3">
          <TextInput
            accessibilityLabel="Your name"
            autoCapitalize="words"
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
            onChangeText={setVisitorName}
            placeholder="Full name"
            placeholderTextColor="#94A3B8"
            value={visitorName}
          />
          <TextInput
            accessibilityLabel="Your phone number"
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
            keyboardType="phone-pad"
            onChangeText={setVisitorPhone}
            placeholder="Phone number"
            placeholderTextColor="#94A3B8"
            value={visitorPhone}
          />
        </View>
        {visitorError ? (
          <Text accessibilityRole="alert" className="mt-2 text-xs text-red-600">
            {visitorError}
          </Text>
        ) : null}

        <Text className="mb-1 mt-7 text-base font-extrabold text-slate-900">
          Select Date
        </Text>
        <Text className="mb-4 text-xs text-slate-500">
          Choose a convenient day for your visit.
        </Text>
        <View className="flex-row justify-between rounded-2xl bg-white p-3">
          {dates.map((date, index) => {
            const selected = selectedDate === index;
            return (
              <Pressable
                key={date.toISOString()}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-w-9 items-center rounded-xl px-1.5 py-2 ${selected ? "bg-[#6049E8]" : ""
                  }`}
                onPress={() => setSelectedDate(index)}
              >
                <Text
                  className={`text-[9px] font-medium ${selected ? "text-violet-100" : "text-slate-400"
                    }`}
                >
                  {index === 0
                    ? "Today"
                    : date.toLocaleDateString("en", { weekday: "short" })}
                </Text>
                <Text
                  className={`mt-1 text-sm font-bold ${selected ? "text-white" : "text-slate-700"
                    }`}
                >
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {timeError ? (
          <Text accessibilityRole="alert" className="mt-2 text-xs text-red-600">
            Select an inspection time to continue.
          </Text>
        ) : null}

        <Text className="mb-1 mt-7 text-base font-extrabold text-slate-900">
          Select Time
        </Text>
        <Text className="mb-4 text-xs text-slate-500">
          Available times are shown in your local timezone.
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {times.map((time) => {
            const selected = selectedTime === time;
            return (
              <Pressable
                key={time}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`w-[31%] items-center rounded-xl border py-3 ${selected
                    ? "border-[#6049E8] bg-violet-50"
                    : "border-slate-200 bg-white"
                  }`}
                onPress={() => {
                  setSelectedTime(time);
                  setTimeError(false);
                }}
              >
                <Text
                  className={`text-xs font-semibold ${selected ? "text-[#6049E8]" : "text-slate-600"
                    }`}
                >
                  {time}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 flex-row rounded-xl bg-violet-50 p-3">
          <Ionicons name="information-circle-outline" size={17} color="#6049E8" />
          <Text className="ml-2 flex-1 text-xs leading-5 text-slate-600">
            This is a request only. The listing contact will confirm your
            appointment.
          </Text>
        </View>
      </ScrollView>

      <View className="border-t border-slate-200 bg-white px-5 py-3">
        <Pressable
          accessibilityLabel="Confirm inspection booking"
          accessibilityRole="button"
          className="h-14 w-full items-center justify-center rounded-2xl bg-[#6049E8]"
          disabled={submitting}
          onPress={() => void confirmBooking()}
        >
          <Text className="text-base font-extrabold text-white">
            {submitting ? "Sending request..." : "Confirm Booking"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
