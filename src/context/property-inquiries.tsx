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

export type PropertyInquiry = {
  id: string;
  propertyId: string;
  propertyName: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  message: string;
  createdAt: string;
  status: "New" | "Contacted";
};

type NewPropertyInquiry = Pick<
  PropertyInquiry,
  "propertyId" | "senderName" | "senderPhone" | "message"
>;

type PropertyInquiriesContextValue = {
  inquiries: PropertyInquiry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addInquiry: (inquiry: NewPropertyInquiry) => Promise<void>;
  markContacted: (id: string) => Promise<void>;
};

const PropertyInquiriesContext =
  createContext<PropertyInquiriesContextValue | null>(null);

export function PropertyInquiriesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { account } = useAccount();
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!account) {
      setInquiries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await getSupabaseClient()
        .from("property_inquiries")
        .select(
          "id, property_id, property_title, recipient_id, sender_id, sender_name, sender_phone, message, status, created_at",
        )
        .order("created_at", { ascending: false });
      if (queryError) {
        throw queryError;
      }

      setInquiries(
        (data ?? []).map((row) => ({
          id: row.id,
          propertyId: row.property_id,
          propertyName: row.property_title,
          recipientId: row.recipient_id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          senderPhone: row.sender_phone,
          message: row.message,
          createdAt: row.created_at,
          status: row.status === "new" ? "New" : "Contacted",
        })),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load property inquiries.";
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

  const addInquiry = useCallback(
    async (inquiry: NewPropertyInquiry) => {
      if (!account) {
        throw new Error("Sign in to contact the listing contact.");
      }
      setError(null);
      const { error: insertError } = await getSupabaseClient()
        .from("property_inquiries")
        .insert({
          property_id: inquiry.propertyId,
          sender_id: account.id,
          sender_name: inquiry.senderName,
          sender_phone: inquiry.senderPhone,
          message: inquiry.message,
        });
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      await refresh();
    },
    [account, refresh],
  );

  const markContacted = useCallback(async (id: string) => {
    setError(null);
    const { error: updateError } = await getSupabaseClient()
      .from("property_inquiries")
      .update({ status: "contacted" })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      throw updateError;
    }
    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, status: "Contacted" } : inquiry,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({ inquiries, loading, error, refresh, addInquiry, markContacted }),
    [inquiries, loading, error, refresh, addInquiry, markContacted],
  );

  return (
    <PropertyInquiriesContext.Provider value={value}>
      {children}
    </PropertyInquiriesContext.Provider>
  );
}

export function usePropertyInquiries() {
  const context = useContext(PropertyInquiriesContext);
  if (!context) {
    throw new Error(
      "usePropertyInquiries must be used within PropertyInquiriesProvider",
    );
  }
  return context;
}
