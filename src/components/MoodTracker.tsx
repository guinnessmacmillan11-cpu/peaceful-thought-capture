import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayMood, logMood, subscribeMoods, getMoodHistory } from "@/lib/mood-store";

const moods = [
  { emoji: "😊", label: "Great", key: "great", color: "hsl(var(--primary))" },
  { emoji: "😌", label: "Good", key: "good", color: "hsl(var(--primary))" },
  { emoji: "😐", label: "Okay", key: "okay", color: "hsl(var(--muted-foreground))" },
  { emoji: "😰", label: "Anxious", key: "anxious", color: "hsl(var(--accent))" },
  { emoji: "😢", label: "Sad", key: "sad", color: "hsl(var(--accent))" },
  { emoji: "😤", label: "Angry", key: "angry", color: "hsl(var(--destructive))" },
];

const reasonPrompts: Record<string, string[]> = {
  great: ["Feeling accomplished", "Good news", "Quality time", "Just grateful"],
  good: ["Productive day", "Nice weather", "Relaxed", "Something fun"],
  okay: ["Nothing special", "A bit tired", "Going through motions", "Mixed feelings"],
  anxious: ["Work stress", "Upcoming event", "Health worries", "Overthinking"],
  sad: ["Missing someone", "Feeling lonely", "Disappointed", "No reason"],
  angry: ["Conflict", "Frustration at work", "Feeling unheard", "Overwhelmed"],
};

export default function MoodTracker() {
  const todayMood = useSyncExternalStore(subscribeMoods, getTodayMood, getTodayMood);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "why" | "done">(todayMood ? "done" : "pick");

  const handleMoodSelect = (key: string) => {
    setSelectedMood(key);
    setStep("why");
  };

  const handleReasonSelect = (reason: string) => {
    if (selectedMood) {
      logMood(selectedMood, reason);
      setStep("done");
    }
  };

  const reset = () => {
    setSelectedMood(null);
    setStep("pick");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="w-full bg-card border border-border rounded-2xl p-5"
    >
      <AnimatePresence mode="wait">
        {step === "pick" && (
          <motion.div
            key="pick"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Check in</p>
            <p className="font-heading text-lg mb-4">How are you feeling?</p>
            <div className="grid grid-cols-3 gap-3">
              {moods.map((m) => (
                <motion.button
                  key={m.key}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMoodSelect(m.key)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "why" && selectedMood && (
          <motion.div
            key="why"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              You're feeling {moods.find((m) => m.key === selectedMood)?.label.toLowerCase()}
            </p>
            <p className="font-heading text-lg mb-4">What's behind it?</p>
            <div className="flex flex-col gap-2">
              {(reasonPrompts[selectedMood] || []).map((reason) => (
                <motion.button
                  key={reason}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleReasonSelect(reason)}
                  className="text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  {reason}
                </motion.button>
              ))}
              <button
                onClick={() => setStep("pick")}
                className="text-xs text-muted-foreground underline mt-1 self-start"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2"
          >
            <span className="text-4xl block mb-2">
              {moods.find((m) => m.key === (todayMood?.mood || selectedMood))?.emoji || "🌿"}
            </span>
            <p className="font-heading text-sm">
              Today: {moods.find((m) => m.key === (todayMood?.mood || selectedMood))?.label}
            </p>
            {todayMood?.reason && (
              <p className="text-xs text-muted-foreground mt-1">{todayMood.reason}</p>
            )}
            <button onClick={reset} className="text-xs text-muted-foreground underline mt-3">
              Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
