import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import type { Database } from "./supabase.types";

const FALLBACK_SUPABASE_URL = "https://pmckyukeapfwbysmvlhr.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_SYtpzi73s3_o5VxVI7MUew_EsyQJG10";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  FALLBACK_SUPABASE_URL;

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorage = {
  getItem: async (key: string) =>
    typeof localStorage === "undefined" ? null : localStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};

export const supabase =
  isSupabaseConfigured && supabaseUrl && supabaseKey
    ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: Platform.OS === "web" ? webStorage : secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
    : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env.local, then restart Expo.",
    );
  }
  return supabase;
}
