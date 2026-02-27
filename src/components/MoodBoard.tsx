import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { getMoodHistory, subscribeMoods, type MoodEntry } from "@/lib/mood-store";

const moodCards: Record<string, { emoji: string; label: string; gradient: string; quote: string; vibe: string }> = {
  great: { emoji: "😊", label: "Great", gradient: "from-emerald-100 to-green-50", quote: "Radiate what you wish to attract", vibe: "Thriving" },
  good: { emoji: "😌", label: "Good", gradient: "from-sky-100 to-blue-50", quote: "Peace begins with a smile", vibe: "At ease" },
  okay: { emoji: "😐", label: "Okay", gradient: "from-slate-100 to-gray-50", quote: "It's okay to just be", vibe: "Steady" },
  anxious: { emoji: "😰", label: "Anxious", gradient: "from-amber-100 to-yellow-50", quote: "This storm will pass", vibe: "Weathering" },
  sad: { emoji: "😢", label: "Sad", gradient: "from-indigo-100 to-purple-50", quote: "Tears water the seeds of growth", vibe: "Healing" },
  angry: { emoji: "😤", label: "Angry", gradient: "from-red-100 to-orange-50", quote: "Feel it, then release it", vibe: "Processing" },
};

export default function MoodBoard() {
  const history = useSyncExternalStore(subscribeMoods, getMoodHistory, getMoodHistory);
  const recent = history.slice(0, 9);

  if (recent.length === 0) {
    return (
      <div className="w-full bg-card border border-border rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Vision Board</p>
        <p className="font-heading text-lg mb-3">Your Mood Journey</p>
        <p className="text-sm text-muted-foreground">Check in daily to build your vision board — each mood becomes a tile in your personal mosaic.</p>
      </div>
    );
  }

  // Create a mosaic-like grid
  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 overflow-hidden">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Vision Board</p>
      <p className="font-heading text-lg mb-3">Your Mood Mosaic</p>
      <div className="grid grid-cols-3 gap-2">
        {recent.map((entry, i) => {
          const card = moodCards[entry.mood] || moodCards.okay;
          const isLarge = i === 0;
          return (
            <motion.div
              key={entry.date + i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-xl bg-gradient-to-br ${card.gradient} overflow-hidden ${
                isLarge ? "col-span-2 row-span-2" : ""
              }`}
              style={{ minHeight: isLarge ? 140 : 80 }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                <span className={isLarge ? "text-4xl mb-1" : "text-2xl"}>{card.emoji}</span>
                {isLarge ? (
                  <>
                    <p className="font-heading text-xs mt-1 text-foreground/80">{card.quote}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">{new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{card.vibe}</p>
                    <p className="text-[8px] text-muted-foreground/60">{new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </>
                )}
              </div>
              {entry.reason && isLarge && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-[10px] bg-background/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-muted-foreground">
                    {entry.reason}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
