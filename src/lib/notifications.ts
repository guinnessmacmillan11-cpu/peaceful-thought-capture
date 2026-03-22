// Push notification helpers for daily check-in reminders

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function scheduleLocalReminder() {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  const lastScheduled = localStorage.getItem("bao_reminder_scheduled");
  const today = new Date().toDateString();
  if (lastScheduled === today) return;

  localStorage.setItem("bao_reminder_scheduled", today);

  // Schedule for tomorrow morning 9am
  const now = new Date();
  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);
  const delay = tomorrow9am.getTime() - now.getTime();

  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("🐼 Hey! Bao misses you", {
        body: "Time for your daily check-in! Keep your streak going 🔥",
        icon: "/favicon.ico",
        tag: "bao-daily-reminder",
      });
    }
  }, delay);
}

export function sendStreakReminder(streak: number) {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  const messages = [
    `🔥 ${streak} day streak! Don't break it — check in today!`,
    `🐼 Bao believes in you! Day ${streak + 1} awaits!`,
    `✨ You're on a ${streak}-day roll. Keep it going!`,
  ];

  new Notification("🐼 Streak Check-in", {
    body: messages[Math.floor(Math.random() * messages.length)],
    icon: "/favicon.ico",
    tag: "bao-streak",
  });
}

export function sendBreathingReminder() {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  const messages = [
    "🧘 Time for a quick breathing session with Bao!",
    "🐼 Take 2 minutes to breathe and reset your mind.",
    "🌊 Feeling tense? Let's do a quick calm-down exercise.",
  ];

  new Notification("🐼 Anxiety Practice", {
    body: messages[Math.floor(Math.random() * messages.length)],
    icon: "/favicon.ico",
    tag: "bao-breathing",
  });
}

export function scheduleAnxietyReminder() {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  const lastScheduled = localStorage.getItem("bao_anxiety_scheduled");
  const today = new Date().toDateString();
  if (lastScheduled === today) return;

  localStorage.setItem("bao_anxiety_scheduled", today);

  // Schedule for afternoon 2pm
  const now = new Date();
  const today2pm = new Date(now);
  today2pm.setHours(14, 0, 0, 0);
  
  if (today2pm.getTime() <= now.getTime()) {
    // Already past 2pm today, schedule for tomorrow
    today2pm.setDate(today2pm.getDate() + 1);
  }

  const delay = today2pm.getTime() - now.getTime();

  setTimeout(() => {
    sendBreathingReminder();
  }, delay);
}
