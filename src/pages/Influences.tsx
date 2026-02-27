import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { getMoodHistory, subscribeMoods } from "@/lib/mood-store";
import { TrendingUp, TrendingDown, Minus, Cloud, Briefcase, Heart, Users, Moon, Utensils } from "lucide-react";

const influenceCategories = [
  { icon: Briefcase, label: "Work", key: "work", reasons: ["Work stress", "Productive day", "Frustration at work", "Feeling accomplished"] },
  { icon: Heart, label: "Relationships", key: "relationships", reasons: ["Quality time", "Missing someone", "Feeling lonely", "Conflict"] },
  { icon: Moon, label: "Sleep & Rest", key: "sleep", reasons: ["A bit tired", "Relaxed", "Exhausted"] },
  { icon: Cloud, label: "Environment", key: "environment", reasons: ["Nice weather", "Step outside"] },
  { icon: Users, label: "Social", key: "social", reasons: ["Feeling unheard", "Good news", "Something fun"] },
  { icon: Utensils, label: "Self-care", key: "selfcare", reasons: ["Just grateful", "Nothing special", "Going through motions"] },
];

const moodScore: Record<string, number> = { great: 5, good: 4, okay: 3, anxious: 2, sad: 1, angry: 1 };

export default function MoodInfluences() {
  const history = useSyncExternalStore(subscribeMoods, getMoodHistory, getMoodHistory);

  // Analyze which reasons appear most and their associated moods
  const influenceData = influenceCategories.map((cat) => {
    const matches = history.filter((e) => cat.reasons.some((r) => e.reason === r));
    const avgScore = matches.length > 0
      ? matches.reduce((sum, e) => sum + (moodScore[e.mood] || 3), 0) / matches.length
      : 0;
    const trend = avgScore >= 3.5 ? "positive" : avgScore >= 2.5 ? "neutral" : avgScore > 0 ? "negative" : "none";
    return { ...cat, count: matches.length, avgScore, trend };
  });

  const hasData = history.length > 0;

  return (
    <div className="min-h-[80vh] px-4 py-6 max-w-md mx-auto pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-heading text-2xl mb-1">Influences</h1>
        <p className="text-muted-foreground text-sm mb-6">Understand what shapes how you feel.</p>
      </motion.div>

      {!hasData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-12">
          <Cloud size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-sm mb-1">No data yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Check in with your mood daily. Over time, you'll see patterns in what influences how you feel.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {influenceData.map((inf, i) => {
            const Icon = inf.icon;
            return (
              <motion.div
                key={inf.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm">{inf.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {inf.count === 0
                      ? "No entries yet"
                      : `${inf.count} check-in${inf.count > 1 ? "s" : ""}`}
                  </p>
                </div>
                {inf.trend !== "none" && (
                  <div className={`flex items-center gap-1 text-xs ${
                    inf.trend === "positive" ? "text-primary" : inf.trend === "negative" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {inf.trend === "positive" && <TrendingUp size={14} />}
                    {inf.trend === "negative" && <TrendingDown size={14} />}
                    {inf.trend === "neutral" && <Minus size={14} />}
                    <span>{inf.trend === "positive" ? "Uplifting" : inf.trend === "negative" ? "Draining" : "Neutral"}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Weekly insight */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Insight</p>
          <p className="font-heading text-sm leading-relaxed">
            {(() => {
              const top = influenceData.filter((d) => d.count > 0).sort((a, b) => b.count - a.count)[0];
              if (!top) return "Keep checking in to unlock personalized insights.";
              return top.trend === "positive"
                ? `${top.label} has been a positive force in your life. Keep nurturing it.`
                : top.trend === "negative"
                ? `${top.label} seems to be weighing on you. Consider what might help.`
                : `${top.label} appears often in your check-ins. Pay attention to how it affects you.`;
            })()}
          </p>
        </motion.div>
      )}
    </div>
  );
}
