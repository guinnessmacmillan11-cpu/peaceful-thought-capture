export interface JournalEntry {
  id: string;
  date: string;
  summary: string;
  mood: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

interface AppStore {
  journalEntries: JournalEntry[];
  addEntry: (entry: JournalEntry) => void;
}

// Simple zustand-like store using React state pattern
let entries: JournalEntry[] = [];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((l) => l());
}

export function getEntries() {
  return entries;
}

export function addEntry(entry: JournalEntry) {
  entries = [entry, ...entries];
  // persist to localStorage
  try {
    localStorage.setItem("calm-journal", JSON.stringify(entries));
  } catch {}
  notify();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Load from localStorage on init
try {
  const stored = localStorage.getItem("calm-journal");
  if (stored) entries = JSON.parse(stored);
} catch {}
