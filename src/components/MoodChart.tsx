import { useSyncExternalStore } from "react";
import { getWeekMoods, subscribeMoods } from "@/lib/mood-store";

const moodScore: Record<string, number> = {
  great: 5,
  good: 4,
  okay: 3,
  anxious: 2,
  sad: 1,
  angry: 1,
};

const moodEmoji: Record<string, string> = {
  great: "😊",
  good: "😌",
  okay: "😐",
  anxious: "😰",
  sad: "😢",
  angry: "😤",
};

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export default function MoodChart() {
  const weekMoods = useSyncExternalStore(subscribeMoods, getWeekMoods, getWeekMoods);

  // Build last 7 days
  const days: { label: string; date: string; mood?: string; score: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = weekMoods.find((m) => m.date === dateStr);
    days.push({
      label: dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1],
      date: dateStr,
      mood: entry?.mood,
      score: entry ? (moodScore[entry.mood] || 3) : 0,
    });
  }

  const maxScore = 5;

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">This week</p>
      <p className="font-heading text-lg mb-4">Mood Trends</p>
      <div className="flex items-end justify-between gap-1 h-24">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {day.mood && (
              <span className="text-sm">{moodEmoji[day.mood]}</span>
            )}
            <div
              className="w-full rounded-lg transition-all"
              style={{
                height: day.score ? `${(day.score / maxScore) * 60}px` : "4px",
                backgroundColor: day.score
                  ? `hsl(var(--primary) / ${0.3 + (day.score / maxScore) * 0.7})`
                  : "hsl(var(--muted))",
              }}
            />
            <span className="text-[10px] text-muted-foreground">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
