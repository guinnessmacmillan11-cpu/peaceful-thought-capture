import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setProfile } from "@/lib/user-store";
import { ArrowRight, Check } from "lucide-react";

const visionOptions = [
  { id: "peace", emoji: "🕊️", label: "Inner Peace", gradient: "from-emerald-100 to-green-50 dark:from-emerald-900/30 dark:to-green-950/20" },
  { id: "growth", emoji: "🌱", label: "Growth", gradient: "from-lime-100 to-emerald-50 dark:from-lime-900/30 dark:to-emerald-950/20" },
  { id: "joy", emoji: "☀️", label: "Joy", gradient: "from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-950/20" },
  { id: "strength", emoji: "💪", label: "Strength", gradient: "from-orange-100 to-red-50 dark:from-orange-900/30 dark:to-red-950/20" },
  { id: "love", emoji: "💝", label: "Love", gradient: "from-pink-100 to-rose-50 dark:from-pink-900/30 dark:to-rose-950/20" },
  { id: "clarity", emoji: "🔮", label: "Clarity", gradient: "from-indigo-100 to-violet-50 dark:from-indigo-900/30 dark:to-violet-950/20" },
  { id: "creativity", emoji: "🎨", label: "Creativity", gradient: "from-fuchsia-100 to-purple-50 dark:from-fuchsia-900/30 dark:to-purple-950/20" },
  { id: "balance", emoji: "⚖️", label: "Balance", gradient: "from-sky-100 to-blue-50 dark:from-sky-900/30 dark:to-blue-950/20" },
  { id: "gratitude", emoji: "🙏", label: "Gratitude", gradient: "from-teal-100 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-950/20" },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"name" | "vision" | "ready">("name");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const finish = () => {
    setProfile({ name: name.trim(), visionImages: selected, onboardingComplete: true });
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <AnimatePresence mode="wait">
        {step === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm text-center"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Welcome</p>
            <h1 className="text-3xl font-heading mb-2">What's your name?</h1>
            <p className="text-sm text-muted-foreground mb-8">So we can make this feel like yours.</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-center text-lg font-heading focus:outline-none focus:ring-2 focus:ring-primary/30 mb-6"
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!name.trim()}
              onClick={() => setStep("vision")}
              className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto disabled:opacity-40"
            >
              Continue <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {step === "vision" && (
          <motion.div
            key="vision"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm text-center"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Vision</p>
            <h1 className="text-2xl font-heading mb-2">What matters to you?</h1>
            <p className="text-sm text-muted-foreground mb-6">Pick the things you want more of. This shapes your experience.</p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {visionOptions.map((v) => {
                const isSelected = selected.includes(v.id);
                return (
                  <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggle(v.id)}
                    className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl bg-gradient-to-br ${v.gradient} transition-all ${
                      isSelected ? "ring-2 ring-primary shadow-md" : "opacity-70"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                    <span className="text-2xl">{v.emoji}</span>
                    <span className="text-[10px] font-medium text-foreground/80">{v.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={selected.length === 0}
              onClick={() => setStep("ready")}
              className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium flex items-center gap-2 mx-auto disabled:opacity-40"
            >
              Continue <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {step === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-6xl block mb-4"
            >
              ✨
            </motion.span>
            <h1 className="text-2xl font-heading mb-2">You're all set, {name.trim()}.</h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              This is your space. Talk it out, track your mood, and reflect in your journal. No judgment, ever.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={finish}
              className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium mx-auto"
            >
              Let's begin
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
