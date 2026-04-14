import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

// Server-only Supabase client (service role — bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);
