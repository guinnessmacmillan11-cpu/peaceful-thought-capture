import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Heart, ListChecks, Wind, BarChart3 } from "lucide-react";
import BreathingOrb from "@/components/BreathingOrb";
import MoodTracker from "@/components/MoodTracker";
import MoodBoard from "@/components/MoodBoard";
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

const affirmations = [
  "I am enough, exactly as I am.",
  "This feeling is temporary.",
  "I choose to let go of what I can't control.",
  "I am stronger than my anxiety.",
  "I deserve peace and calm.",
  "It's okay to take things one step at a time.",
  "I give myself permission to rest.",
  "My feelings are valid.",
];

type BreathPattern = { name: string; desc: string; phases: { phase: string; duration: number }[] };

const breathPatterns: BreathPattern[] = [
  { name: "4-4-6 Calm", desc: "Slow and calming", phases: [{ phase: "Breathe in", duration: 4000 }, { phase: "Hold", duration: 4000 }, { phase: "Breathe out", duration: 6000 }] },
  { name: "Box Breathing", desc: "Navy SEAL technique", phases: [{ phase: "Breathe in", duration: 4000 }, { phase: "Hold", duration: 4000 }, { phase: "Breathe out", duration: 4000 }, { phase: "Hold", duration: 4000 }] },
  { name: "4-7-8 Sleep", desc: "Great for winding down", phases: [{ phase: "Breathe in", duration: 4000 }, { phase: "Hold", duration: 7000 }, { phase: "Breathe out", duration: 8000 }] },
];

const calmingExercises = [
  { title: "Progressive Muscle Relaxation", desc: "Tense each muscle group for 5 seconds, then release. Start from your toes, work up to your head.", icon: "💪" },
  { title: "Body Scan", desc: "Close your eyes. Slowly bring attention to each part of your body, noticing any tension without judgment.", icon: "🧘" },
  { title: "Cold Water Reset", desc: "Splash cold water on your face or hold ice cubes. This activates your dive reflex and calms your nervous system.", icon: "🧊" },
  { title: "Butterfly Hug", desc: "Cross arms over chest, alternately tap each shoulder. This bilateral stimulation helps regulate emotions.", icon: "🦋" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [affirmation] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [breathing, setBreathing] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [breathPhase, setBreathPhase] = useState("");
  const [breathCount, setBreathCount] = useState(0);
  const [breathProgress, setBreathProgress] = useState(0);
  const [currentAffirmation, setCurrentAffirmation] = useState(() =>
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  useEffect(() => {
    if (!breathing) return;
    const pattern = breathPatterns[selectedPattern];
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;

    function next() {
      const p = pattern.phases[idx];
      setBreathPhase(p.phase);
      if (p.phase === "Breathe in") setBreathCount((c) => c + 1);
      
      // Progress animation
      setBreathProgress(0);
      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setBreathProgress(Math.min(elapsed / p.duration, 1));
      }, 50);

      timeout = setTimeout(() => {
        clearInterval(progressInterval);
        idx = (idx + 1) % pattern.phases.length;
        next();
      }, p.duration);
    }
    next();
    return () => { clearTimeout(timeout); clearInterval(progressInterval); };
  }, [breathing, selectedPattern]);

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-10 pb-24 max-w-md mx-auto">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{getGreeting()}</p>
        <h1 className="text-2xl font-heading leading-snug">{affirmation}</h1>
      </motion.div>

      {/* Mood Tracker */}
      <div className="w-full mb-4"><MoodTracker /></div>

      {/* Mood Vision Board */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full mb-4">
        <MoodBoard />
      </motion.div>

      {/* Influences CTA */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/influences")}
        className="w-full bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4 text-left mb-4 hover:bg-muted/50 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
          <BarChart3 size={20} className="text-muted-foreground" />
        </div>
        <div>
          <p className="font-heading text-sm">What influences your mood</p>
          <p className="text-xs text-muted-foreground">See trends and patterns</p>
        </div>
      </motion.button>

      {/* Call CTA */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/talk")}
        className="w-full bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 flex items-center gap-4 text-left mb-4 hover:bg-primary/15 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Phone size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-heading text-sm">Talk it out</p>
          <p className="text-xs text-muted-foreground">Voice call with your AI companion</p>
        </div>
      </motion.button>

      {/* Breathing Exercises — improved with patterns + progress */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full bg-card border border-border rounded-2xl p-4 mb-4">
        {breathing ? (
          <div className="flex flex-col items-center py-4">
            {/* Visual progress ring */}
            <div className="relative w-28 h-28 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray={`${breathProgress * 264} 264`}
                  strokeLinecap="round" className="transition-all duration-100" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <BreathingOrb size={60} />
              </div>
            </div>
            <motion.p key={breathPhase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-heading text-foreground">
              {breathPhase}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1">{breathPatterns[selectedPattern].name} · {breathCount} breaths</p>
            <button onClick={() => { setBreathing(false); setBreathCount(0); }} className="mt-4 text-xs text-muted-foreground underline">Stop</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Wind size={16} className="text-primary" />
              <p className="font-heading text-sm">Breathing Exercises</p>
            </div>
            <div className="space-y-2">
              {breathPatterns.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => { setSelectedPattern(i); setBreathing(true); }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <span className="text-xs text-primary">Start →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Calming Exercises */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <ListChecks size={16} className="text-primary" />
          <p className="font-heading text-sm">Calming Exercises</p>
        </div>
        <div className="space-y-2">
          {calmingExercises.map((ex, i) => (
            <button
              key={i}
              onClick={() => setExpandedExercise(expandedExercise === i ? null : i)}
              className="w-full text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{ex.icon}</span>
                <p className="text-sm font-medium">{ex.title}</p>
              </div>
              {expandedExercise === i && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-muted-foreground mt-2 pl-9 leading-relaxed"
                >
                  {ex.desc}
                </motion.p>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Affirmation */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="w-full bg-card border border-border rounded-2xl p-4">
        <button onClick={() => setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)])} className="w-full text-center">
          <Heart size={16} className="text-primary mx-auto mb-2" />
          <p className="font-heading text-sm leading-relaxed">{currentAffirmation}</p>
          <p className="text-[10px] text-muted-foreground mt-2">Tap for another</p>
        </button>
      </motion.div>
    </div>
  );
}
