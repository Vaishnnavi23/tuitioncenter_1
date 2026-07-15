const SUPABASE_URL = "https://ltrguybbjeabtufkxbym.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NXOAbOdanfZGaRiN5peblg_i-UUV6K_";// public key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redirects to login if not authenticated. Returns {user, profile}.
async function requireAuth(allowedRole) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = "/index.html"; return null; }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) { window.location.href = "/index.html"; return null; }
  if (allowedRole && profile.role !== allowedRole) {
    window.location.href = `/${profile.role}.html`;
    return null;
  }
  return { user: session.user, profile };
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
}
