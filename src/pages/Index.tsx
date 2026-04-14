import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, MessageSquare, LogOut, Moon, Sun } from "lucide-react";
import MoodTracker from "@/components/MoodTracker";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import pandaIdle from "@/assets/panda-idle.png";
import pandaHappy from "@/assets/panda-happy.png";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const affirmations = [
  "You're doing better than you think 🌟",
  "One breath at a time, you got this 🐼",
  "Be kind to yourself today 💚",
  "Small steps still count 🌱",
  "You deserve peace and calm 🕊️",
  "Today is a fresh start ☀️",
  "You are enough, always 💫",
  "Your feelings are valid 🌈",
  "Progress > perfection ✨",
  "Bao believes in you! 🎋",
];

function getDailyAffirmation() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return affirmations[dayOfYear % affirmations.length];
}

const quickPrompts = [
  "I'm feeling overwhelmed…",
  "Help me calm down",
  "I had a rough day",
  "I want to feel better",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [pandaMood, setPandaMood] = useState<"idle" | "happy">("idle");

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("bao-theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("bao-theme");
    if (saved === "dark") { document.documentElement.classList.add("dark"); setIsDark(true); }
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "";

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-6 pb-24 max-w-md mx-auto gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full relative">
        <div className="absolute right-0 top-0 flex gap-1">
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleDark} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={16} />
          </motion.button>
        </div>
        <div className="flex items-center gap-3">
          <motion.img
            src={pandaMood === "happy" ? pandaHappy : pandaIdle}
            alt="Bao"
            className="w-12 h-12"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            onHoverStart={() => setPandaMood("happy")}
            onHoverEnd={() => setPandaMood("idle")}
          />
          <div>
            <p className="text-xs text-muted-foreground">
              {getGreeting()}{firstName ? `, ${firstName}` : ""} 🎋
            </p>
            <h1 className="text-xl font-heading leading-snug">How are you?</h1>
          </div>
        </div>
      </motion.div>

      {/* Daily Affirmation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-gradient-to-r from-primary/10 to-accent/30 border border-primary/20 rounded-2xl px-4 py-3 text-center"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Daily affirmation</p>
          <motion.p
            key={getDailyAffirmation()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-heading"
          >
            {getDailyAffirmation()}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Mood Tracker */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full">
        <MoodTracker />
      </motion.div>

      {/* Talk CTAs */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full flex gap-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/talk")}
          className="flex-1 bg-primary text-primary-foreground rounded-2xl px-4 py-4 flex items-center gap-3 text-left shadow-lg shadow-primary/15">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Phone size={18} />
          </motion.div>
          <div>
            <p className="font-heading text-sm">Call Bao</p>
            <p className="text-[10px] opacity-80">Voice chat</p>
          </div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/talk?mode=text")}
          className="flex-1 bg-card border border-border text-foreground rounded-2xl px-4 py-4 flex items-center gap-3 text-left shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-heading text-sm">Text Bao</p>
            <p className="text-[10px] text-muted-foreground">Type it out</p>
          </div>
        </motion.button>
      </motion.div>

      {/* Quick prompts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickPrompts.map((prompt, i) => (
            <motion.button key={prompt}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => navigate(`/talk?prompt=${encodeURIComponent(prompt)}`)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors whitespace-nowrap hover:scale-105 active:scale-95">
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Panda tip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
      >
        <motion.img src={pandaIdle} alt="Bao" className="w-10 h-10 shrink-0" animate={{ rotate: [0, -3, 3, 0] }} transition={{ duration: 3, repeat: Infinity }} />
        <div>
          <p className="text-xs font-heading mb-0.5">Bao's tip 🐼</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {["Try a breathing exercise today!", "Check out the mini games 🎮", "Write in your journal tonight 📓", "Your streak is looking good! 🔥"][new Date().getDay() % 4]}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
