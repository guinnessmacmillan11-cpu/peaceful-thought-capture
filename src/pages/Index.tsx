import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Heart, Gamepad2, Trophy, RotateCcw } from "lucide-react";
import MoodTracker from "@/components/MoodTracker";
import { useSyncExternalStore } from "react";
import { getProfile, subscribeProfile } from "@/lib/user-store";
import { useState, useCallback } from "react";

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

const gameList = [
  { title: "Emoji Match", desc: "Test your memory with emoji pairs", emoji: "🧠", action: "emoji-match" },
  { title: "Vibe Check", desc: "Tap the emoji that matches the word", emoji: "⚡", action: "vibe-check" },
  { title: "Calm Tap", desc: "Tap in rhythm to calm down", emoji: "🎯", action: "calm-tap" },
  { title: "Positivity Spin", desc: "Spin for a feel-good challenge", emoji: "🎰", action: "spin" },
];

const emojiPairs = ["😊", "🌟", "🦋", "🌈", "🎵", "💫"];

const vibeWords = [
  { word: "Happy", correct: "😊", options: ["😊", "😢", "😡", "😴"] },
  { word: "Peaceful", correct: "🧘", options: ["🎉", "🧘", "💥", "😤"] },
  { word: "Excited", correct: "🎉", options: ["😴", "😢", "🎉", "😐"] },
  { word: "Loved", correct: "💕", options: ["💕", "💔", "😠", "🥶"] },
  { word: "Brave", correct: "🦁", options: ["🐭", "🦁", "🐢", "🐛"] },
  { word: "Creative", correct: "🎨", options: ["📊", "🎨", "🧱", "📎"] },
];

const spinChallenges = [
  "Text someone you love 💬",
  "Dance to your fave song 💃",
  "Say 3 nice things about yourself 🪞",
  "Take a silly selfie 🤳",
  "Hum a happy tune 🎶",
  "Stretch for 30 seconds 🧘",
  "Smile at yourself in the mirror 😁",
  "Write down a dream goal ✨",
];

export default function HomePage() {
  const navigate = useNavigate();
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const [currentAffirmation, setCurrentAffirmation] = useState(() =>
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Emoji Match
  const [matchCards, setMatchCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [matchMoves, setMatchMoves] = useState(0);

  // Vibe Check
  const [vibeIndex, setVibeIndex] = useState(0);
  const [vibeScore, setVibeScore] = useState(0);
  const [vibeAnswer, setVibeAnswer] = useState<string | null>(null);

  // Calm Tap
  const [tapCount, setTapCount] = useState(0);
  const [tapPhase, setTapPhase] = useState<"inhale" | "exhale">("inhale");
  const [tapComplete, setTapComplete] = useState(false);

  // Spin
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  const firstName = profile.name?.split(" ")[0] || "";

  const initEmojiMatch = useCallback(() => {
    const shuffled = [...emojiPairs, ...emojiPairs].sort(() => Math.random() - 0.5);
    setMatchCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMatchMoves(0);
  }, []);

  const handleCardFlip = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMatchMoves((m) => m + 1);
      if (matchCards[newFlipped[0]] === matchCards[newFlipped[1]]) {
        setMatched((prev) => [...prev, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 600);
      }
    }
  };

  const handleVibeAnswer = (emoji: string) => {
    setVibeAnswer(emoji);
    if (emoji === vibeWords[vibeIndex].correct) setVibeScore((s) => s + 1);
    setTimeout(() => {
      setVibeAnswer(null);
      if (vibeIndex < vibeWords.length - 1) setVibeIndex((i) => i + 1);
    }, 700);
  };

  const handleCalmTap = () => {
    setTapCount((c) => {
      const next = c + 1;
      if (next >= 20) setTapComplete(true);
      if (next % 4 === 0) setTapPhase((p) => (p === "inhale" ? "exhale" : "inhale"));
      return next;
    });
  };

  const handleSpin = () => {
    setSpinning(true);
    setSpinResult(null);
    setTimeout(() => {
      setSpinResult(spinChallenges[Math.floor(Math.random() * spinChallenges.length)]);
      setSpinning(false);
    }, 1500);
  };

  const startGame = (action: string) => {
    setActiveGame(action);
    if (action === "emoji-match") initEmojiMatch();
    if (action === "vibe-check") { setVibeIndex(0); setVibeScore(0); setVibeAnswer(null); }
    if (action === "calm-tap") { setTapCount(0); setTapPhase("inhale"); setTapComplete(false); }
    if (action === "spin") { setSpinResult(null); setSpinning(false); }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-8 pb-24 max-w-md mx-auto">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="text-2xl font-heading leading-snug">How are you today?</h1>
      </motion.div>

      <div className="w-full mb-5">
        <MoodTracker />
      </div>

      {/* Talk CTA */}
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

      {/* Games */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Gamepad2 size={14} className="text-muted-foreground" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Games</p>
        </div>

        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
              {gameList.map((g) => (
                <motion.button
                  key={g.action}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(g.action)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-2xl block mb-2">{g.emoji}</span>
                  <p className="text-sm font-heading leading-tight">{g.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{g.desc}</p>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div key="game" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-xl p-5">

              {/* EMOJI MATCH */}
              {activeGame === "emoji-match" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-heading text-sm">🧠 Emoji Match</p>
                    <span className="text-xs text-muted-foreground">Moves: {matchMoves}</span>
                  </div>
                  {matched.length === matchCards.length && matchCards.length > 0 ? (
                    <div className="text-center py-4">
                      <Trophy size={28} className="text-primary mx-auto mb-2" />
                      <p className="font-heading text-base">Nice! 🎉</p>
                      <p className="text-xs text-muted-foreground">Completed in {matchMoves} moves</p>
                      <button onClick={initEmojiMatch} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto">
                        <RotateCcw size={12} /> Play again
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {matchCards.map((emoji, i) => {
                        const isVisible = flipped.includes(i) || matched.includes(i);
                        return (
                          <motion.button
                            key={i}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCardFlip(i)}
                            className={`aspect-square rounded-lg text-lg flex items-center justify-center transition-all ${
                              isVisible ? "bg-primary/10 border border-primary/30" : "bg-muted/60 border border-border"
                            } ${matched.includes(i) ? "opacity-50" : ""}`}
                          >
                            {isVisible ? emoji : "?"}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIBE CHECK */}
              {activeGame === "vibe-check" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-heading text-sm">⚡ Vibe Check</p>
                    <span className="text-xs text-muted-foreground">{vibeScore}/{vibeWords.length}</span>
                  </div>
                  {vibeIndex >= vibeWords.length - 1 && vibeAnswer !== null ? (
                    <div className="text-center py-4">
                      <p className="text-3xl mb-2">🏆</p>
                      <p className="font-heading text-base">Score: {vibeScore}/{vibeWords.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {vibeScore >= 5 ? "You're in tune! 🎯" : vibeScore >= 3 ? "Not bad! 😊" : "Keep vibing! ✨"}
                      </p>
                      <button onClick={() => { setVibeIndex(0); setVibeScore(0); setVibeAnswer(null); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto">
                        <RotateCcw size={12} /> Play again
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-2xl font-heading mb-4">{vibeWords[vibeIndex].word}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {vibeWords[vibeIndex].options.map((emoji) => (
                          <motion.button
                            key={emoji}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => !vibeAnswer && handleVibeAnswer(emoji)}
                            className={`text-2xl py-3 rounded-xl border transition-all ${
                              vibeAnswer === emoji
                                ? emoji === vibeWords[vibeIndex].correct
                                  ? "bg-primary/20 border-primary"
                                  : "bg-destructive/20 border-destructive"
                                : "border-border bg-muted/30 hover:bg-muted/60"
                            }`}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3">{vibeIndex + 1} / {vibeWords.length}</p>
                    </div>
                  )}
                </div>
              )}

              {/* CALM TAP */}
              {activeGame === "calm-tap" && (
                <div className="text-center">
                  <p className="font-heading text-sm mb-2">🎯 Calm Tap</p>
                  <p className="text-xs text-muted-foreground mb-4">Tap the circle in rhythm — 20 taps to calm</p>
                  {tapComplete ? (
                    <div className="py-4">
                      <p className="text-3xl mb-2">😌</p>
                      <p className="font-heading text-base">Feeling calmer?</p>
                      <button onClick={() => { setTapCount(0); setTapComplete(false); setTapPhase("inhale"); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto">
                        <RotateCcw size={12} /> Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={handleCalmTap}
                        animate={{ scale: tapPhase === "inhale" ? [1, 1.08, 1] : [1, 0.95, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-28 h-28 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-3"
                      >
                        <span className="text-xs font-heading text-primary">{tapPhase === "inhale" ? "Breathe in" : "Breathe out"}</span>
                      </motion.button>
                      <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                        <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(tapCount / 20) * 100}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{tapCount}/20</p>
                    </>
                  )}
                </div>
              )}

              {/* POSITIVITY SPIN */}
              {activeGame === "spin" && (
                <div className="text-center">
                  <p className="font-heading text-sm mb-4">🎰 Positivity Spin</p>
                  {spinResult ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="font-heading text-base leading-relaxed mb-4">{spinResult}</p>
                      <button onClick={handleSpin} className="text-xs text-primary flex items-center gap-1 mx-auto">
                        <RotateCcw size={12} /> Spin again
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSpin}
                      disabled={spinning}
                      animate={spinning ? { rotate: 360 } : {}}
                      transition={spinning ? { duration: 0.5, repeat: Infinity, ease: "linear" } : {}}
                      className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center mx-auto"
                    >
                      <span className="text-3xl">{spinning ? "🌀" : "🎰"}</span>
                    </motion.button>
                  )}
                  {!spinResult && !spinning && <p className="text-xs text-muted-foreground mt-3">Tap to spin!</p>}
                </div>
              )}

              <button onClick={() => setActiveGame(null)} className="text-xs text-muted-foreground underline mt-4 block mx-auto">
                ← Back to games
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
