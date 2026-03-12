import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import pandaBreatheIn from "@/assets/panda-breathe-in.png";
import pandaBreatheOut from "@/assets/panda-breathe-out.png";
import pandaIdle from "@/assets/panda-idle.png";

const breathPatterns = [
  { name: "Box Breathing", emoji: "📦", inhale: 4, hold: 4, exhale: 4, holdOut: 4, rounds: 4 },
  { name: "4-7-8 Calm", emoji: "🌙", inhale: 4, hold: 7, exhale: 8, holdOut: 0, rounds: 3 },
  { name: "Quick Reset", emoji: "⚡", inhale: 3, hold: 0, exhale: 6, holdOut: 0, rounds: 5 },
];

type Phase = "ready" | "inhale" | "hold" | "exhale" | "holdOut" | "done";

const phaseLabels: Record<Phase, string> = {
  ready: "Tap a pattern to start",
  inhale: "Breathe in with Bao… 🌬️",
  hold: "Hold it… 😌",
  exhale: "Breathe out slowly… 💨",
  holdOut: "Hold empty… 🧘",
  done: "Great job! 🎉",
};

export default function PandaBreathing() {
  const [activePattern, setActivePattern] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  const startProgress = (durationSec: number) => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    const interval = 50;
    const steps = (durationSec * 1000) / interval;
    let step = 0;
    progressRef.current = setInterval(() => {
      step++;
      setProgress(Math.min((step / steps) * 100, 100));
      if (step >= steps) {
        if (progressRef.current) clearInterval(progressRef.current);
      }
    }, interval);
  };

  const runCycle = useCallback((patternIdx: number, currentRound: number) => {
    const p = breathPatterns[patternIdx];
    if (currentRound >= p.rounds) {
      setPhase("done");
      setIsActive(false);
      return;
    }
    setRound(currentRound + 1);

    // Inhale
    setPhase("inhale");
    startProgress(p.inhale);
    timerRef.current = setTimeout(() => {
      if (p.hold > 0) {
        setPhase("hold");
        startProgress(p.hold);
        timerRef.current = setTimeout(() => {
          setPhase("exhale");
          startProgress(p.exhale);
          timerRef.current = setTimeout(() => {
            if (p.holdOut > 0) {
              setPhase("holdOut");
              startProgress(p.holdOut);
              timerRef.current = setTimeout(() => runCycle(patternIdx, currentRound + 1), p.holdOut * 1000);
            } else {
              runCycle(patternIdx, currentRound + 1);
            }
          }, p.exhale * 1000);
        }, p.hold * 1000);
      } else {
        setPhase("exhale");
        startProgress(p.exhale);
        timerRef.current = setTimeout(() => runCycle(patternIdx, currentRound + 1), p.exhale * 1000);
      }
    }, p.inhale * 1000);
  }, []);

  const startBreathing = (idx: number) => {
    clearTimers();
    setActivePattern(idx);
    setRound(0);
    setIsActive(true);
    setPhase("ready");
    // Small delay then start
    timerRef.current = setTimeout(() => runCycle(idx, 0), 500);
  };

  const stop = () => {
    clearTimers();
    setActivePattern(null);
    setIsActive(false);
    setPhase("ready");
    setProgress(0);
  };

  const getPandaImg = () => {
    if (phase === "inhale") return pandaBreatheIn;
    if (phase === "exhale") return pandaBreatheOut;
    return pandaIdle;
  };

  const getPandaScale = () => {
    if (phase === "inhale") return 1.15;
    if (phase === "hold") return 1.15;
    if (phase === "exhale") return 0.9;
    if (phase === "holdOut") return 0.9;
    return 1;
  };

  const getPhaseDuration = () => {
    if (!activePattern && activePattern !== 0) return 1;
    const p = breathPatterns[activePattern];
    switch (phase) {
      case "inhale": return p.inhale;
      case "hold": return p.hold;
      case "exhale": return p.exhale;
      case "holdOut": return p.holdOut;
      default: return 0.5;
    }
  };

  if (activePattern === null) {
    return (
      <div className="space-y-2">
        {breathPatterns.map((p, i) => (
          <motion.button
            key={p.name}
            whileTap={{ scale: 0.97 }}
            onClick={() => startBreathing(i)}
            className="w-full flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 text-left hover:bg-muted transition-colors"
          >
            <span className="text-xl">{p.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-heading">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {p.inhale}s in · {p.hold > 0 ? `${p.hold}s hold · ` : ""}{p.exhale}s out · {p.rounds} rounds
              </p>
            </div>
            <span className="text-xs text-primary font-medium">Start</span>
          </motion.button>
        ))}
      </div>
    );
  }

  const pattern = breathPatterns[activePattern];

  return (
    <div className="bg-card border border-border rounded-xl p-6 text-center">
      <p className="text-xs text-muted-foreground mb-1 font-medium">{pattern.emoji} {pattern.name}</p>
      {isActive && <p className="text-[10px] text-muted-foreground mb-4">Round {round}/{pattern.rounds}</p>}

      {/* Panda breathing animation */}
      <div className="relative flex items-center justify-center my-4">
        {/* Background glow */}
        <motion.div
          className="absolute rounded-full bg-primary/10"
          animate={{ scale: phase === "inhale" ? 1.5 : phase === "exhale" ? 0.8 : 1.2 }}
          transition={{ duration: getPhaseDuration(), ease: "easeInOut" }}
          style={{ width: 160, height: 160 }}
        />

        {/* Progress ring */}
        <svg className="absolute" width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" strokeWidth="4" className="stroke-border" />
          <motion.circle
            cx="90" cy="90" r="80" fill="none" strokeWidth="4"
            className="stroke-primary"
            strokeLinecap="round"
            strokeDasharray={502}
            strokeDashoffset={502 - (502 * progress) / 100}
            transform="rotate(-90 90 90)"
          />
        </svg>

        {/* Panda */}
        <motion.img
          src={getPandaImg()}
          alt="Bao breathing"
          className="w-28 h-28 relative z-10"
          animate={{ scale: getPandaScale() }}
          transition={{ duration: getPhaseDuration(), ease: "easeInOut" }}
        />
      </div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="font-heading text-base text-foreground mb-1"
        >
          {phaseLabels[phase]}
        </motion.p>
      </AnimatePresence>

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="text-sm text-muted-foreground mt-1 mb-3">You did amazing! Bao is proud of you 🐼</p>
          <button onClick={() => startBreathing(activePattern)} className="text-xs text-primary mr-3">Go again</button>
          <button onClick={stop} className="text-xs text-muted-foreground underline">← Back</button>
        </motion.div>
      )}

      {phase !== "done" && (
        <button onClick={stop} className="text-xs text-muted-foreground underline mt-3">{isActive ? "Stop" : "← Back"}</button>
      )}
    </div>
  );
}
