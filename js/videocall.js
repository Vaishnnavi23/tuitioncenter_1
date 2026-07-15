(async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = "/index.html"; return; }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
  const displayName = profile ? profile.name : "Guest";

  const params = new URLSearchParams(window.location.search);
  const roomName = params.get("room");
  if (!roomName) { document.getElementById("jitsi-container").innerHTML = "<p class='muted'>No room specified.</p>"; return; }

  document.getElementById("room-title").textContent = `Live Class — ${roomName}`;

  const domain = "meet.jit.si";
  const options = {
    roomName: roomName,
    width: "100%",
    height: "100%",
    parentNode: document.getElementById("jitsi-container"),
    userInfo: { displayName },
    configOverwrite: { prejoinPageEnabled: false },
    interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false }
  };

  new JitsiMeetExternalAPI(domain, options);
})();
