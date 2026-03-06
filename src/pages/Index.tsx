import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Heart, Gamepad2, Trophy, RotateCcw, Wind, ChevronDown, ChevronUp, Shuffle } from "lucide-react";
import MoodTracker from "@/components/MoodTracker";
import { useSyncExternalStore } from "react";
import { getProfile, subscribeProfile } from "@/lib/user-store";
import { useState, useCallback, useEffect, useRef } from "react";

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

const conversationPrompts = [
  "I'm feeling overwhelmed today…",
  "I need someone to talk to",
  "Help me process my thoughts",
  "I had a rough day",
  "I want to feel better",
];

// --- GAMES ---
const emojiPairs = ["😊", "🌟", "🦋", "🌈", "🎵", "💫"];

const wordScrambles = [
  { scrambled: "CEPEA", answer: "PEACE" },
  { scrambled: "YOJF", answer: "JOYF" },
  { scrambled: "MLAC", answer: "CALM" },
  { scrambled: "PEHO", answer: "HOPE" },
  { scrambled: "VLEO", answer: "LOVE" },
  { scrambled: "MILSE", answer: "SMILE" },
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

const triviaQuestions = [
  { q: "Laughing for 15 minutes burns how many calories?", options: ["10", "40", "100", "5"], correct: "40" },
  { q: "What hormone is released when you hug someone?", options: ["Cortisol", "Oxytocin", "Adrenaline", "Melatonin"], correct: "Oxytocin" },
  { q: "How many muscles does it take to smile?", options: ["17", "43", "6", "26"], correct: "17" },
  { q: "Which color is most calming?", options: ["Red", "Blue", "Yellow", "Green"], correct: "Blue" },
];

const breathPatterns = [
  { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4, holdOut: 4, rounds: 4 },
  { name: "4-7-8 Calm", inhale: 4, hold: 7, exhale: 8, holdOut: 0, rounds: 3 },
  { name: "Quick Reset", inhale: 3, hold: 0, exhale: 6, holdOut: 0, rounds: 5 },
];

type GameType = "emoji-match" | "spin" | "word-scramble" | "trivia" | null;

const gameList = [
  { title: "Emoji Match", desc: "Test your memory", emoji: "🧠", action: "emoji-match" as GameType },
  { title: "Positivity Spin", desc: "Get a fun challenge", emoji: "🎰", action: "spin" as GameType },
  { title: "Word Unscramble", desc: "Find the positive word", emoji: "🔤", action: "word-scramble" as GameType },
  { title: "Feel-Good Trivia", desc: "Learn fun facts", emoji: "❓", action: "trivia" as GameType },
];

export default function HomePage() {
  const navigate = useNavigate();
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const [currentAffirmation, setCurrentAffirmation] = useState(() =>
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );
  
  // Section toggles
  const [gamesOpen, setGamesOpen] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType>(null);

  // Emoji Match
  const [matchCards, setMatchCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [matchMoves, setMatchMoves] = useState(0);

  // Spin
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  // Word Scramble
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [scrambleInput, setScrambleInput] = useState("");
  const [scrambleResult, setScrambleResult] = useState<"correct" | "wrong" | null>(null);

  // Trivia
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaAnswer, setTriviaAnswer] = useState<string | null>(null);
  const [triviaScore, setTriviaScore] = useState(0);

  // Breathing
  const [activeBreath, setActiveBreath] = useState<number | null>(null);
  const [breathPhase, setBreathPhase] = useState<string>("Ready");
  const [breathRound, setBreathRound] = useState(0);
  const [breathActive, setBreathActive] = useState(false);
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Random game spinner
  const [spinningGame, setSpinningGame] = useState(false);

  const firstName = profile.name?.split(" ")[0] || "";

  // --- Game Initializers ---
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

  const handleSpin = () => {
    setSpinning(true);
    setSpinResult(null);
    setTimeout(() => {
      setSpinResult(spinChallenges[Math.floor(Math.random() * spinChallenges.length)]);
      setSpinning(false);
    }, 1500);
  };

  const handleScrambleCheck = () => {
    const current = wordScrambles[scrambleIndex];
    if (scrambleInput.toUpperCase().trim() === current.answer) {
      setScrambleResult("correct");
    } else {
      setScrambleResult("wrong");
    }
    setTimeout(() => {
      setScrambleResult(null);
      setScrambleInput("");
      if (scrambleIndex < wordScrambles.length - 1) {
        setScrambleIndex((i) => i + 1);
      }
    }, 1200);
  };

  const handleTriviaAnswer = (answer: string) => {
    setTriviaAnswer(answer);
    if (answer === triviaQuestions[triviaIndex].correct) setTriviaScore((s) => s + 1);
    setTimeout(() => {
      setTriviaAnswer(null);
      if (triviaIndex < triviaQuestions.length - 1) setTriviaIndex((i) => i + 1);
    }, 1000);
  };

  const startGame = (action: GameType) => {
    setActiveGame(action);
    if (action === "emoji-match") initEmojiMatch();
    if (action === "spin") { setSpinResult(null); setSpinning(false); }
    if (action === "word-scramble") { setScrambleIndex(0); setScrambleInput(""); setScrambleResult(null); }
    if (action === "trivia") { setTriviaIndex(0); setTriviaAnswer(null); setTriviaScore(0); }
  };

  const randomGame = () => {
    setSpinningGame(true);
    let count = 0;
    const interval = setInterval(() => {
      const random = gameList[Math.floor(Math.random() * gameList.length)];
      setActiveGame(random.action);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setSpinningGame(false);
        const final = gameList[Math.floor(Math.random() * gameList.length)];
        startGame(final.action);
      }
    }, 150);
  };

  // Breathing exercise logic
  const startBreathing = (patternIdx: number) => {
    setActiveBreath(patternIdx);
    setBreathRound(0);
    setBreathActive(true);
    runBreathCycle(patternIdx, 0);
  };

  const runBreathCycle = (patternIdx: number, round: number) => {
    const p = breathPatterns[patternIdx];
    if (round >= p.rounds) {
      setBreathPhase("Done! 🎉");
      setBreathActive(false);
      return;
    }
    setBreathRound(round + 1);

    setBreathPhase("Breathe in…");
    breathTimer.current = setTimeout(() => {
      if (p.hold > 0) {
        setBreathPhase("Hold…");
        breathTimer.current = setTimeout(() => {
          setBreathPhase("Breathe out…");
          breathTimer.current = setTimeout(() => {
            if (p.holdOut > 0) {
              setBreathPhase("Hold…");
              breathTimer.current = setTimeout(() => {
                runBreathCycle(patternIdx, round + 1);
              }, p.holdOut * 1000);
            } else {
              runBreathCycle(patternIdx, round + 1);
            }
          }, p.exhale * 1000);
        }, p.hold * 1000);
      } else {
        setBreathPhase("Breathe out…");
        breathTimer.current = setTimeout(() => {
          runBreathCycle(patternIdx, round + 1);
        }, p.exhale * 1000);
      }
    }, p.inhale * 1000);
  };

  const stopBreathing = () => {
    if (breathTimer.current) clearTimeout(breathTimer.current);
    setActiveBreath(null);
    setBreathActive(false);
    setBreathPhase("Ready");
  };

  useEffect(() => {
    return () => { if (breathTimer.current) clearTimeout(breathTimer.current); };
  }, []);

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-5 pt-8 pb-24 max-w-md mx-auto gap-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="text-2xl font-heading leading-snug">How are you today?</h1>
      </motion.div>

      {/* Mood Tracker - card style */}
      <div className="w-full">
        <MoodTracker />
      </div>

      {/* Talk CTA with prompts */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/talk")}
          className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-5 flex items-center gap-4 text-left shadow-lg shadow-primary/15"
        >
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Phone size={20} />
          </div>
          <div>
            <p className="font-heading text-base">Talk it out</p>
            <p className="text-xs opacity-80">Voice call with your companion</p>
          </div>
        </motion.button>
        {/* Quick prompts */}
        <div className="flex gap-2 overflow-x-auto mt-2 pb-1 scrollbar-hide">
          {conversationPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => navigate("/talk")}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Breathing Exercises - Collapsible */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full">
        <button
          onClick={() => setBreathingOpen(!breathingOpen)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <Wind size={18} className="text-primary" />
            <div className="text-left">
              <p className="font-heading text-sm">Breathing Exercises</p>
              <p className="text-[10px] text-muted-foreground">Calm your nerves</p>
            </div>
          </div>
          {breathingOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {breathingOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                {activeBreath === null ? (
                  breathPatterns.map((p, i) => (
                    <motion.button
                      key={p.name}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => startBreathing(i)}
                      className="w-full flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 text-left hover:bg-muted transition-colors"
                    >
                      <span className="text-lg">🫁</span>
                      <div>
                        <p className="text-sm font-heading">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.inhale}s in · {p.hold > 0 ? `${p.hold}s hold · ` : ""}{p.exhale}s out · {p.rounds} rounds
                        </p>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="bg-card border border-border rounded-xl p-6 text-center">
                    <p className="text-xs text-muted-foreground mb-2">{breathPatterns[activeBreath].name}</p>
                    <motion.div
                      animate={{
                        scale: breathPhase === "Breathe in…" ? 1.3 : breathPhase === "Hold…" ? 1.3 : 1,
                      }}
                      transition={{ duration: breathPhase === "Breathe in…" ? breathPatterns[activeBreath].inhale : breathPatterns[activeBreath].exhale, ease: "easeInOut" }}
                      className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4"
                    >
                      <span className="text-xs font-heading text-primary">{breathPhase}</span>
                    </motion.div>
                    {breathActive && (
                      <p className="text-xs text-muted-foreground mb-3">Round {breathRound}/{breathPatterns[activeBreath].rounds}</p>
                    )}
                    <button onClick={stopBreathing} className="text-xs text-muted-foreground underline">
                      {breathActive ? "Stop" : "← Back"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Games - Collapsible */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="w-full">
        <button
          onClick={() => setGamesOpen(!gamesOpen)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <Gamepad2 size={18} className="text-primary" />
            <div className="text-left">
              <p className="font-heading text-sm">Mini Games</p>
              <p className="text-[10px] text-muted-foreground">Take your mind off things</p>
            </div>
          </div>
          {gamesOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {gamesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <AnimatePresence mode="wait">
                  {!activeGame ? (
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Random game button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={randomGame}
                        disabled={spinningGame}
                        className="w-full mb-2 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl py-3 text-sm font-heading text-primary hover:bg-primary/15 transition-colors"
                      >
                        <Shuffle size={14} className={spinningGame ? "animate-spin" : ""} />
                        {spinningGame ? "Picking…" : "Surprise me!"}
                      </motion.button>
                      <div className="grid grid-cols-2 gap-2">
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
                      </div>
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

                      {/* WORD SCRAMBLE */}
                      {activeGame === "word-scramble" && (
                        <div className="text-center">
                          <p className="font-heading text-sm mb-2">🔤 Word Unscramble</p>
                          <p className="text-xs text-muted-foreground mb-4">Unscramble the positive word</p>
                          {scrambleIndex >= wordScrambles.length ? (
                            <div className="py-4">
                              <p className="text-3xl mb-2">🎉</p>
                              <p className="font-heading">All done!</p>
                              <button onClick={() => { setScrambleIndex(0); setScrambleInput(""); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto">
                                <RotateCcw size={12} /> Play again
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-center gap-2 mb-4">
                                {wordScrambles[scrambleIndex].scrambled.split("").map((letter, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ rotateY: 180 }}
                                    animate={{ rotateY: 0 }}
                                    className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-heading text-lg"
                                  >
                                    {letter}
                                  </motion.span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 justify-center">
                                <input
                                  value={scrambleInput}
                                  onChange={(e) => setScrambleInput(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleScrambleCheck()}
                                  placeholder="Your answer"
                                  className="w-32 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-primary"
                                />
                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleScrambleCheck} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                                  Check
                                </motion.button>
                              </div>
                              {scrambleResult && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm mt-2 ${scrambleResult === "correct" ? "text-emerald-500" : "text-destructive"}`}>
                                  {scrambleResult === "correct" ? "Correct! ✨" : `It was: ${wordScrambles[scrambleIndex].answer}`}
                                </motion.p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-3">{scrambleIndex + 1} / {wordScrambles.length}</p>
                            </>
                          )}
                        </div>
                      )}

                      {/* TRIVIA */}
                      {activeGame === "trivia" && (
                        <div className="text-center">
                          <p className="font-heading text-sm mb-2">❓ Feel-Good Trivia</p>
                          {triviaIndex >= triviaQuestions.length - 1 && triviaAnswer !== null ? (
                            <div className="py-4">
                              <p className="text-3xl mb-2">🏆</p>
                              <p className="font-heading text-base">Score: {triviaScore}/{triviaQuestions.length}</p>
                              <button onClick={() => { setTriviaIndex(0); setTriviaScore(0); setTriviaAnswer(null); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto">
                                <RotateCcw size={12} /> Play again
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm mb-4 font-medium">{triviaQuestions[triviaIndex].q}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {triviaQuestions[triviaIndex].options.map((opt) => (
                                  <motion.button
                                    key={opt}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => !triviaAnswer && handleTriviaAnswer(opt)}
                                    className={`py-3 px-2 rounded-xl border text-sm transition-all ${
                                      triviaAnswer === opt
                                        ? opt === triviaQuestions[triviaIndex].correct
                                          ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                                          : "bg-red-100 border-red-400 text-red-800"
                                        : "border-border bg-muted/30 hover:bg-muted/60"
                                    }`}
                                  >
                                    {opt}
                                  </motion.button>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-3">{triviaIndex + 1} / {triviaQuestions.length}</p>
                            </>
                          )}
                        </div>
                      )}

                      <button onClick={() => setActiveGame(null)} className="text-xs text-muted-foreground underline mt-4 block mx-auto">
                        ← Back to games
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
