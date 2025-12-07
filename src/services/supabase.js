import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Missing Supabase environment variables");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "Set" : "Missing");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Missing");
  console.error(
    "💡 Please create a .env.local file with your Supabase credentials"
  );
  console.error("💡 See START_HERE.md for setup instructions");

  // Create a dummy client to prevent crashes, but it won't work
  // This allows the app to load and show error messages
  supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
} else {
  // Log configuration (without exposing the key)
  if (isBrowser) {
    console.log("✅ Supabase configured:", {
      url: supabaseUrl,
      keyPresent: !!supabaseAnonKey,
      isLocalhost:
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
    });
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: "sb-auth-token",
    },
  });
}

export { supabase };
