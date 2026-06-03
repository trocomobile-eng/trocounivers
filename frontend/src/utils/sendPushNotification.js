const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function sendPushNotification(receiverId, title, body, url = "/exchanges") {
  if (!receiverId) return;
  try {
    await fetch(`${BACKEND_URL}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: receiverId, title, body, url }),
    });
  } catch {
    // Non-bloquant — la notif push est best-effort
  }
}
