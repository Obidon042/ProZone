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

type SavedPropertiesContextValue = {
  savedIds: Set<string>;
  loading: boolean;
  error: string | null;
  toggleSaved: (id: string) => Promise<void>;
};

const SavedPropertiesContext =
  createContext<SavedPropertiesContextValue | null>(null);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const { account } = useAccount();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadSaved = async () => {
      if (!account) {
        setSavedIds(new Set());
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await getSupabaseClient()
          .from("saved_properties")
          .select("property_id")
          .eq("user_id", account.id);
        if (queryError) {
          throw queryError;
        }
        if (active) {
          setSavedIds(new Set((data ?? []).map((row) => row.property_id)));
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load saved properties.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadSaved();
    return () => {
      active = false;
    };
  }, [account]);

  const toggleSaved = useCallback(
    async (id: string) => {
      if (!account) {
        throw new Error("Sign in to save and sync properties.");
      }
      setError(null);
      if (savedIds.has(id)) {
        const { error: deleteError } = await getSupabaseClient()
          .from("saved_properties")
          .delete()
          .eq("user_id", account.id)
          .eq("property_id", id);
        if (deleteError) {
          setError(deleteError.message);
          throw deleteError;
        }
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        return;
      }

      const { error: insertError } = await getSupabaseClient()
        .from("saved_properties")
        .insert({ user_id: account.id, property_id: id });
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      setSavedIds((current) => new Set(current).add(id));
    },
    [account, savedIds],
  );

  const value = useMemo(
    () => ({ savedIds, loading, error, toggleSaved }),
    [savedIds, loading, error, toggleSaved],
  );

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties() {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error(
      "useSavedProperties must be used within SavedPropertiesProvider",
    );
  }
  return context;
}
