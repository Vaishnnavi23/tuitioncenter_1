document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorMsg = document.getElementById("error-msg");
  errorMsg.textContent = "";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { errorMsg.textContent = error.message; return; }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (pErr || !profile) { errorMsg.textContent = "No profile found for this account. Contact admin."; return; }

  window.location.href = `/${profile.role}.html`;
});
