let ADMIN_PROFILE = null;

(async function init() {
  const auth = await requireAuth("admin");
  if (!auth) return;
  ADMIN_PROFILE = auth.profile;
  document.getElementById("user-chip").textContent = `${auth.profile.name} · Admin`;

  await loadStats();
  await loadUsers();
  await loadClasses();

  document.getElementById("nu-role").addEventListener("change", (e) => {
    const isTeacher = e.target.value === "teacher";
    const isStudent = e.target.value === "student";
    document.getElementById("nu-subject-wrap").style.display = isTeacher ? "block" : "none";
    document.getElementById("nu-teacher-wrap").style.display = isStudent ? "block" : "none";
  });

  document.getElementById("new-user-form").addEventListener("submit", handleCreateUser);
  document.getElementById("new-class-form").addEventListener("submit", handleCreateClass);
})();

async function loadStats() {
  const { data: users } = await supabase.from("profiles").select("role");
  const { data: classes } = await supabase.from("classes").select("id");
  document.getElementById("stat-teachers").textContent = (users || []).filter(u => u.role === "teacher").length;
  document.getElementById("stat-students").textContent = (users || []).filter(u => u.role === "student").length;
  document.getElementById("stat-classes").textContent = (classes || []).length;
}

async function loadUsers() {
  const { data: users, error } = await supabase.from("profiles").select("*").order("role");
  const tbody = document.getElementById("users-table-body");
  if (error || !users) { tbody.innerHTML = `<tr><td colspan="5" class="muted">Could not load users.</td></tr>`; return; }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.role}</td>
      <td>${u.subject || u.grade || "-"}</td>
      <td>${u.phone || "-"}</td>
      <td><button class="btn-ghost small" onclick="deleteUser('${u.id}')">Remove</button></td>
    </tr>
  `).join("");

  // Populate teacher dropdowns
  const teachers = users.filter(u => u.role === "teacher");
  const teacherOptions = teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  document.getElementById("nu-teacher").innerHTML = teacherOptions || `<option value="">No teachers yet</option>`;
  document.getElementById("nc-teacher").innerHTML = teacherOptions || `<option value="">No teachers yet</option>`;
}

async function loadClasses() {
  const { data: classes, error } = await supabase.from("classes").select("*, profiles!classes_teacher_id_fkey(name)");
  const tbody = document.getElementById("classes-table-body");
  if (error || !classes) { tbody.innerHTML = `<tr><td colspan="4" class="muted">Could not load classes.</td></tr>`; return; }

  tbody.innerHTML = classes.map(c => `
    <tr>
      <td>${c.subject}</td>
      <td>${c.profiles ? c.profiles.name : "-"}</td>
      <td class="mono">${c.room_name}</td>
      <td>${c.schedule || "-"}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="muted">No classes yet.</td></tr>`;
}

async function handleCreateUser(e) {
  e.preventDefault();
  const errorEl = document.getElementById("nu-error");
  errorEl.textContent = "";

  const role = document.getElementById("nu-role").value;
  const name = document.getElementById("nu-name").value.trim();
  const email = document.getElementById("nu-email").value.trim();
  const password = document.getElementById("nu-password").value;
  const phone = document.getElementById("nu-phone").value.trim();
  const subject = document.getElementById("nu-subject").value.trim();
  const teacherId = document.getElementById("nu-teacher").value;

  if (!name || !email || password.length < 6) {
    errorEl.textContent = "Name, email, and a 6+ character password are required.";
    return;
  }

  // Use a SEPARATE client (no session persistence) so signing up this new
  // user does not overwrite the admin's own logged-in session.
  const tempClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({ email, password });
  if (signUpError || !signUpData.user) {
    errorEl.textContent = signUpError ? signUpError.message : "Could not create account.";
    return;
  }

  const profileRow = { id: signUpData.user.id, role, name, phone: phone || null };
  if (role === "teacher") profileRow.subject = subject || null;
  if (role === "student") profileRow.teacher_id = teacherId || null;

  const { error: profileError } = await supabase.from("profiles").insert(profileRow);
  if (profileError) {
    errorEl.textContent = "Account created but profile setup failed: " + profileError.message;
    return;
  }

  document.getElementById("new-user-form").reset();
  document.getElementById("new-user-form").classList.add("hidden-form");
  await loadStats();
  await loadUsers();
}

async function deleteUser(id) {
  if (!confirm("Remove this user's profile? (Their login will remain unless removed in Supabase Auth too.)")) return;
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) { alert("Could not remove: " + error.message); return; }
  await loadStats();
  await loadUsers();
}

async function handleCreateClass(e) {
  e.preventDefault();
  const errorEl = document.getElementById("nc-error");
  errorEl.textContent = "";

  const teacherId = document.getElementById("nc-teacher").value;
  const subject = document.getElementById("nc-subject").value.trim();
  const roomName = document.getElementById("nc-room").value.trim();
  const schedule = document.getElementById("nc-schedule").value.trim();

  if (!teacherId || !subject || !roomName) { errorEl.textContent = "Teacher, subject, and room name are required."; return; }

  const { error } = await supabase.from("classes").insert({
    teacher_id: teacherId, subject, room_name: roomName, schedule: schedule || null
  });
  if (error) { errorEl.textContent = error.message; return; }

  document.getElementById("new-class-form").reset();
  document.getElementById("new-class-form").classList.add("hidden-form");
  await loadStats();
  await loadClasses();
}
