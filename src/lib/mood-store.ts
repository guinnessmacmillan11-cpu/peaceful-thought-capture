export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: string;
  reason: string;
  timestamp: string; // ISO
}

let moodHistory: MoodEntry[] = [];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((l) => l());
}

export function getMoodHistory() {
  return moodHistory;
}

export function getMoodForDate(date: string): MoodEntry | undefined {
  return moodHistory.find((e) => e.date === date);
}

export function getWeekMoods(): MoodEntry[] {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const startStr = weekAgo.toISOString().split("T")[0];
  return moodHistory.filter((e) => e.date >= startStr).sort((a, b) => a.date.localeCompare(b.date));
}

export function logMood(mood: string, reason: string) {
  const today = new Date().toISOString().split("T")[0];
  const existing = moodHistory.findIndex((e) => e.date === today);
  const entry: MoodEntry = { date: today, mood, reason, timestamp: new Date().toISOString() };
  if (existing >= 0) {
    moodHistory = moodHistory.map((e, i) => (i === existing ? entry : e));
  } else {
    moodHistory = [entry, ...moodHistory];
  }
  try {
    localStorage.setItem("calm-moods", JSON.stringify(moodHistory));
  } catch {}
  notify();
}

export function getTodayMood(): MoodEntry | undefined {
  const today = new Date().toISOString().split("T")[0];
  return moodHistory.find((e) => e.date === today);
}

export function subscribeMoods(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Load from localStorage
try {
  const stored = localStorage.getItem("calm-moods");
  if (stored) moodHistory = JSON.parse(stored);
} catch {}
