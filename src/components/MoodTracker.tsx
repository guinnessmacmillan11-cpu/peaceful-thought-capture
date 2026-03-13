import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayMood, logMood, subscribeMoods } from "@/lib/mood-store";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import pandaHappy from "@/assets/panda-happy.png";
import pandaComfort from "@/assets/panda-comfort.png";
import pandaCelebrate from "@/assets/panda-celebrate.png";
import pandaIdle from "@/assets/panda-idle.png";

const moods = [
  { emoji: "😊", label: "Happy", key: "great", gradient: "from-yellow-300 to-amber-400", text: "text-yellow-900" },
  { emoji: "😌", label: "Good", key: "good", gradient: "from-emerald-300 to-teal-400", text: "text-emerald-900" },
  { emoji: "😐", label: "Okay", key: "okay", gradient: "from-slate-300 to-gray-400", text: "text-slate-900" },
  { emoji: "😰", label: "Anxious", key: "anxious", gradient: "from-orange-300 to-amber-500", text: "text-orange-900" },
  { emoji: "😢", label: "Sad", key: "sad", gradient: "from-sky-300 to-blue-400", text: "text-sky-900" },
  { emoji: "😤", label: "Angry", key: "angry", gradient: "from-rose-300 to-red-400", text: "text-rose-900" },
];

const reasonPrompts: Record<string, string[]> = {
  great: ["Feeling accomplished", "Good news", "Quality time", "Just grateful"],
  good: ["Productive day", "Nice weather", "Relaxed", "Something fun"],
  okay: ["Nothing special", "A bit tired", "Going through motions", "Mixed feelings"],
  anxious: ["Work stress", "Upcoming event", "Health worries", "Overthinking"],
  sad: ["Missing someone", "Feeling lonely", "Disappointed", "No reason"],
  angry: ["Conflict", "Frustration at work", "Feeling unheard", "Overwhelmed"],
};

function getBaoReaction(moodKey: string): { img: string; message: string } {
  switch (moodKey) {
    case "great": return { img: pandaHappy, message: "Yay! Bao is doing a happy dance! 🎉" };
    case "good": return { img: pandaCelebrate, message: "Bao is proud of you! ✨" };
    case "okay": return { img: pandaIdle, message: "Bao is here for you 🎋" };
    case "anxious": return { img: pandaComfort, message: "Bao sends a warm hug 🤗" };
    case "sad": return { img: pandaComfort, message: "Bao wraps you in a cozy hug 💛" };
    case "angry": return { img: pandaComfort, message: "Bao understands. Deep breaths 🌬️" };
    default: return { img: pandaIdle, message: "Bao is here 🐼" };
  }
}

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
      // Persist to cloud
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("mood_entries").insert({
            user_id: user.id,
            mood: selectedMood,
            reason,
          });
          // Update streak
          const today = new Date().toISOString().split("T")[0];
          const { data: profile } = await supabase.from("profiles").select("current_streak, longest_streak, last_checkin_date").eq("id", user.id).single();
          if (profile) {
            const lastDate = profile.last_checkin_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            
            let newStreak = 1;
            if (lastDate === yesterdayStr) {
              newStreak = (profile.current_streak || 0) + 1;
            } else if (lastDate === today) {
              newStreak = profile.current_streak || 1;
            }
            const longestStreak = Math.max(newStreak, profile.longest_streak || 0);
            await supabase.from("profiles").update({
              current_streak: newStreak,
              longest_streak: longestStreak,
              last_checkin_date: today,
            }).eq("id", user.id);
          }
        }
      } catch {}
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
  const baoReaction = selectedMood ? getBaoReaction(selectedMood) : null;
  const doneReaction = doneMood ? getBaoReaction(doneMood.key) : null;

  return (
    <>
      <AnimatePresence mode="wait">
        {step === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Check in</p>
            <p className="font-heading text-lg mb-3">How are you feeling?</p>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {moods.map((m) => (
                <motion.button key={m.key} whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.05, y: -4 }}
                  onClick={() => handleMoodSelect(m.key)}
                  className={`flex-shrink-0 snap-center w-28 h-36 rounded-2xl bg-gradient-to-br ${m.gradient} ${m.text} flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-xl transition-shadow`}>
                  <motion.span className="text-5xl" animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>{m.emoji}</motion.span>
                  <span className="text-sm font-bold">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`w-full rounded-2xl bg-gradient-to-br ${doneMood?.gradient || "from-muted to-muted"} ${doneMood?.text || "text-foreground"} p-5 text-center shadow-md`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              {doneReaction && (
                <motion.img src={doneReaction.img} alt="Bao" className="w-12 h-12"
                  animate={doneMood?.key === "great" ? { rotate: [0, -10, 10, -10, 0], y: [0, -5, 0] } : { y: [0, -3, 0] }}
                  transition={{ duration: doneMood?.key === "great" ? 0.8 : 2, repeat: Infinity }} />
              )}
              <span className="text-4xl">{doneMood?.emoji || "🌿"}</span>
            </div>
            <p className="font-heading text-lg font-bold">{doneMood?.label || "Checked in"}</p>
            {doneReaction && <p className="text-xs opacity-70 mt-1">{doneReaction.message}</p>}
            {todayMood?.reason && <p className="text-sm opacity-70 mt-1">{todayMood.reason}</p>}
            <button onClick={reset} className="text-xs opacity-60 underline mt-3">Update mood</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen mood card */}
      <AnimatePresence>
        {step === "card" && selectedMood && (
          <motion.div key="fullscreen-mood"
            initial={{ opacity: 0, scale: 0.8, borderRadius: "24px" }}
            animate={{ opacity: 1, scale: 1, borderRadius: "0px" }}
            exit={{ opacity: 0, scale: 0.8, borderRadius: "24px" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-0 z-50 bg-gradient-to-br ${activeMood.gradient} ${activeMood.text} flex flex-col items-center justify-center p-6`}>
            
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={() => setStep("pick")} className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
              <X size={20} />
            </motion.button>

            <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="text-sm font-bold opacity-70 mb-4">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </motion.p>

            {/* Bao reaction */}
            {baoReaction && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, delay: 0.1 }} className="mb-2">
                <motion.img src={baoReaction.img} alt="Bao reacting" className="w-24 h-24 mx-auto"
                  animate={selectedMood === "great" || selectedMood === "good"
                    ? { rotate: [0, -15, 15, -15, 0], y: [0, -10, 0] }
                    : { scale: [1, 1.05, 1] }}
                  transition={{ duration: selectedMood === "great" ? 0.6 : 2, repeat: Infinity }} />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.4 }}
                  className="text-xs font-medium mt-1">{baoReaction.message}</motion.p>
              </motion.div>
            )}

            {/* Big emoji */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.15 }} className="relative">
              <motion.div className="absolute inset-0 rounded-full bg-white/20 blur-2xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-[100px] block relative z-10">{activeMood.emoji}</span>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="text-3xl font-heading font-bold mt-2 mb-1">{activeMood.label}</motion.p>

            {/* Reason prompts */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 justify-center mb-4 w-full max-w-sm mt-4">
              {(reasonPrompts[selectedMood] || []).map((reason) => (
                <motion.button key={reason} whileTap={{ scale: 0.92 }} onClick={() => handleReasonSubmit(reason)}
                  className="px-4 py-2 rounded-full bg-black/10 text-sm font-medium hover:bg-black/20 transition-colors backdrop-blur-sm">
                  {reason}
                </motion.button>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-2 w-full max-w-xs">
              <input value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && customReason.trim() && handleReasonSubmit(customReason.trim())}
                placeholder="Or type your own…"
                className="flex-1 bg-black/10 backdrop-blur-sm rounded-full px-5 py-3 text-sm placeholder:opacity-50 outline-none" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => customReason.trim() && handleReasonSubmit(customReason.trim())}
                className="w-11 h-11 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-sm">
                <Send size={16} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
