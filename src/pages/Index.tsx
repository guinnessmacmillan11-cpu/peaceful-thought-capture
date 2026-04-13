import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, MessageSquare, LogOut, Bell } from "lucide-react";
import MoodTracker from "@/components/MoodTracker";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { isPushSupported, requestNotificationPermission, scheduleLocalReminder, scheduleAnxietyReminder } from "@/lib/notifications";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const conversationPrompts = [
  "I'm feeling overwhelmed today…", "I need someone to talk to", "Help me process my thoughts",
  "I had a rough day", "I want to feel better",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return isPushSupported() && typeof Notification !== "undefined" && Notification?.permission === "granted"; }
    catch { return false; }
  });

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if (granted) { scheduleLocalReminder(); scheduleAnxietyReminder(); }
  };

  const firstName = profile?.name?.split(" ")[0] || "";

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-8 pb-24 max-w-md mx-auto gap-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full relative">
        <div className="absolute right-0 top-0 flex gap-1">
          {isPushSupported() && !notifEnabled && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={enableNotifications} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={16} />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={16} />
          </motion.button>
        </div>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          {getGreeting()}{firstName ? `, ${firstName}` : ""} 🎋
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="text-2xl font-heading leading-snug">
          How are you today?
        </motion.h1>
      </motion.div>

      {/* Mood Tracker */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full">
        <MoodTracker />
      </motion.div>

      {/* Talk CTA - Voice */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="w-full">
        <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={() => navigate("/talk")}
          className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-5 flex items-center gap-4 text-left shadow-lg shadow-primary/15 transition-shadow hover:shadow-xl">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Phone size={20} />
          </motion.div>
          <div>
            <p className="font-heading text-base">Call Bao</p>
            <p className="text-xs opacity-80">Voice call with your buddy</p>
          </div>
        </motion.button>
      </motion.div>

      {/* Talk CTA - Text */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
        <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={() => navigate("/talk?mode=text")}
          className="w-full bg-card border border-border text-foreground rounded-2xl px-5 py-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-heading text-base">Text Bao</p>
            <p className="text-xs text-muted-foreground">Chat whenever you need</p>
          </div>
        </motion.button>
      </motion.div>

      {/* Quick prompts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {conversationPrompts.map((prompt, i) => (
            <motion.button key={prompt}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              onClick={() => navigate(`/talk?prompt=${encodeURIComponent(prompt)}`)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors whitespace-nowrap hover:scale-105 active:scale-95">
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
