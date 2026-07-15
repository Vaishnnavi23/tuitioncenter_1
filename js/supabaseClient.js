// Fill these in from your Supabase project: Settings > API
const SUPABASE_URL = "ltrquybbjeabtufkxbym";
const SUPABASE_ANON_KEY = "sb_secret_A8YUmSAWgC6xGaFZX3h-3Q_S51cZqpH";

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
