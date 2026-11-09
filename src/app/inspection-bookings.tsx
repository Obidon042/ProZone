import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { useAccount } from "../context/account";
import {
  useInspectionBookings,
  type InspectionBooking,
} from "../context/inspection-bookings";

const bookingFilters = ["All", "Pending", "Confirmed", "Cancelled"] as const;

export default function InspectionBookingsScreen() {
  const { account } = useAccount();
  const {
    bookings,
    confirmBooking,
    cancelBooking,
    loading,
    error,
  } = useInspectionBookings();
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof bookingFilters)[number]>("All");
  const ownedBookings = bookings.filter(
    (booking) => booking.listingOwnerId === account?.id,
  );
  const visibleBookings = ownedBookings.filter(
    (booking) => activeFilter === "All" || booking.status === activeFilter,
  );
  const pendingCount = ownedBookings.filter(
    (booking) => booking.status === "Pending",
  ).length;

  const handleStatusChange = async (
    action: (id: string) => Promise<void>,
    id: string,
  ) => {
    setActionError("");
    try {
      await action(id);
    } catch (statusError) {
      setActionError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update this inspection request.",
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
        <View className="ml-4 flex-1">
          <Text className="text-base font-extrabold text-slate-900">
            Inspection bookings
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500">
            {pendingCount} awaiting confirmation
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 flex-row gap-2">
          {bookingFilters.map((filter) => {
            const selected = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`rounded-full px-4 py-2.5 ${selected ? "bg-[#6049E8]" : "bg-white"
                  }`}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  className={`text-xs font-semibold ${selected ? "text-white" : "text-slate-600"
                    }`}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error || actionError ? (
          <Text accessibilityRole="alert" className="mt-4 text-sm text-red-600">
            {actionError || error}
          </Text>
        ) : null}
        {loading ? (
          <Text className="mt-8 text-center text-sm text-slate-500">
            Loading inspection requests...
          </Text>
        ) : visibleBookings.length ? (
          <View className="mt-4 gap-3">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onConfirm={() =>
                  void handleStatusChange(confirmBooking, booking.id)
                }
                onCancel={() =>
                  void handleStatusChange(cancelBooking, booking.id)
                }
              />
            ))}
          </View>
        ) : (
          <View className="mt-8 items-center rounded-3xl bg-white px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-violet-50">
              <Ionicons
                name="calendar-outline"
                size={28}
                color="#6049E8"
              />
            </View>
            <Text className="mt-4 text-lg font-extrabold text-slate-900">
              No inspection bookings
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              Inspection requests for your listed properties will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingCard({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: InspectionBooking;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [year, month, day] = booking.date.split("-").map(Number);
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString(
    "en",
    { weekday: "short", month: "long", day: "numeric", year: "numeric" },
  );
  const confirmed = booking.status === "Confirmed";
  const cancelled = booking.status === "Cancelled";

  return (
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-extrabold text-slate-900">
            {booking.visitorName}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            {booking.visitorPhone}
          </Text>
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${confirmed ? "bg-emerald-50" : cancelled ? "bg-slate-100" : "bg-amber-50"
            }`}
        >
          <Text
            className={`text-[10px] font-bold ${confirmed ? "text-emerald-700" : cancelled ? "text-slate-600" : "text-amber-700"
              }`}
          >
            {booking.status}
          </Text>
        </View>
      </View>

      <View className="my-3 border-t border-slate-100" />
      <Text className="text-sm font-bold text-slate-800">
        {booking.propertyName}
      </Text>
      <Text className="mt-1 text-xs text-slate-500">
        {booking.propertyLocation}
      </Text>

      <View className="mt-3 flex-row items-center">
        <Ionicons name="calendar-outline" size={15} color="#6049E8" />
        <Text className="ml-2 text-xs font-medium text-slate-600">
          {formattedDate} · {booking.time}
        </Text>
      </View>

      {!confirmed && !cancelled ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 h-11 flex-row items-center justify-center rounded-xl bg-[#6049E8]"
          onPress={onConfirm}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="white" />
          <Text className="ml-2 text-sm font-bold text-white">
            Confirm visit
          </Text>
        </Pressable>
      ) : null}
      {!cancelled ? (
        <Pressable
          accessibilityRole="button"
          className="mt-3 h-10 items-center justify-center rounded-xl border border-rose-200"
          onPress={onCancel}
        >
          <Text className="text-sm font-semibold text-rose-600">
            Cancel visit
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
