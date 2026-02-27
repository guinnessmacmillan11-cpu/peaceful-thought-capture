export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: string;
  reason: string;
  timestamp: string; // ISO
}

let moodHistory: MoodEntry[] = [];
let listeners: Set<() => void> = new Set();

// Cached snapshots to prevent useSyncExternalStore infinite loops
let cachedHistory = moodHistory;
let cachedWeekMoods: MoodEntry[] = [];
let cachedTodayMood: MoodEntry | undefined = undefined;
let snapshotVersion = 0;
let lastWeekVersion = -1;
let lastTodayVersion = -1;

function notify() {
  snapshotVersion++;
  cachedHistory = [...moodHistory];
  listeners.forEach((l) => l());
}

export function getMoodHistory(): MoodEntry[] {
  return cachedHistory;
}

export function getMoodForDate(date: string): MoodEntry | undefined {
  return moodHistory.find((e) => e.date === date);
}

export function getWeekMoods(): MoodEntry[] {
  if (lastWeekVersion === snapshotVersion) return cachedWeekMoods;
  lastWeekVersion = snapshotVersion;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const startStr = weekAgo.toISOString().split("T")[0];
  cachedWeekMoods = moodHistory.filter((e) => e.date >= startStr).sort((a, b) => a.date.localeCompare(b.date));
  return cachedWeekMoods;
}

export function getTodayMood(): MoodEntry | undefined {
  if (lastTodayVersion === snapshotVersion) return cachedTodayMood;
  lastTodayVersion = snapshotVersion;
  const today = new Date().toISOString().split("T")[0];
  cachedTodayMood = moodHistory.find((e) => e.date === today);
  return cachedTodayMood;
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

export function subscribeMoods(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Load from localStorage
try {
  const stored = localStorage.getItem("calm-moods");
  if (stored) {
    moodHistory = JSON.parse(stored);
    cachedHistory = moodHistory;
  }
} catch {}
