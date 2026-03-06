import { useState, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { getTodayMood, logMood, subscribeMoods } from "@/lib/mood-store";
import { X, Send } from "lucide-react";

const moods = [
  { emoji: "😊", face: "⌒‿⌒", label: "Happy", key: "great", bg: "bg-yellow-300", text: "text-yellow-900" },
  { emoji: "😌", face: "◡‿◡", label: "Good", key: "good", bg: "bg-emerald-300", text: "text-emerald-900" },
  { emoji: "😐", face: "─ ─", label: "Okay", key: "okay", bg: "bg-slate-300", text: "text-slate-900" },
  { emoji: "😰", face: "⊙﹏⊙", label: "Anxious", key: "anxious", bg: "bg-orange-300", text: "text-orange-900" },
  { emoji: "😢", face: "╥﹏╥", label: "Sad", key: "sad", bg: "bg-sky-300", text: "text-sky-900" },
  { emoji: "😤", face: "ಠ_ಠ", label: "Angry", key: "angry", bg: "bg-rose-300", text: "text-rose-900" },
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
  const [step, setStep] = useState<"pick" | "card" | "done">(todayMood ? "done" : "pick");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customReason, setCustomReason] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMoodSelect = (key: string, index: number) => {
    setSelectedMood(key);
    setCurrentIndex(index);
    setStep("card");
    setCustomReason("");
  };

  const handleReasonSubmit = (reason: string) => {
    if (selectedMood) {
      logMood(selectedMood, reason);
      setStep("done");
    }
  };

  const reset = () => {
    setSelectedMood(null);
    setStep("pick");
    setCustomReason("");
  };

  const activeMood = moods.find((m) => m.key === selectedMood) || moods[0];
  const doneMood = moods.find((m) => m.key === (todayMood?.mood || selectedMood));

  return (
    <AnimatePresence mode="wait">
      {step === "pick" && (
        <motion.div
          key="pick"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Check in</p>
          <p className="font-heading text-lg mb-3">How are you feeling?</p>
          
          {/* Horizontal scroll mood cards */}
          <div ref={containerRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
            {moods.map((m, i) => (
              <motion.button
                key={m.key}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleMoodSelect(m.key, i)}
                className={`flex-shrink-0 snap-center w-28 h-36 rounded-2xl ${m.bg} ${m.text} flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow`}
              >
                <span className="text-4xl">{m.emoji}</span>
                <span className="text-sm font-bold">{m.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {step === "card" && selectedMood && (
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`w-full rounded-2xl ${activeMood.bg} ${activeMood.text} p-6 relative min-h-[280px] flex flex-col items-center justify-center shadow-xl`}
        >
          <button onClick={() => setStep("pick")} className="absolute top-4 left-4">
            <X size={20} />
          </button>
          <p className="absolute top-4 right-0 left-0 text-center text-sm font-bold">Current Mood</p>

          <span className="text-7xl mb-3 mt-4">{activeMood.emoji}</span>
          <p className="text-3xl font-heading font-bold mb-1">{activeMood.label}</p>
          <p className="text-sm opacity-70 mb-1">
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>
          <p className="text-xs opacity-50 mb-6">
            {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>

          {/* Quick reasons */}
          <div className="flex flex-wrap gap-2 justify-center mb-3 w-full">
            {(reasonPrompts[selectedMood] || []).map((reason) => (
              <motion.button
                key={reason}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReasonSubmit(reason)}
                className="px-3 py-1.5 rounded-full bg-black/10 text-xs font-medium hover:bg-black/20 transition-colors"
              >
                {reason}
              </motion.button>
            ))}
          </div>

          {/* Custom reason input */}
          <div className="flex items-center gap-2 w-full max-w-xs">
            <input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && customReason.trim() && handleReasonSubmit(customReason.trim())}
              placeholder="Add a reason"
              className="flex-1 bg-black/10 rounded-full px-4 py-2 text-sm placeholder:opacity-50 outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => customReason.trim() && handleReasonSubmit(customReason.trim())}
              className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center"
            >
              <Send size={14} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className={`w-full rounded-2xl ${doneMood?.bg || "bg-muted"} ${doneMood?.text || "text-foreground"} p-5 text-center shadow-md`}
        >
          <span className="text-4xl block mb-2">{doneMood?.emoji || "🌿"}</span>
          <p className="font-heading text-lg font-bold">
            {doneMood?.label || "Checked in"}
          </p>
          {todayMood?.reason && (
            <p className="text-sm opacity-70 mt-1">{todayMood.reason}</p>
          )}
          <button onClick={reset} className="text-xs opacity-60 underline mt-3">
            Update mood
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
