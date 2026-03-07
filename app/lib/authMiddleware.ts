import { supabase } from "@/services/supabaseClient"

export async function requireAuth() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    // If no active session is found, throw an error to trigger a redirect
    throw new Error("Unauthorized")
  }

  return session.user
}