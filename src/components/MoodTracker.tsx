import { useState, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayMood, logMood, subscribeMoods } from "@/lib/mood-store";
import { X, Send } from "lucide-react";

const moods = [
  { emoji: "😊", label: "Happy", key: "great", bg: "bg-yellow-300", text: "text-yellow-900", gradient: "from-yellow-300 to-amber-400" },
  { emoji: "😌", label: "Good", key: "good", bg: "bg-emerald-300", text: "text-emerald-900", gradient: "from-emerald-300 to-teal-400" },
  { emoji: "😐", label: "Okay", key: "okay", bg: "bg-slate-300", text: "text-slate-900", gradient: "from-slate-300 to-gray-400" },
  { emoji: "😰", label: "Anxious", key: "anxious", bg: "bg-orange-300", text: "text-orange-900", gradient: "from-orange-300 to-amber-500" },
  { emoji: "😢", label: "Sad", key: "sad", bg: "bg-sky-300", text: "text-sky-900", gradient: "from-sky-300 to-blue-400" },
  { emoji: "😤", label: "Angry", key: "angry", bg: "bg-rose-300", text: "text-rose-900", gradient: "from-rose-300 to-red-400" },
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
  const [customReason, setCustomReason] = useState("");

  const handleMoodSelect = (key: string) => {
    setSelectedMood(key);
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
    <>
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
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {moods.map((m) => (
                <motion.button
                  key={m.key}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  onClick={() => handleMoodSelect(m.key)}
                  className={`flex-shrink-0 snap-center w-28 h-36 rounded-2xl bg-gradient-to-br ${m.gradient} ${m.text} flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-xl transition-shadow`}
                >
                  <motion.span
                    className="text-5xl"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    {m.emoji}
                  </motion.span>
                  <span className="text-sm font-bold">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`w-full rounded-2xl bg-gradient-to-br ${doneMood?.gradient || "from-muted to-muted"} ${doneMood?.text || "text-foreground"} p-5 text-center shadow-md`}
          >
            <span className="text-4xl block mb-2">{doneMood?.emoji || "🌿"}</span>
            <p className="font-heading text-lg font-bold">{doneMood?.label || "Checked in"}</p>
            {todayMood?.reason && <p className="text-sm opacity-70 mt-1">{todayMood.reason}</p>}
            <button onClick={reset} className="text-xs opacity-60 underline mt-3">Update mood</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN TAKEOVER */}
      <AnimatePresence>
        {step === "card" && selectedMood && (
          <motion.div
            key="fullscreen-mood"
            initial={{ opacity: 0, scale: 0.8, borderRadius: "24px" }}
            animate={{ opacity: 1, scale: 1, borderRadius: "0px" }}
            exit={{ opacity: 0, scale: 0.8, borderRadius: "24px" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-0 z-50 bg-gradient-to-br ${activeMood.gradient} ${activeMood.text} flex flex-col items-center justify-center p-6`}
          >
            {/* Close */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setStep("pick")}
              className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center"
            >
              <X size={20} />
            </motion.button>

            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-bold opacity-70 mb-6"
            >
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </motion.p>

            {/* Big emoji with pulse */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-white/20 blur-2xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[120px] block relative z-10">{activeMood.emoji}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-4xl font-heading font-bold mt-2 mb-1"
            >
              {activeMood.label}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.35 }}
              className="text-sm mb-8"
            >
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </motion.p>

            {/* Reason prompts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 justify-center mb-4 w-full max-w-sm"
            >
              {(reasonPrompts[selectedMood] || []).map((reason) => (
                <motion.button
                  key={reason}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleReasonSubmit(reason)}
                  className="px-4 py-2 rounded-full bg-black/10 text-sm font-medium hover:bg-black/20 transition-colors backdrop-blur-sm"
                >
                  {reason}
                </motion.button>
              ))}
            </motion.div>

            {/* Custom input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 w-full max-w-xs"
            >
              <input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && customReason.trim() && handleReasonSubmit(customReason.trim())}
                placeholder="Or type your own…"
                className="flex-1 bg-black/10 backdrop-blur-sm rounded-full px-5 py-3 text-sm placeholder:opacity-50 outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => customReason.trim() && handleReasonSubmit(customReason.trim())}
                className="w-11 h-11 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-sm"
              >
                <Send size={16} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
