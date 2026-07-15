// Free, no-signup WhatsApp flow: generate the message text automatically,
// let staff copy it with one click, then paste into WhatsApp themselves.

function attendanceMessage({ studentName, subject, status, date }) {
  const line = status === "present" ? "was present in today's class" : "was marked absent from today's class";
  return `Hi! Update from the tuition center.\n\n${studentName} ${line} (${subject}, ${date}).\n\nThank you.`;
}

function homeworkMessage({ studentName, subject, title, description, dueDate }) {
  return `Hi! Homework update for ${studentName}.\n\nSubject: ${subject}\nTopic: ${title}\nDetails: ${description || "-"}\nDue: ${dueDate || "not specified"}\n\nPlease complete on time.`;
}

function classReminderMessage({ studentName, subject, schedule, roomLink }) {
  return `Hi ${studentName}! Reminder: your ${subject} class is scheduled for ${schedule}.\n\nJoin here: ${roomLink}`;
}

async function copyToClipboard(text, btnEl) {
  try {
    await navigator.clipboard.writeText(text);
    if (btnEl) {
      const original = btnEl.textContent;
      btnEl.textContent = "Copied ✓";
      setTimeout(() => { btnEl.textContent = original; }, 1500);
    }
  } catch (err) {
    alert("Could not copy automatically. Please select and copy the text manually.");
  }
}
