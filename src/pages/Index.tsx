import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Wind } from "lucide-react";
import BreathingOrb from "@/components/BreathingOrb";
import { useState, useEffect } from "react";

const greetings = [
  "Be gentle with yourself today.",
  "This moment is yours.",
  "You're allowed to slow down.",
  "Take a breath. You're here now.",
  "Nothing needs to be perfect right now.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

export default function HomePage() {
  const navigate = useNavigate();
  const [affirmation] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const [breathCount, setBreathCount] = useState(0);

  useEffect(() => {
    if (!breathing) return;
    const phases: Array<{ phase: "in" | "hold" | "out"; duration: number }> = [
      { phase: "in", duration: 4000 },
      { phase: "hold", duration: 4000 },
      { phase: "out", duration: 6000 },
    ];
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function next() {
      setBreathPhase(phases[idx].phase);
      if (phases[idx].phase === "in") setBreathCount((c) => c + 1);
      timeout = setTimeout(() => {
        idx = (idx + 1) % phases.length;
        next();
      }, phases[idx].duration);
    }

    next();
    return () => clearTimeout(timeout);
  }, [breathing]);

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-10"
      >
        <p className="text-muted-foreground text-sm mb-2">{getGreeting()}</p>
        <h1 className="text-2xl font-heading leading-snug">{affirmation}</h1>
      </motion.div>

      {/* Breathing exercise */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mb-10"
      >
        {breathing ? (
          <div className="flex flex-col items-center">
            <BreathingOrb size={140} />
            <motion.p
              key={breathPhase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-sm text-muted-foreground font-medium"
            >
              {breathPhase === "in" && "Breathe in..."}
              {breathPhase === "hold" && "Hold..."}
              {breathPhase === "out" && "Breathe out..."}
            </motion.p>
            <p className="text-xs text-muted-foreground/60 mt-1">{breathCount} breaths</p>
            <button
              onClick={() => {
                setBreathing(false);
                setBreathCount(0);
              }}
              className="mt-4 text-xs text-muted-foreground underline underline-offset-2"
            >
              Done
            </button>
          </div>
        ) : (
          <button onClick={() => setBreathing(true)} className="flex flex-col items-center group">
            <BreathingOrb size={120} />
            <p className="mt-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Tap to breathe
            </p>
          </button>
        )}
      </motion.div>

      {/* Talk CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/talk")}
        className="w-full max-w-xs bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4 text-left group hover:border-primary/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-primary" />
        </div>
        <div>
          <p className="font-heading text-sm">Talk it out</p>
          <p className="text-xs text-muted-foreground">Voice or text — your journal remembers</p>
        </div>
      </motion.button>
    </div>
  );
}
