import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Settings, MessageSquare, X } from "lucide-react";
import { getEntries, subscribe, addEntry, type JournalEntry } from "@/lib/journal-store";
import { getMoodHistory, subscribeMoods, type MoodEntry } from "@/lib/mood-store";
import MoodChart from "@/components/MoodChart";

const moodEmoji: Record<string, string> = {
  anxious: "😰", sad: "😢", frustrated: "😤", hopeful: "😊", tired: "😴",
  reflective: "🌿", great: "😊", good: "😌", okay: "😐", angry: "😤",
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function JournalPage() {
  const entries = useSyncExternalStore(subscribe, getEntries, getEntries);
  const moodHistory = useSyncExternalStore(subscribeMoods, getMoodHistory, getMoodHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newEntryText, setNewEntryText] = useState("");
  const [newEntryMood, setNewEntryMood] = useState("reflective");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
    setSelectedDate(null);
  };

  const getDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getMoodForDay = (day: number): MoodEntry | undefined =>
    moodHistory.find((m) => m.date === getDateStr(day));

  const getEntriesForDay = (day: number): JournalEntry[] => {
    const dateStr = getDateStr(day);
    return entries.filter((e) => e.date.startsWith(dateStr));
  };

  const selectedDay = selectedDate ? parseInt(selectedDate.split("-")[2]) : null;
  const selectedEntries = selectedDay ? getEntriesForDay(selectedDay) : [];
  const selectedMood = selectedDay ? getMoodForDay(selectedDay) : undefined;
  const todayStr = now.toISOString().split("T")[0];

  const submitNewEntry = () => {
    if (!newEntryText.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      summary: newEntryText.trim(),
      mood: newEntryMood,
      messages: [{ role: "user", content: newEntryText.trim() }],
    };
    addEntry(entry);
    setNewEntryText("");
    setShowNewEntry(false);
  };

  const submitFeedback = () => {
    if (!feedbackText.trim()) return;
    // Store feedback locally for now
    try {
      const existing = JSON.parse(localStorage.getItem("calm-feedback") || "[]");
      existing.push({ text: feedbackText, date: new Date().toISOString() });
      localStorage.setItem("calm-feedback", JSON.stringify(existing));
    } catch {}
    setFeedbackText("");
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="min-h-[80vh] px-4 py-6 max-w-md mx-auto pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-2xl">Journal</h1>
          <p className="text-muted-foreground text-sm">Your story, day by day.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewEntry(true)} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Plus size={16} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
            <Settings size={16} />
          </button>
        </div>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-heading text-sm">Settings</p>
                <button onClick={() => setShowSettings(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Feedback</p>
                <p className="text-xs text-muted-foreground mb-2">Help us make this better for you.</p>
                {feedbackSent ? (
                  <p className="text-sm text-primary">Thank you for your feedback! 💚</p>
                ) : (
                  <>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="What would make this app better?"
                      className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2"
                    />
                    <button
                      onClick={submitFeedback}
                      disabled={!feedbackText.trim()}
                      className="text-sm bg-primary text-primary-foreground rounded-lg px-4 py-2 disabled:opacity-40"
                    >
                      Send Feedback
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Entry Modal */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-heading text-sm">New Journal Entry</p>
                <button onClick={() => setShowNewEntry(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {Object.entries(moodEmoji).slice(0, 6).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setNewEntryMood(key)}
                    className={`text-xl p-1.5 rounded-lg transition-all ${newEntryMood === key ? "bg-primary/20 scale-110" : "opacity-50"}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <textarea
                value={newEntryText}
                onChange={(e) => setNewEntryText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 mb-3"
                autoFocus
              />
              <button
                onClick={submitNewEntry}
                disabled={!newEntryText.trim()}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
              >
                Save Entry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <MoodChart />
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted"><ChevronLeft size={18} /></button>
          <p className="font-heading text-sm">{monthName}</p>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</span>
          ))}
          {Array.from({ length: offset }).map((_, i) => <span key={`e-${i}`} />)}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateStr(day);
            const mood = getMoodForDay(day);
            const hasEntries = entries.some((e) => e.date.startsWith(dateStr));
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                  isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                }`}
              >
                {day}
                {mood && !isSelected && <span className="absolute -bottom-0.5 text-[8px]">{moodEmoji[mood.mood]}</span>}
                {hasEntries && !mood && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="font-heading text-sm mb-1">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {selectedMood && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{moodEmoji[selectedMood.mood]}</span>
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{selectedMood.mood}</p>
                    {selectedMood.reason && <p className="text-xs text-muted-foreground/70">{selectedMood.reason}</p>}
                  </div>
                </div>
              )}
              {selectedEntries.length === 0 && !selectedMood ? (
                <p className="text-xs text-muted-foreground">Nothing recorded this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEntries.map((entry) => (
                    <div key={entry.id}>
                      <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="w-full text-left flex items-start gap-2">
                        <span className="text-sm mt-0.5">{entry.messages.length > 1 ? <MessageSquare size={14} className="text-primary" /> : moodEmoji[entry.mood] || "🌿"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                          <p className="text-sm leading-relaxed line-clamp-2">{entry.summary}</p>
                        </div>
                        {expandedId === entry.id ? <ChevronUp size={14} className="text-muted-foreground mt-1" /> : <ChevronDown size={14} className="text-muted-foreground mt-1" />}
                      </button>
                      <AnimatePresence>
                        {expandedId === entry.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pl-7 pt-2 space-y-1.5">
                              {entry.messages.map((msg, j) => (
                                <p key={j} className={`text-xs leading-relaxed ${msg.role === "user" ? "text-foreground" : "text-muted-foreground italic"}`}>
                                  <span className="font-medium">{msg.role === "user" ? "You" : "Guide"}:</span> {msg.content}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent entries */}
      {entries.length > 0 && !selectedDate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Recent entries</p>
          <div className="space-y-2">
            {entries.slice(0, 10).map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  const d = entry.date.split("T")[0];
                  setSelectedDate(d);
                  setViewYear(parseInt(d.split("-")[0]));
                  setViewMonth(parseInt(d.split("-")[1]) - 1);
                }}
                className="w-full text-left bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3"
              >
                <span className="text-lg">{entry.messages.length > 1 ? "💬" : moodEmoji[entry.mood] || "🌿"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  <p className="text-sm leading-relaxed line-clamp-1">{entry.summary}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {entries.length === 0 && !selectedDate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 text-center">
          <BookOpen size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Your entries will appear here.</p>
        </motion.div>
      )}
    </div>
  );
}
