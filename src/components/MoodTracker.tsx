import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayMood, logMood, subscribeMoods } from "@/lib/mood-store";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const moods = [
  { label: "Happy", key: "great", gradient: "from-amber-200 to-yellow-300", emoji: "😊", bg: "bg-gradient-to-br from-amber-100 to-yellow-200" },
  { label: "Good", key: "good", gradient: "from-emerald-200 to-teal-300", emoji: "😌", bg: "bg-gradient-to-br from-emerald-100 to-teal-200" },
  { label: "Okay", key: "okay", gradient: "from-slate-200 to-gray-300", emoji: "😐", bg: "bg-gradient-to-br from-slate-100 to-gray-200" },
  { label: "Anxious", key: "anxious", gradient: "from-orange-200 to-amber-400", emoji: "😰", bg: "bg-gradient-to-br from-orange-100 to-amber-200" },
  { label: "Sad", key: "sad", gradient: "from-sky-200 to-blue-300", emoji: "😢", bg: "bg-gradient-to-br from-sky-100 to-blue-200" },
  { label: "Angry", key: "angry", gradient: "from-rose-200 to-red-300", emoji: "😤", bg: "bg-gradient-to-br from-rose-100 to-red-200" },
];

const reasonPrompts: Record<string, string[]> = {
  great: ["Feeling accomplished", "Good news", "Quality time", "Just grateful"],
  good: ["Productive day", "Nice weather", "Relaxed", "Something fun"],
  okay: ["Nothing special", "A bit tired", "Going through motions", "Mixed feelings"],
  anxious: ["Work stress", "Upcoming event", "Health worries", "Overthinking"],
  sad: ["Missing someone", "Feeling lonely", "Disappointed", "No reason"],
  angry: ["Conflict", "Frustration", "Feeling unheard", "Overwhelmed"],
};

const moodMessages: Record<string, string> = {
  great: "Keep shining! ☀️",
  good: "Nice vibes ✨",
  okay: "It's okay to just be 🌿",
  anxious: "You're safe 🌊",
  sad: "It's okay to feel this way 💙",
  angry: "Let it out, then let it go 🔥",
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

  const handleReasonSubmit = async (reason: string) => {
    if (selectedMood) {
      logMood(selectedMood, reason);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("mood_entries").insert({ user_id: user.id, mood: selectedMood, reason });
          const today = new Date().toISOString().split("T")[0];
          const { data: profile } = await supabase.from("profiles").select("current_streak, longest_streak, last_checkin_date").eq("id", user.id).single();
          if (profile) {
            const lastDate = profile.last_checkin_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            let newStreak = 1;
            if (lastDate === yesterdayStr) newStreak = (profile.current_streak || 0) + 1;
            else if (lastDate === today) newStreak = profile.current_streak || 1;
            const longestStreak = Math.max(newStreak, profile.longest_streak || 0);
            await supabase.from("profiles").update({ current_streak: newStreak, longest_streak: longestStreak, last_checkin_date: today }).eq("id", user.id);
          }
        }
      } catch {}
      setStep("done");
    }
  };

  const reset = () => { setSelectedMood(null); setStep("pick"); setCustomReason(""); };

  const activeMood = moods.find((m) => m.key === selectedMood) || moods[0];
  const doneMood = moods.find((m) => m.key === (todayMood?.mood || selectedMood));

  return (
    <>
      <AnimatePresence mode="wait">
        {step === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Check in</p>
            <p className="font-heading text-base mb-3">How are you feeling?</p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {moods.map((m, i) => (
                <motion.button key={m.key}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleMoodSelect(m.key)}
                  className={`flex-shrink-0 snap-center w-20 h-24 rounded-2xl ${m.bg} flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-shadow border border-border/30`}>
                  <motion.span className="text-2xl" animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}>
                    {m.emoji}
                  </motion.span>
                  <span className="text-[10px] font-medium text-foreground/80">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "done" && doneMood && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`w-full rounded-2xl ${doneMood.bg} p-5 text-center shadow-sm border border-border/20`}>
            <motion.span className="text-3xl block mb-1" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              {doneMood.emoji}
            </motion.span>
            <p className="font-heading text-base">{doneMood.label}</p>
            <p className="text-xs text-foreground/60 mt-0.5">{moodMessages[doneMood.key]}</p>
            {todayMood?.reason && <p className="text-xs text-foreground/50 mt-1">{todayMood.reason}</p>}
            <button onClick={reset} className="text-xs text-primary underline mt-2">Update mood</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen mood card */}
      <AnimatePresence>
        {step === "card" && selectedMood && (
          <motion.div key="fullscreen-mood"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br ${activeMood.gradient}`}>
            
            <div className="absolute inset-0 bg-background/30 dark:bg-background/60 backdrop-blur-sm" />
            
            <div className="relative z-10 flex flex-col items-center justify-center p-6 w-full max-w-sm">
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={() => setStep("pick")} className="absolute top-[-60px] left-0 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-md flex items-center justify-center text-foreground">
                <X size={20} />
              </motion.button>

              <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="text-sm font-bold text-foreground/60 mb-4">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </motion.p>

              <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }} className="text-6xl mb-2">
                {activeMood.emoji}
              </motion.span>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="text-3xl font-heading font-bold text-foreground mb-1">{activeMood.label}</motion.p>
              
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.3 }}
                className="text-sm text-foreground/60 mb-6">{moodMessages[selectedMood]}</motion.p>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2 justify-center mb-4 w-full">
                {(reasonPrompts[selectedMood] || []).map((reason) => (
                  <motion.button key={reason} whileTap={{ scale: 0.92 }} onClick={() => handleReasonSubmit(reason)}
                    className="px-4 py-2 rounded-full bg-foreground/10 text-sm font-medium text-foreground hover:bg-foreground/20 transition-colors backdrop-blur-md">
                    {reason}
                  </motion.button>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex items-center gap-2 w-full">
                <input value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && customReason.trim() && handleReasonSubmit(customReason.trim())}
                  placeholder="Or type your own…"
                  className="flex-1 bg-foreground/10 backdrop-blur-md rounded-full px-5 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none" />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => customReason.trim() && handleReasonSubmit(customReason.trim())}
                  className="w-11 h-11 rounded-full bg-foreground/10 flex items-center justify-center backdrop-blur-md text-foreground">
                  <Send size={16} />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
