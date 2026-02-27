import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Heart, Smile, Frown, Meh, Zap, CloudRain, Sun, Sparkles, Hand, ListChecks } from "lucide-react";
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

const moods = [
  { emoji: "😊", label: "Good", key: "good" },
  { emoji: "😌", label: "Calm", key: "calm" },
  { emoji: "😐", label: "Meh", key: "meh" },
  { emoji: "😰", label: "Anxious", key: "anxious" },
  { emoji: "😢", label: "Sad", key: "sad" },
  { emoji: "😤", label: "Frustrated", key: "frustrated" },
];

const groundingSenses = [
  { count: 5, sense: "things you can SEE" },
  { count: 4, sense: "things you can TOUCH" },
  { count: 3, sense: "things you can HEAR" },
  { count: 2, sense: "things you can SMELL" },
  { count: 1, sense: "thing you can TASTE" },
];

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

export default function HomePage() {
  const navigate = useNavigate();
  const [affirmation] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const [breathCount, setBreathCount] = useState(0);
  const [todayMood, setTodayMood] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem("calm-mood-today");
      if (stored) {
        const { mood, date } = JSON.parse(stored);
        if (date === new Date().toDateString()) return mood;
      }
    } catch {}
    return null;
  });
  const [groundingStep, setGroundingStep] = useState(-1);
  const [currentAffirmation, setCurrentAffirmation] = useState(() =>
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );

  const logMood = (key: string) => {
    setTodayMood(key);
    try {
      localStorage.setItem("calm-mood-today", JSON.stringify({ mood: key, date: new Date().toDateString() }));
    } catch {}
  };

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
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-10 pb-6 max-w-md mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <p className="text-muted-foreground text-sm mb-1">{getGreeting()}</p>
        <h1 className="text-2xl font-heading leading-snug">{affirmation}</h1>
      </motion.div>

      {/* Mood Check-in */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full bg-card border border-border rounded-2xl p-4 mb-4"
      >
        <p className="text-sm font-heading mb-3">
          {todayMood ? "Today you're feeling" : "How are you feeling?"}
        </p>
        <div className="flex justify-between">
          {moods.map((m) => (
            <button
              key={m.key}
              onClick={() => logMood(m.key)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                todayMood === m.key
                  ? "bg-primary/10 scale-110"
                  : todayMood
                  ? "opacity-40"
                  : "hover:bg-muted active:scale-95"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
        {todayMood && (
          <button
            onClick={() => { setTodayMood(null); localStorage.removeItem("calm-mood-today"); }}
            className="text-[10px] text-muted-foreground underline mt-2"
          >
            Change
          </button>
        )}
      </motion.div>

      {/* Call CTA */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/talk")}
        className="w-full bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 flex items-center gap-4 text-left mb-4 hover:bg-primary/15 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Phone size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-heading text-sm">Call your companion</p>
          <p className="text-xs text-muted-foreground">Talk it out like FaceTime — AI listens & responds</p>
        </div>
      </motion.button>

      {/* Breathing */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full bg-card border border-border rounded-2xl p-4 mb-4"
      >
        {breathing ? (
          <div className="flex flex-col items-center py-2">
            <BreathingOrb size={100} />
            <motion.p
              key={breathPhase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-muted-foreground font-medium"
            >
              {breathPhase === "in" && "Breathe in..."}
              {breathPhase === "hold" && "Hold..."}
              {breathPhase === "out" && "Breathe out..."}
            </motion.p>
            <p className="text-xs text-muted-foreground/60 mt-1">{breathCount} breaths</p>
            <button
              onClick={() => { setBreathing(false); setBreathCount(0); }}
              className="mt-3 text-xs text-muted-foreground underline"
            >
              Done
            </button>
          </div>
        ) : (
          <button onClick={() => setBreathing(true)} className="flex items-center gap-4 w-full group">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <BreathingOrb size={32} />
            </div>
            <div className="text-left">
              <p className="font-heading text-sm">Breathing exercise</p>
              <p className="text-xs text-muted-foreground">4-4-6 calming breath pattern</p>
            </div>
          </button>
        )}
      </motion.div>

      {/* 5-4-3-2-1 Grounding */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full bg-card border border-border rounded-2xl p-4 mb-4"
      >
        {groundingStep >= 0 ? (
          <div className="text-center py-2">
            {groundingStep < 5 ? (
              <>
                <p className="text-3xl font-heading text-primary mb-2">{groundingSenses[groundingStep].count}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Notice {groundingSenses[groundingStep].sense}
                </p>
                <div className="flex gap-2 justify-center">
                  {groundingStep > 0 && (
                    <button onClick={() => setGroundingStep(groundingStep - 1)} className="text-xs text-muted-foreground underline">
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => setGroundingStep(groundingStep + 1)}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-medium"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <Sparkles size={24} className="text-primary mx-auto mb-2" />
                <p className="text-sm font-heading mb-1">You're grounded.</p>
                <p className="text-xs text-muted-foreground mb-3">Take a moment to notice how you feel now.</p>
                <button onClick={() => setGroundingStep(-1)} className="text-xs text-muted-foreground underline">
                  Done
                </button>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => setGroundingStep(0)} className="flex items-center gap-4 w-full group">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Hand size={20} className="text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-heading text-sm">5-4-3-2-1 Grounding</p>
              <p className="text-xs text-muted-foreground">Come back to the present moment</p>
            </div>
          </button>
        )}
      </motion.div>

      {/* Affirmation card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="w-full bg-card border border-border rounded-2xl p-4 mb-4"
      >
        <button
          onClick={() => setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)])}
          className="w-full text-center group"
        >
          <Heart size={16} className="text-primary mx-auto mb-2" />
          <p className="font-heading text-sm leading-relaxed">{currentAffirmation}</p>
          <p className="text-[10px] text-muted-foreground mt-2 group-hover:text-foreground transition-colors">
            Tap for another
          </p>
        </button>
      </motion.div>

      {/* Quick stress tips */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="w-full bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <ListChecks size={16} className="text-primary" />
          <p className="font-heading text-sm">Quick stress relief</p>
        </div>
        <div className="space-y-2">
          {[
            "Splash cold water on your face",
            "Tense all your muscles for 5 seconds, then release",
            "Name 3 things you're grateful for right now",
            "Step outside and feel the air for 30 seconds",
          ].map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {tip}
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
