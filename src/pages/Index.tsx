import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Heart, Gamepad2 } from "lucide-react";
import MoodTracker from "@/components/MoodTracker";
import { useSyncExternalStore } from "react";
import { getProfile, subscribeProfile } from "@/lib/user-store";
import { useState } from "react";

const affirmations = [
  "I am enough, exactly as I am.",
  "This feeling is temporary.",
  "I choose to let go of what I can't control.",
  "I am stronger than my anxiety.",
  "I deserve peace and calm.",
  "My feelings are valid.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const games = [
  { title: "Gratitude List", desc: "Name 3 things you're grateful for right now", emoji: "🙏", action: "gratitude" },
  { title: "Word Association", desc: "Free-write whatever comes to mind for 60s", emoji: "✍️", action: "words" },
  { title: "Color Your Mood", desc: "Pick a color that matches how you feel", emoji: "🎨", action: "color" },
  { title: "Memory Lane", desc: "Recall a happy memory in detail", emoji: "📸", action: "memory" },
];

const moodColors = [
  { color: "bg-red-300 dark:bg-red-800", label: "Fiery", mood: "angry" },
  { color: "bg-amber-300 dark:bg-amber-800", label: "Warm", mood: "hopeful" },
  { color: "bg-sky-300 dark:bg-sky-800", label: "Calm", mood: "peaceful" },
  { color: "bg-indigo-300 dark:bg-indigo-800", label: "Deep", mood: "reflective" },
  { color: "bg-emerald-300 dark:bg-emerald-800", label: "Fresh", mood: "good" },
  { color: "bg-violet-300 dark:bg-violet-800", label: "Dreamy", mood: "creative" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const [currentAffirmation, setCurrentAffirmation] = useState(() =>
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gratitudeItems, setGratitudeItems] = useState(["", "", ""]);
  const [freeWrite, setFreeWrite] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const firstName = profile.name?.split(" ")[0] || "";

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-8 pb-24 max-w-md mx-auto">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="text-2xl font-heading leading-snug">How are you today?</h1>
      </motion.div>

      {/* Mood Check-in */}
      <div className="w-full mb-5">
        <MoodTracker />
      </div>

      {/* Talk CTA — prominent */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/talk")}
        className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-5 flex items-center gap-4 text-left mb-5 shadow-lg shadow-primary/15"
      >
        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
          <Phone size={20} />
        </div>
        <div>
          <p className="font-heading text-base">Talk it out</p>
          <p className="text-xs opacity-80">Voice call with your companion</p>
        </div>
      </motion.button>

      {/* Activities / Games */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full mb-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Gamepad2 size={14} className="text-muted-foreground" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Activities</p>
        </div>

        {!activeGame ? (
          <div className="grid grid-cols-2 gap-2">
            {games.map((g) => (
              <motion.button
                key={g.action}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveGame(g.action)}
                className="bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-2xl block mb-2">{g.emoji}</span>
                <p className="text-sm font-heading leading-tight">{g.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{g.desc}</p>
              </motion.button>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            {activeGame === "gratitude" && (
              <div>
                <p className="font-heading text-sm mb-3">🙏 Three things you're grateful for</p>
                <div className="space-y-2">
                  {gratitudeItems.map((item, i) => (
                    <input
                      key={i}
                      value={item}
                      onChange={(e) => {
                        const copy = [...gratitudeItems];
                        copy[i] = e.target.value;
                        setGratitudeItems(copy);
                      }}
                      placeholder={`${i + 1}.`}
                      className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  ))}
                </div>
              </div>
            )}
            {activeGame === "words" && (
              <div>
                <p className="font-heading text-sm mb-3">✍️ Free write — whatever comes to mind</p>
                <textarea
                  value={freeWrite}
                  onChange={(e) => setFreeWrite(e.target.value)}
                  placeholder="Just start typing..."
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            )}
            {activeGame === "color" && (
              <div>
                <p className="font-heading text-sm mb-3">🎨 Pick the color that matches your mood</p>
                <div className="grid grid-cols-3 gap-2">
                  {moodColors.map((c) => (
                    <button
                      key={c.mood}
                      onClick={() => setSelectedColor(c.mood)}
                      className={`aspect-square rounded-xl ${c.color} flex items-center justify-center transition-all ${
                        selectedColor === c.mood ? "ring-2 ring-primary scale-105" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-xs font-medium text-foreground/80">{c.label}</span>
                    </button>
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    You're feeling {moodColors.find((c) => c.mood === selectedColor)?.label.toLowerCase()} today ✨
                  </p>
                )}
              </div>
            )}
            {activeGame === "memory" && (
              <div>
                <p className="font-heading text-sm mb-3">📸 Describe a happy memory in detail</p>
                <textarea
                  placeholder="Where were you? Who was there? What did it feel like?"
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            )}
            <button onClick={() => setActiveGame(null)} className="text-xs text-muted-foreground underline mt-4 block">
              ← Back to activities
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Affirmation */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
        <button
          onClick={() => setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)])}
          className="w-full bg-card border border-border rounded-xl p-4 text-center"
        >
          <Heart size={14} className="text-primary mx-auto mb-1.5" />
          <p className="font-heading text-sm leading-relaxed">{currentAffirmation}</p>
          <p className="text-[10px] text-muted-foreground mt-1.5">Tap for another</p>
        </button>
      </motion.div>
    </div>
  );
}
