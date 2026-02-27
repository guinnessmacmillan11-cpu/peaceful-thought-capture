import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getEntries, subscribe, type JournalEntry } from "@/lib/journal-store";

const moodEmoji: Record<string, string> = {
  anxious: "😰",
  sad: "😢",
  frustrated: "😤",
  hopeful: "😊",
  tired: "😴",
  reflective: "🌿",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function JournalPage() {
  const entries = useSyncExternalStore(subscribe, getEntries, getEntries);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl mb-2">Your journal is empty</h2>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            After you talk things out, your conversations will be journaled here automatically.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-heading text-2xl mb-1">Journal</h1>
        <p className="text-muted-foreground text-sm mb-6">Your conversations, remembered.</p>
      </motion.div>

      <div className="space-y-3">
        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3"
              >
                <span className="text-xl mt-0.5">{moodEmoji[entry.mood] || "🌿"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>{formatDate(entry.date)}</span>
                    <span>·</span>
                    <span>{formatTime(entry.date)}</span>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2">{entry.summary}</p>
                </div>
                {expandedId === entry.id ? (
                  <ChevronUp size={16} className="text-muted-foreground mt-1 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground mt-1 shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {expandedId === entry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {entry.messages.map((msg, j) => (
                        <div
                          key={j}
                          className={`text-xs leading-relaxed ${
                            msg.role === "user" ? "text-foreground" : "text-muted-foreground italic"
                          }`}
                        >
                          <span className="font-medium">{msg.role === "user" ? "You" : "Guide"}:</span>{" "}
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
