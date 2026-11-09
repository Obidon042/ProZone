import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { useAccount } from "../context/account";
import {
  useInspectionBookings,
  type InspectionBooking,
} from "../context/inspection-bookings";

export default function MyInspectionsScreen() {
  const { account } = useAccount();
  const { bookings, cancelBooking, loading, error } = useInspectionBookings();
  const [actionError, setActionError] = useState("");
  const myBookings = bookings.filter(
    (booking) => booking.visitorId === (account?.id ?? "guest"),
  );

  const handleCancel = async (id: string) => {
    setActionError("");
    try {
      await cancelBooking(id);
    } catch (cancelError) {
      setActionError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel this inspection request.",
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
          onPress={() => handleSafeBack("/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>
        <Text className="ml-4 text-base font-extrabold text-slate-900">
          My inspections
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
            Loading inspections...
          </Text>
        ) : myBookings.length ? (
          <View className="mt-5 gap-3">
            {myBookings.map((booking) => (
              <InspectionCard
                key={booking.id}
                booking={booking}
                onCancel={() => void handleCancel(booking.id)}
              />
            ))}
          </View>
        ) : (
          <View className="mt-8 items-center rounded-3xl bg-white px-6 py-10">
            <Ionicons name="calendar-outline" size={34} color="#6049E8" />
            <Text className="mt-4 text-lg font-extrabold text-slate-900">
              No visits booked
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              Book an inspection from a property page and track its status here.
            </Text>
            <Pressable
              accessibilityRole="button"
              className="mt-5 rounded-xl bg-[#6049E8] px-5 py-3"
              onPress={() => router.replace("/(tabs)/search")}
            >
              <Text className="text-sm font-bold text-white">
                Find a property
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InspectionCard({
  booking,
  onCancel,
}: {
  booking: InspectionBooking;
  onCancel: () => void;
}) {
  const [year, month, day] = booking.date.split("-").map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString("en", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const statusColor =
    booking.status === "Confirmed"
      ? "text-emerald-700"
      : booking.status === "Cancelled"
        ? "text-slate-500"
        : "text-amber-700";

  return (
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-base font-extrabold text-slate-900">
          {booking.propertyName}
        </Text>
        <Text className={`text-xs font-bold ${statusColor}`}>
          {booking.status}
        </Text>
      </View>
      <Text className="mt-1 text-xs text-slate-500">
        {booking.propertyLocation}
      </Text>
      <Text className="mt-3 text-sm font-medium text-slate-700">
        {date} · {booking.time}
      </Text>
      {booking.status !== "Cancelled" ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 self-start"
          onPress={onCancel}
        >
          <Text className="text-sm font-semibold text-rose-600">
            Cancel request
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
