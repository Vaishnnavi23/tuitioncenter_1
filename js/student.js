let STUDENT_PROFILE = null;

(async function init() {
  const auth = await requireAuth("student");
  if (!auth) return;
  STUDENT_PROFILE = auth.profile;
  document.getElementById("user-chip").textContent = `${auth.profile.name} · ${auth.profile.grade || "Student"}`;

  await loadClasses();
  await loadAttendance();
  await loadHomework();
})();

async function loadClasses() {
  const { data: classes, error } = await supabase.from("classes").select("*").eq("teacher_id", STUDENT_PROFILE.teacher_id);
  const tbody = document.getElementById("classes-body");
  if (error || !classes || !classes.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">No classes assigned yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = classes.map(c => `
    <tr>
      <td>${c.subject}</td>
      <td>${c.schedule || "-"}</td>
      <td><a class="btn" href="/video-call.html?room=${encodeURIComponent(c.room_name)}" target="_blank">Join class</a></td>
    </tr>
  `).join("");
}

async function loadAttendance() {
  const { data: records, error } = await supabase.from("attendance").select("*").eq("student_id", STUDENT_PROFILE.id).order("date", { ascending: false });
  const tbody = document.getElementById("attendance-body");
  if (error || !records || !records.length) {
    tbody.innerHTML = `<tr><td colspan="2" class="muted">No attendance records yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.date}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
    </tr>
  `).join("");
}

async function loadHomework() {
  const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", STUDENT_PROFILE.teacher_id);
  const classIds = (classes || []).map(c => c.id);
  const listDiv = document.getElementById("homework-list");

  if (!classIds.length) { listDiv.innerHTML = `<div class="muted">No homework yet.</div>`; return; }

  const { data: hw, error } = await supabase.from("homework").select("*").in("class_id", classIds).order("posted_at", { ascending: false });
  if (error || !hw || !hw.length) { listDiv.innerHTML = `<div class="muted">No homework yet.</div>`; return; }

  listDiv.innerHTML = hw.map(h => `
    <div class="card" style="margin-bottom:10px;">
      <div style="font-weight:600;">${h.title}</div>
      <div class="small muted mt-16">${h.description || ""}</div>
      <div class="small muted mt-16">Due: ${h.due_date || "not specified"}</div>
    </div>
  `).join("");
}
