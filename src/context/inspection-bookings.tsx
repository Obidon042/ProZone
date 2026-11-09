import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "./account";
import { getSupabaseClient } from "../lib/supabase";

export type InspectionBooking = {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorId: string;
  propertyId: string;
  listingOwnerId: string;
  propertyName: string;
  propertyLocation: string;
  date: string;
  time: string;
  status: "Pending" | "Confirmed" | "Cancelled";
};

type NewInspectionBooking = Pick<
  InspectionBooking,
  "visitorName" | "visitorPhone" | "propertyId" | "date" | "time"
>;

type InspectionBookingsContextValue = {
  bookings: InspectionBooking[];
  loading: boolean;
  error: string | null;
  addBooking: (booking: NewInspectionBooking) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
};

const InspectionBookingsContext =
  createContext<InspectionBookingsContextValue | null>(null);

function toStatus(status: "pending" | "confirmed" | "cancelled") {
  return status === "pending"
    ? "Pending"
    : status === "confirmed"
      ? "Confirmed"
      : "Cancelled";
}

export function InspectionBookingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { account } = useAccount();
  const [bookings, setBookings] = useState<InspectionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!account) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await getSupabaseClient()
        .from("inspection_bookings")
        .select(
          "id, property_id, property_title, property_location, visitor_id, recipient_id, visitor_name, visitor_phone, visit_date, visit_time, status",
        )
        .order("created_at", { ascending: false });
      if (queryError) {
        throw queryError;
      }
      setBookings(
        (data ?? []).map((row) => ({
          id: row.id,
          visitorName: row.visitor_name,
          visitorPhone: row.visitor_phone,
          visitorId: row.visitor_id,
          propertyId: row.property_id,
          listingOwnerId: row.recipient_id,
          propertyName: row.property_title,
          propertyLocation: row.property_location,
          date: row.visit_date,
          time: row.visit_time,
          status: toStatus(row.status),
        })),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load inspection requests.";
      setError(message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void Promise.resolve()
      .then(refresh)
      .catch(() => undefined);
  }, [refresh]);

  const addBooking = useCallback(
    async (booking: NewInspectionBooking) => {
      if (!account) {
        throw new Error("Sign in to request a property inspection.");
      }
      setError(null);
      const { error: insertError } = await getSupabaseClient()
        .from("inspection_bookings")
        .insert({
          property_id: booking.propertyId,
          visitor_id: account.id,
          visitor_name: booking.visitorName,
          visitor_phone: booking.visitorPhone,
          visit_date: booking.date,
          visit_time: booking.time,
        });
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      await refresh();
    },
    [account, refresh],
  );

  const changeStatus = useCallback(
    async (id: string, status: "confirmed" | "cancelled") => {
      setError(null);
      const { error: updateError } = await getSupabaseClient()
        .from("inspection_bookings")
        .update({ status })
        .eq("id", id);
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id
            ? {
                ...booking,
                status: status === "confirmed" ? "Confirmed" : "Cancelled",
              }
            : booking,
        ),
      );
    },
    [],
  );

  const confirmBooking = useCallback(
    (id: string) => changeStatus(id, "confirmed"),
    [changeStatus],
  );
  const cancelBooking = useCallback(
    (id: string) => changeStatus(id, "cancelled"),
    [changeStatus],
  );

  const value = useMemo(
    () => ({ bookings, loading, error, addBooking, confirmBooking, cancelBooking }),
    [bookings, loading, error, addBooking, confirmBooking, cancelBooking],
  );

  return (
    <InspectionBookingsContext.Provider value={value}>
      {children}
    </InspectionBookingsContext.Provider>
  );
}

export function useInspectionBookings() {
  const context = useContext(InspectionBookingsContext);
  if (!context) {
    throw new Error(
      "useInspectionBookings must be used within InspectionBookingsProvider",
    );
  }
  return context;
}
