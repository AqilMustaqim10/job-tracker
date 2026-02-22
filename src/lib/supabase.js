// Import the function that creates a Supabase client
import { createClient } from "@supabase/supabase-js";

// Read our credentials from the .env file
// Vite exposes env variables through import.meta.env
// Variables MUST start with VITE_ to be accessible in the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export a single Supabase client
// We export it so every file in our app can import and reuse
// the same connection — no need to recreate it every time
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
