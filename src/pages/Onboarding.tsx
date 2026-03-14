import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Check, Phone, BookOpen, Gamepad2, Wind, Flame, Crown, Sparkles } from "lucide-react";
import pandaIdle from "@/assets/panda-idle.png";
import pandaHappy from "@/assets/panda-happy.png";
import pandaComfort from "@/assets/panda-comfort.png";

const totalSteps = 10;

const goals = [
  { id: "stress", emoji: "😮‍💨", label: "Manage stress" },
  { id: "anxiety", emoji: "😰", label: "Ease anxiety" },
  { id: "sleep", emoji: "😴", label: "Sleep better" },
  { id: "focus", emoji: "🎯", label: "Stay focused" },
  { id: "mood", emoji: "🌈", label: "Improve mood" },
  { id: "self", emoji: "💪", label: "Build confidence" },
];

const visionOptions = [
  { id: "peace", emoji: "🕊️", label: "Inner Peace", gradient: "from-emerald-100 to-green-50" },
  { id: "growth", emoji: "🌱", label: "Growth", gradient: "from-lime-100 to-emerald-50" },
  { id: "joy", emoji: "☀️", label: "Joy", gradient: "from-amber-100 to-yellow-50" },
  { id: "strength", emoji: "💪", label: "Strength", gradient: "from-orange-100 to-red-50" },
  { id: "love", emoji: "💝", label: "Love", gradient: "from-pink-100 to-rose-50" },
  { id: "clarity", emoji: "🔮", label: "Clarity", gradient: "from-indigo-100 to-violet-50" },
  { id: "creativity", emoji: "🎨", label: "Creativity", gradient: "from-fuchsia-100 to-purple-50" },
  { id: "balance", emoji: "⚖️", label: "Balance", gradient: "from-sky-100 to-blue-50" },
  { id: "gratitude", emoji: "🙏", label: "Gratitude", gradient: "from-teal-100 to-cyan-50" },
];

const ageRanges = [
  { id: "6-9", label: "6-9", emoji: "🧒" },
  { id: "10-12", label: "10-12", emoji: "🧑" },
  { id: "13-15", label: "13-15", emoji: "🧑‍🎓" },
  { id: "16-18", label: "16-18", emoji: "🎓" },
  { id: "19-25", label: "19-25", emoji: "🧑‍💻" },
  { id: "26+", label: "26+", emoji: "🧑‍🦱" },
];

const slideVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [stressLevel, setStressLevel] = useState(5);
  const [selectedVisions, setSelectedVisions] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(10);

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const toggleGoal = (id: string) => {
    setSelectedGoals((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };
  const toggleVision = (id: string) => {
    setSelectedVisions((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const finish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Parse age from range for AI context
        const ageNum = ageRange === "6-9" ? 8 : ageRange === "10-12" ? 11 : ageRange === "13-15" ? 14 : ageRange === "16-18" ? 17 : ageRange === "19-25" ? 22 : 30;
        await supabase.from("profiles").update({
          name: name.trim(),
          age: ageNum,
          onboarding_complete: true,
          vision_images: selectedVisions,
        }).eq("id", user.id);
      }
    } catch {}
    onComplete();
  };

  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          {step > 0 && step < 9 && (
            <button onClick={prev} className="text-xs text-muted-foreground">← Back</button>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{step + 1}/{totalSteps}</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          {/* 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <motion.img src={pandaIdle} alt="Bao" className="w-28 h-28 mx-auto mb-6" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} />
              <h1 className="text-3xl font-heading mb-2">Meet Bao 🎋</h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">Your personal wellness companion. A chill panda who's always here to listen, no judgment.</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={next} className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto">
                Let's go <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 1: Name */}
          {step === 1 && (
            <motion.div key="name" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Personalize</p>
              <h1 className="text-3xl font-heading mb-2">What's your name?</h1>
              <p className="text-sm text-muted-foreground mb-8">So Bao knows what to call you.</p>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" autoFocus
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-center text-lg font-heading focus:outline-none focus:ring-2 focus:ring-primary/30 mb-6"
              />
              <motion.button whileTap={{ scale: 0.95 }} disabled={!name.trim()} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 2: Age */}
          {step === 2 && (
            <motion.div key="age" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">About You</p>
              <h1 className="text-2xl font-heading mb-2">How old are you?</h1>
              <p className="text-sm text-muted-foreground mb-6">Bao adapts to talk your way 🐼</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {ageRanges.map((a) => (
                  <motion.button key={a.id} whileTap={{ scale: 0.92 }} onClick={() => setAgeRange(a.id)}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all ${ageRange === a.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card opacity-70"}`}>
                    <span className="text-2xl">{a.emoji}</span>
                    <span className="text-sm font-medium">{a.label}</span>
                  </motion.button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} disabled={!ageRange} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 3: Goals */}
          {step === 3 && (
            <motion.div key="goals" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Goals</p>
              <h1 className="text-2xl font-heading mb-2">What brings you here?</h1>
              <p className="text-sm text-muted-foreground mb-6">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {goals.map((g) => {
                  const sel = selectedGoals.includes(g.id);
                  return (
                    <motion.button key={g.id} whileTap={{ scale: 0.92 }} onClick={() => toggleGoal(g.id)}
                      className={`relative flex items-center gap-3 py-4 px-4 rounded-2xl border transition-all text-left ${sel ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card opacity-70"}`}>
                      {sel && <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"><Check size={12} /></div>}
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="text-sm font-medium">{g.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} disabled={selectedGoals.length === 0} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 4: Stress level slider */}
          {step === 4 && (
            <motion.div key="stress" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">How You're Doing</p>
              <h1 className="text-2xl font-heading mb-2">How stressed are you lately?</h1>
              <p className="text-sm text-muted-foreground mb-8">Slide to rate your current stress level.</p>
              <div className="relative mb-4">
                <motion.div className="text-6xl mb-6" key={stressLevel} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  {stressLevel <= 3 ? "😌" : stressLevel <= 6 ? "😐" : stressLevel <= 8 ? "😰" : "🤯"}
                </motion.div>
                <input type="range" min={1} max={10} value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                  <span>Zen 🧘</span>
                  <span className="font-heading text-lg text-foreground">{stressLevel}/10</span>
                  <span>Max 🔥</span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto mt-6">
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 5: Vision board */}
          {step === 5 && (
            <motion.div key="vision" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Vision</p>
              <h1 className="text-2xl font-heading mb-2">What matters to you?</h1>
              <p className="text-sm text-muted-foreground mb-6">Pick what you want more of in your life.</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {visionOptions.map((v) => {
                  const sel = selectedVisions.includes(v.id);
                  return (
                    <motion.button key={v.id} whileTap={{ scale: 0.92 }} onClick={() => toggleVision(v.id)}
                      className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl bg-gradient-to-br ${v.gradient} transition-all ${sel ? "ring-2 ring-primary shadow-md" : "opacity-70"}`}>
                      {sel && <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"><Check size={12} /></div>}
                      <span className="text-2xl">{v.emoji}</span>
                      <span className="text-[10px] font-medium text-foreground/80">{v.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} disabled={selectedVisions.length === 0} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 6: Daily commitment ring */}
          {step === 6 && (
            <motion.div key="commitment" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Daily Goal</p>
              <h1 className="text-2xl font-heading mb-2">How much time for you?</h1>
              <p className="text-sm text-muted-foreground mb-8">Set your daily wellness minutes.</p>
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-muted" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round"
                    className="stroke-primary" strokeDasharray={264}
                    animate={{ strokeDashoffset: 264 - (264 * (dailyMinutes / 30)) }}
                    transition={{ type: "spring", stiffness: 100 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-heading font-bold">{dailyMinutes}</span>
                  <span className="text-xs text-muted-foreground">min/day</span>
                </div>
              </div>
              <input type="range" min={5} max={30} step={5} value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary mb-8" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto">
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 7: Feature - Talk */}
          {step === 7 && (
            <motion.div key="feat-talk" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <motion.div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
                animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Phone size={32} className="text-primary" />
              </motion.div>
              <h1 className="text-2xl font-heading mb-2">Talk it out</h1>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Call Bao anytime, like FaceTiming a friend. He listens, responds, and never judges.</p>
              <img src={pandaComfort} alt="Bao listening" className="w-24 h-24 mx-auto mb-6 opacity-80" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto">
                Cool <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 8: Feature - Mood + Breathing */}
          {step === 8 && (
            <motion.div key="feat-mood" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <div className="flex justify-center gap-4 mb-6">
                <motion.div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center" animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <span className="text-3xl">😊</span>
                </motion.div>
                <motion.div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                  <Wind size={28} className="text-sky-500" />
                </motion.div>
              </div>
              <h1 className="text-2xl font-heading mb-2">Track & breathe</h1>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Check in daily with mood tracking. Build streaks. Breathe with Bao when things get heavy.</p>
              <div className="flex justify-center gap-2 mb-8">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.15 }}
                    className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Flame size={18} className="text-orange-500" />
                  </motion.div>
                ))}
                <span className="self-center text-sm font-heading text-muted-foreground ml-1">3 day streak!</span>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto">
                Nice <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* 9: Paywall / Start */}
          {step === 9 && (
            <motion.div key="paywall" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-sm text-center">
              <motion.img src={pandaHappy} alt="Bao celebrating" className="w-24 h-24 mx-auto mb-4" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <h1 className="text-2xl font-heading mb-2">You're all set, {name.trim() || "friend"}!</h1>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Everything is ready for your wellness journey with Bao.</p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 mb-4 relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</div>
                <Crown size={28} className="text-amber-500 mx-auto mb-3" />
                <h2 className="font-heading text-lg font-bold mb-1">Bao Premium</h2>
                <p className="text-xs text-muted-foreground mb-4">Unlimited talks, advanced insights, exclusive games</p>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-3xl font-heading font-bold">$4.99</span>
                  <span className="text-xs text-muted-foreground">/month</span>
                </div>
                <div className="space-y-2 text-left mb-4">
                  {["Unlimited voice calls with Bao", "Advanced mood analytics", "Premium mini-games", "Ad-free experience"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <Sparkles size={12} className="text-amber-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.95 }}
                  className="w-full bg-amber-400 text-amber-900 rounded-full py-3 font-bold text-sm">
                  Start 7-day free trial
                </motion.button>
                <p className="text-[10px] text-muted-foreground mt-2">Cancel anytime. No charge for 7 days.</p>
              </motion.div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={finish}
                className="w-full text-muted-foreground text-sm py-3 font-medium underline-offset-2 hover:underline">
                Continue with free plan →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
