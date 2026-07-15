let TEACHER_PROFILE = null;
let TEACHER_CLASSES = [];
let TEACHER_STUDENTS = [];

(async function init() {
  const auth = await requireAuth("teacher");
  if (!auth) return;
  TEACHER_PROFILE = auth.profile;
  document.getElementById("user-chip").textContent = `${auth.profile.name} · ${auth.profile.subject || "Teacher"}`;
  document.getElementById("att-date").value = new Date().toISOString().slice(0, 10);

  await loadClasses();
  await loadStudents();

  document.getElementById("att-class").addEventListener("change", renderAttendanceRows);
  document.getElementById("hw-form").addEventListener("submit", handlePostHomework);

  if (TEACHER_CLASSES.length) renderAttendanceRows();
})();

async function loadClasses() {
  const { data: classes, error } = await supabase.from("classes").select("*").eq("teacher_id", TEACHER_PROFILE.id);
  const tbody = document.getElementById("classes-body");
  TEACHER_CLASSES = classes || [];

  if (error || !classes || !classes.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">No classes assigned yet — ask admin to add one.</td></tr>`;
  } else {
    tbody.innerHTML = classes.map(c => `
      <tr>
        <td>${c.subject}</td>
        <td class="mono">${c.room_name}</td>
        <td>${c.schedule || "-"}</td>
        <td><a class="btn" href="/video-call.html?room=${encodeURIComponent(c.room_name)}" target="_blank">Start class</a></td>
      </tr>
    `).join("");
  }

  const options = classes && classes.length ? classes.map(c => `<option value="${c.id}">${c.subject} (${c.room_name})</option>`).join("") : `<option value="">No classes</option>`;
  document.getElementById("att-class").innerHTML = options;
  document.getElementById("hw-class").innerHTML = options;
}

async function loadStudents() {
  const { data: students, error } = await supabase.from("profiles").select("*").eq("teacher_id", TEACHER_PROFILE.id).eq("role", "student");
  TEACHER_STUDENTS = students || [];
}

function renderAttendanceRows() {
  const classId = document.getElementById("att-class").value;
  const tbody = document.getElementById("attendance-body");
  if (!classId || !TEACHER_STUDENTS.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">No students assigned to this class yet.</td></tr>`;
    return;
  }
  const klass = TEACHER_CLASSES.find(c => c.id === classId);

  tbody.innerHTML = TEACHER_STUDENTS.map(s => `
    <tr id="row-${s.id}">
      <td>${s.name}</td>
      <td>
        <select id="status-${s.id}">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </td>
      <td>
        <button class="small" onclick="markAndGenerate('${s.id}', '${classId}')">Mark & generate message</button>
        <div id="msg-${s.id}" class="mt-16"></div>
      </td>
    </tr>
  `).join("");
}

async function markAndGenerate(studentId, classId) {
  const status = document.getElementById(`status-${studentId}`).value;
  const date = document.getElementById("att-date").value;
  const klass = TEACHER_CLASSES.find(c => c.id === classId);
  const student = TEACHER_STUDENTS.find(s => s.id === studentId);

  const { error } = await supabase.from("attendance").insert({ student_id: studentId, class_id: classId, status, date });
  const msgDiv = document.getElementById(`msg-${studentId}`);
  if (error) { msgDiv.innerHTML = `<div class="error-msg">${error.message}</div>`; return; }

  const message = attendanceMessage({ studentName: student.name, subject: klass.subject, status, date });
  msgDiv.innerHTML = `
    <div class="msg-box">${message}</div>
    <button class="btn-copy small" onclick="copyToClipboard(\`${message.replace(/`/g, "'")}\`, this)">Copy message</button>
  `;
}

async function handlePostHomework(e) {
  e.preventDefault();
  const errorEl = document.getElementById("hw-error");
  errorEl.textContent = "";

  const classId = document.getElementById("hw-class").value;
  const title = document.getElementById("hw-title").value.trim();
  const description = document.getElementById("hw-desc").value.trim();
  const dueDate = document.getElementById("hw-due").value;
  const klass = TEACHER_CLASSES.find(c => c.id === classId);

  if (!classId || !title) { errorEl.textContent = "Class and title are required."; return; }

  const { error } = await supabase.from("homework").insert({
    class_id: classId, teacher_id: TEACHER_PROFILE.id, title, description, due_date: dueDate || null
  });
  if (error) { errorEl.textContent = error.message; return; }

  const messagesDiv = document.getElementById("hw-messages");
  messagesDiv.innerHTML = `<div class="section-title small">WhatsApp messages ready to copy:</div>` + TEACHER_STUDENTS.map(s => {
    const message = homeworkMessage({ studentName: s.name, subject: klass.subject, title, description, dueDate });
    const safe = message.replace(/`/g, "'");
    return `
      <div class="card" style="margin-bottom:10px;">
        <div class="small muted">${s.name}</div>
        <div class="msg-box">${message}</div>
        <button class="btn-copy small" onclick="copyToClipboard(\`${safe}\`, this)">Copy message</button>
      </div>
    `;
  }).join("");

  document.getElementById("hw-form").reset();
}
