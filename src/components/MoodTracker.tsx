import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayMood, logMood, subscribeMoods } from "@/lib/mood-store";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import moodHappyImg from "@/assets/mood-happy.jpg";
import moodGoodImg from "@/assets/mood-good.jpg";
import moodOkayImg from "@/assets/mood-okay.jpg";
import moodAnxiousImg from "@/assets/mood-anxious.jpg";
import moodSadImg from "@/assets/mood-sad.jpg";
import moodAngryImg from "@/assets/mood-angry.jpg";

const moods = [
  { img: moodHappyImg, label: "Happy", key: "great", gradient: "from-yellow-300/80 to-amber-400/80", text: "text-white" },
  { img: moodGoodImg, label: "Good", key: "good", gradient: "from-emerald-300/80 to-teal-400/80", text: "text-white" },
  { img: moodOkayImg, label: "Okay", key: "okay", gradient: "from-slate-300/80 to-gray-400/80", text: "text-white" },
  { img: moodAnxiousImg, label: "Anxious", key: "anxious", gradient: "from-orange-300/80 to-amber-500/80", text: "text-white" },
  { img: moodSadImg, label: "Sad", key: "sad", gradient: "from-sky-300/80 to-blue-400/80", text: "text-white" },
  { img: moodAngryImg, label: "Angry", key: "angry", gradient: "from-rose-300/80 to-red-400/80", text: "text-white" },
];

const moodImages: Record<string, string> = {
  great: moodHappyImg,
  good: moodGoodImg,
  okay: moodOkayImg,
  anxious: moodAnxiousImg,
  sad: moodSadImg,
  angry: moodAngryImg,
};

const reasonPrompts: Record<string, string[]> = {
  great: ["Feeling accomplished", "Good news", "Quality time", "Just grateful"],
  good: ["Productive day", "Nice weather", "Relaxed", "Something fun"],
  okay: ["Nothing special", "A bit tired", "Going through motions", "Mixed feelings"],
  anxious: ["Work stress", "Upcoming event", "Health worries", "Overthinking"],
  sad: ["Missing someone", "Feeling lonely", "Disappointed", "No reason"],
  angry: ["Conflict", "Frustration at work", "Feeling unheard", "Overwhelmed"],
};

const moodMessages: Record<string, string> = {
  great: "That's wonderful! Keep shining ☀️",
  good: "Nice vibes today ✨",
  okay: "It's okay to just be 🌿",
  anxious: "Take a deep breath. You're safe 🌊",
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
            <p className="font-heading text-lg mb-3">How are you feeling?</p>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {moods.map((m, i) => (
                <motion.button key={m.key}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleMoodSelect(m.key)}
                  className="flex-shrink-0 snap-center w-28 h-36 rounded-2xl overflow-hidden relative shadow-md hover:shadow-xl transition-shadow">
                  <img src={m.img} alt={m.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${m.gradient}`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-3">
                    <span className="text-sm font-bold text-white drop-shadow-lg">{m.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "done" && doneMood && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="w-full rounded-2xl overflow-hidden relative shadow-md h-32">
            <img src={doneMood.img} alt={doneMood.label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <p className="font-heading text-lg font-bold drop-shadow-lg">{doneMood.label}</p>
              <p className="text-xs opacity-80 drop-shadow mt-1">{moodMessages[doneMood.key]}</p>
              {todayMood?.reason && <p className="text-xs opacity-70 mt-1">{todayMood.reason}</p>}
              <button onClick={reset} className="text-xs opacity-60 underline mt-2">Update mood</button>
            </div>
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center">
            
            {/* Background image */}
            <img src={activeMood.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            
            <div className="relative z-10 flex flex-col items-center justify-center p-6 w-full max-w-sm">
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={() => setStep("pick")} className="absolute top-[-60px] left-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <X size={20} />
              </motion.button>

              <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="text-sm font-bold text-white/80 mb-6">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </motion.p>

              <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-4xl font-heading font-bold text-white drop-shadow-lg mb-2">{activeMood.label}</motion.p>
              
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.3 }}
                className="text-sm text-white/80 mb-6">{moodMessages[selectedMood]}</motion.p>

              {/* Reason prompts */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2 justify-center mb-4 w-full">
                {(reasonPrompts[selectedMood] || []).map((reason) => (
                  <motion.button key={reason} whileTap={{ scale: 0.92 }} onClick={() => handleReasonSubmit(reason)}
                    className="px-4 py-2 rounded-full bg-white/20 text-sm font-medium text-white hover:bg-white/30 transition-colors backdrop-blur-md">
                    {reason}
                  </motion.button>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex items-center gap-2 w-full">
                <input value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && customReason.trim() && handleReasonSubmit(customReason.trim())}
                  placeholder="Or type your own…"
                  className="flex-1 bg-white/15 backdrop-blur-md rounded-full px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none" />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => customReason.trim() && handleReasonSubmit(customReason.trim())}
                  className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md text-white">
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
