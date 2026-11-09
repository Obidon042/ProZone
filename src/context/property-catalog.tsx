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
import type { Property } from "../data/properties";
import type { Database } from "../lib/supabase.types";

type NewProperty = Omit<
  Property,
  "id" | "ownerListing" | "ownerId" | "listedBy" | "agentId" | "listingStatus"
> & { imageContentType: string };
type DatabaseProperty = Database["public"]["Tables"]["properties"]["Row"];

type PropertyCatalogContextValue = {
  properties: Property[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProperty: (property: NewProperty) => Promise<void>;
  updateListingStatus: (
    id: string,
    status: NonNullable<Property["listingStatus"]>,
  ) => Promise<void>;
  removeProperty: (id: string) => Promise<void>;
};

const PropertyCatalogContext =
  createContext<PropertyCatalogContextValue | null>(null);

function toListingStatus(
  status: "draft" | "active" | "pending" | "sold",
): NonNullable<Property["listingStatus"]> {
  return status === "active"
    ? "Active"
    : status === "pending"
      ? "Pending"
      : status === "sold"
        ? "Sold"
        : "Draft";
}

function toDatabaseStatus(
  status: NonNullable<Property["listingStatus"]>,
): "draft" | "active" | "pending" | "sold" {
  return status === "Active"
    ? "active"
    : status === "Pending"
      ? "pending"
      : status === "Sold"
        ? "sold"
        : "draft";
}

function toUserMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load properties.";
}

function mapProperty(
  row: DatabaseProperty,
  listedBy: string,
  currentUserId?: string,
): Property {
  return {
    id: row.id,
    name: row.title,
    location: row.location,
    price: `₦${Number(row.price).toLocaleString("en-NG")}`,
    period: row.price_period,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: Number(row.area),
    category: row.category,
    image: row.cover_image_url,
    description: row.description,
    ownerListing: row.owner_id === currentUserId,
    ownerId: row.owner_id,
    listedBy,
    agentId: row.agent_id ?? undefined,
    listingStatus: toListingStatus(row.listing_status),
  };
}

export function PropertyCatalogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { account } = useAccount();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      const { data, error: queryError } = await client
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (queryError) {
        throw queryError;
      }

      const userIds = [
        ...new Set(
          (data ?? [])
            .flatMap((property) => [property.owner_id, property.agent_id])
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const profileNames = new Map<string, string>();
      if (userIds.length) {
        const { data: profiles, error: profileError } = await client
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        if (profileError) {
          throw profileError;
        }
        for (const profile of profiles ?? []) {
          profileNames.set(profile.id, profile.display_name);
        }
      }

      setProperties(
        (data ?? []).map((row) =>
          mapProperty(
            row,
            profileNames.get(row.agent_id ?? row.owner_id) ?? "Property contact",
            account?.id,
          ),
        ),
      );
    } catch (loadError) {
      setError(toUserMessage(loadError));
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [account?.id]);

  useEffect(() => {
    void Promise.resolve()
      .then(refresh)
      .catch(() => undefined);
  }, [refresh, account?.id]);

  const addProperty = useCallback(
    async (property: NewProperty) => {
      if (
        !account ||
        (account.role !== "owner" && account.role !== "agent")
      ) {
        throw new Error("Sign in with an approved owner or agent profile to publish.");
      }
      if (!account.isVerified) {
        throw new Error(
          "Complete administrator identity verification before publishing properties.",
        );
      }
      setError(null);
      const client = getSupabaseClient();
      const allowedTypes = new Map([
        ["image/jpeg", "jpg"],
        ["image/png", "png"],
        ["image/webp", "webp"],
      ]);
      const extension = allowedTypes.get(property.imageContentType);
      if (!extension) {
        throw new Error("Choose a JPG, PNG, or WebP property photo.");
      }
      const imageResponse = await fetch(property.image);
      if (!imageResponse.ok) {
        throw new Error("Unable to read the selected property photo.");
      }
      const imageBytes = await imageResponse.arrayBuffer();
      if (imageBytes.byteLength > 10 * 1024 * 1024) {
        throw new Error("Property photos must be 10 MB or smaller.");
      }
      const imagePath = `${account.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${extension}`;
      const { error: uploadError } = await client.storage
        .from("property-images")
        .upload(imagePath, imageBytes, {
          contentType: property.imageContentType,
          upsert: false,
        });
      if (uploadError) {
        setError(uploadError.message);
        throw uploadError;
      }
      const coverImageUrl = client.storage
        .from("property-images")
        .getPublicUrl(imagePath).data.publicUrl;
      const { data, error: insertError } = await client
        .from("properties")
        .insert({
          owner_id: account.id,
          agent_id: account.role === "agent" ? account.id : null,
          title: property.name,
          location: property.location,
          price: Number(property.price.replace(/\D/g, "")),
          price_period: property.period,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          category: property.category,
          description: property.description ?? "",
          cover_image_url: coverImageUrl,
          listing_status: "active",
        })
        .select("*")
        .single();
      if (insertError) {
        const { error: cleanupError } = await client.storage
          .from("property-images")
          .remove([imagePath]);
        const message = cleanupError
          ? `${insertError.message} The uploaded photo could not be removed: ${cleanupError.message}`
          : insertError.message;
        setError(message);
        throw new Error(message);
      }
      setProperties((current) => [
        mapProperty(data, account.name, account.id),
        ...current,
      ]);
    },
    [account],
  );

  const updateListingStatus = useCallback(
    async (id: string, status: NonNullable<Property["listingStatus"]>) => {
      setError(null);
      const { data, error: updateError } = await getSupabaseClient()
        .from("properties")
        .update({ listing_status: toDatabaseStatus(status) })
        .eq("id", id)
        .select("*")
        .single();
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      if (data) {
        setProperties((current) =>
          current.map((property) =>
            property.id === id
              ? { ...property, listingStatus: toListingStatus(data.listing_status) }
              : property,
          ),
        );
      }
    },
    [],
  );

  const removeProperty = useCallback(
    async (id: string) => {
      setError(null);
      const client = getSupabaseClient();
      const { data, error: deleteError } = await client
        .from("properties")
        .delete()
        .eq("id", id)
        .select("id, cover_image_url")
        .single();
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }
      setProperties((current) => current.filter((property) => property.id !== id));
      const imagePath = data.cover_image_url
        .split("/storage/v1/object/public/property-images/")[1]
        ?.split("?")[0];
      if (imagePath) {
        const { error: cleanupError } = await client.storage
          .from("property-images")
          .remove([imagePath]);
        if (cleanupError) {
          const message = `Listing removed, but its photo could not be deleted: ${cleanupError.message}`;
          setError(message);
          throw new Error(message);
        }
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      properties,
      loading,
      error,
      refresh,
      addProperty,
      updateListingStatus,
      removeProperty,
    }),
    [
      properties,
      loading,
      error,
      refresh,
      addProperty,
      updateListingStatus,
      removeProperty,
    ],
  );

  return (
    <PropertyCatalogContext.Provider value={value}>
      {children}
    </PropertyCatalogContext.Provider>
  );
}

export function usePropertyCatalog() {
  const context = useContext(PropertyCatalogContext);
  if (!context) {
    throw new Error(
      "usePropertyCatalog must be used within PropertyCatalogProvider",
    );
  }
  return context;
}
