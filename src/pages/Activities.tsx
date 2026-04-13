import { motion, AnimatePresence } from "framer-motion";
import { Wind, Gamepad2, Trophy, RotateCcw, Shuffle, ChevronRight } from "lucide-react";
import PandaBreathing from "@/components/PandaBreathing";
import { useState, useCallback } from "react";

const emojiPairs = ["😊", "🌟", "🦋", "🌈", "🎵", "💫"];
const wordScrambles = [
  { scrambled: "CEPAE", answer: "PEACE" }, { scrambled: "MLAC", answer: "CALM" },
  { scrambled: "PEHO", answer: "HOPE" }, { scrambled: "VLEO", answer: "LOVE" }, { scrambled: "MILSE", answer: "SMILE" },
];
const spinChallenges = [
  "Text someone you love 💬", "Dance to your fave song 💃", "Say 3 nice things about yourself 🪞",
  "Take a silly selfie 🤳", "Hum a happy tune 🎶", "Stretch for 30 seconds 🧘",
  "Smile at yourself in the mirror 😁", "Write down a dream goal ✨",
];
const triviaQuestions = [
  { q: "Laughing for 15 minutes burns how many calories?", options: ["10", "40", "100", "5"], correct: "40" },
  { q: "What hormone is released when you hug someone?", options: ["Cortisol", "Oxytocin", "Adrenaline", "Melatonin"], correct: "Oxytocin" },
  { q: "How many muscles does it take to smile?", options: ["17", "43", "6", "26"], correct: "17" },
  { q: "Which color is most calming?", options: ["Red", "Blue", "Yellow", "Green"], correct: "Blue" },
];
const colorMatchColors = [
  { name: "Red", hex: "bg-red-400", textColor: "text-red-900" },
  { name: "Blue", hex: "bg-blue-400", textColor: "text-blue-900" },
  { name: "Green", hex: "bg-emerald-400", textColor: "text-emerald-900" },
  { name: "Yellow", hex: "bg-yellow-400", textColor: "text-yellow-900" },
  { name: "Purple", hex: "bg-purple-400", textColor: "text-purple-900" },
  { name: "Orange", hex: "bg-orange-400", textColor: "text-orange-900" },
];
const gratitudeTiles = [
  "Smiled today", "Drank water", "Helped someone", "Said thanks",
  "Took a walk", "Deep breath", "Laughed", "Ate well",
  "Rested", "FREE ✨", "Listened", "Stretched",
  "Journaled", "Complimented", "Forgave", "Dreamed big",
];

type GameType = "emoji-match" | "spin" | "word-scramble" | "trivia" | "color-match" | "gratitude-bingo" | null;
type ActivitySection = "breathing" | "games" | null;

const gameList: { title: string; desc: string; emoji: string; action: GameType }[] = [
  { title: "Emoji Match", desc: "Test your memory", emoji: "🧠", action: "emoji-match" },
  { title: "Color Match", desc: "Match the color name", emoji: "🎨", action: "color-match" },
  { title: "Gratitude Bingo", desc: "Check off good things", emoji: "🎯", action: "gratitude-bingo" },
  { title: "Positivity Spin", desc: "Get a fun challenge", emoji: "🎰", action: "spin" },
  { title: "Word Unscramble", desc: "Find the positive word", emoji: "🔤", action: "word-scramble" },
  { title: "Feel-Good Trivia", desc: "Learn fun facts", emoji: "❓", action: "trivia" },
];

export default function ActivitiesPage() {
  const [activeSection, setActiveSection] = useState<ActivitySection>(null);
  const [activeGame, setActiveGame] = useState<GameType>(null);

  // Game states
  const [matchCards, setMatchCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [matchMoves, setMatchMoves] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [scrambleInput, setScrambleInput] = useState("");
  const [scrambleResult, setScrambleResult] = useState<"correct" | "wrong" | null>(null);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaAnswer, setTriviaAnswer] = useState<string | null>(null);
  const [triviaScore, setTriviaScore] = useState(0);
  const [colorTarget, setColorTarget] = useState<{ name: string; displayColor: string }>({ name: "", displayColor: "" });
  const [colorOptions, setColorOptions] = useState<typeof colorMatchColors>([]);
  const [colorScore, setColorScore] = useState(0);
  const [colorRound, setColorRound] = useState(0);
  const [colorFeedback, setColorFeedback] = useState<string | null>(null);
  const colorMaxRounds = 8;
  const [bingoChecked, setBingoChecked] = useState<Set<number>>(new Set([9]));
  const [spinningGame, setSpinningGame] = useState(false);

  const initEmojiMatch = useCallback(() => {
    const shuffled = [...emojiPairs, ...emojiPairs].sort(() => Math.random() - 0.5);
    setMatchCards(shuffled); setFlipped([]); setMatched([]); setMatchMoves(0);
  }, []);

  const generateColorRound = () => {
    const target = colorMatchColors[Math.floor(Math.random() * colorMatchColors.length)];
    const otherColors = colorMatchColors.filter((c) => c.name !== target.name);
    const trickColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    setColorTarget({ name: target.name, displayColor: trickColor.hex });
    const shuffled = [...colorMatchColors].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!shuffled.find((c) => c.name === target.name)) shuffled[Math.floor(Math.random() * shuffled.length)] = target;
    setColorOptions(shuffled.sort(() => Math.random() - 0.5));
  };

  const initColorMatch = useCallback(() => {
    setColorScore(0); setColorRound(0); setColorFeedback(null); generateColorRound();
  }, []);

  const handleColorAnswer = (name: string) => {
    if (colorFeedback) return;
    const correct = name === colorTarget.name;
    if (correct) setColorScore((s) => s + 1);
    setColorFeedback(correct ? "✅ Correct!" : `❌ It was ${colorTarget.name}`);
    setTimeout(() => {
      setColorFeedback(null);
      if (colorRound + 1 < colorMaxRounds) { setColorRound((r) => r + 1); generateColorRound(); }
      else setColorRound(colorMaxRounds);
    }, 1000);
  };

  const handleCardFlip = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMatchMoves((m) => m + 1);
      if (matchCards[newFlipped[0]] === matchCards[newFlipped[1]]) { setMatched((prev) => [...prev, ...newFlipped]); setFlipped([]); }
      else setTimeout(() => setFlipped([]), 600);
    }
  };

  const handleSpin = () => {
    setSpinning(true); setSpinResult(null);
    setTimeout(() => { setSpinResult(spinChallenges[Math.floor(Math.random() * spinChallenges.length)]); setSpinning(false); }, 1500);
  };

  const handleScrambleCheck = () => {
    const current = wordScrambles[scrambleIndex];
    setScrambleResult(scrambleInput.toUpperCase().trim() === current.answer ? "correct" : "wrong");
    setTimeout(() => { setScrambleResult(null); setScrambleInput(""); if (scrambleIndex < wordScrambles.length - 1) setScrambleIndex((i) => i + 1); }, 1200);
  };

  const handleTriviaAnswer = (answer: string) => {
    setTriviaAnswer(answer);
    if (answer === triviaQuestions[triviaIndex].correct) setTriviaScore((s) => s + 1);
    setTimeout(() => { setTriviaAnswer(null); if (triviaIndex < triviaQuestions.length - 1) setTriviaIndex((i) => i + 1); }, 1000);
  };

  const toggleBingo = (i: number) => {
    if (i === 9) return;
    setBingoChecked((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  };

  const startGame = (action: GameType) => {
    setActiveGame(action);
    setActiveSection("games");
    if (action === "emoji-match") initEmojiMatch();
    if (action === "spin") { setSpinResult(null); setSpinning(false); }
    if (action === "word-scramble") { setScrambleIndex(0); setScrambleInput(""); setScrambleResult(null); }
    if (action === "trivia") { setTriviaIndex(0); setTriviaAnswer(null); setTriviaScore(0); }
    if (action === "color-match") initColorMatch();
    if (action === "gratitude-bingo") setBingoChecked(new Set([9]));
  };

  const randomGame = () => {
    setSpinningGame(true);
    let count = 0;
    const interval = setInterval(() => {
      setActiveGame(gameList[Math.floor(Math.random() * gameList.length)].action);
      count++;
      if (count > 8) { clearInterval(interval); setSpinningGame(false); startGame(gameList[Math.floor(Math.random() * gameList.length)].action); }
    }, 150);
  };

  return (
    <div className="min-h-[80vh] px-5 pt-8 pb-24 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading mb-1">Activities</h1>
        <p className="text-sm text-muted-foreground mb-6">Take a break & recharge</p>
      </motion.div>

      {/* Activity Cards */}
      <div className="space-y-3">
        {/* Breathing */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button onClick={() => setActiveSection(activeSection === "breathing" ? null : "breathing")}
            className="w-full flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl px-5 py-5">
            <div className="flex items-center gap-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                <Wind size={22} className="text-primary" />
              </motion.div>
              <div className="text-left">
                <p className="font-heading text-base">Breathing Exercises</p>
                <p className="text-xs text-muted-foreground">Calm your mind & body</p>
              </div>
            </div>
            <ChevronRight size={18} className={`text-muted-foreground transition-transform ${activeSection === "breathing" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {activeSection === "breathing" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3"><PandaBreathing /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Games */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button onClick={() => { setActiveSection(activeSection === "games" ? null : "games"); setActiveGame(null); }}
            className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Gamepad2 size={22} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-heading text-base">Mini Games</p>
                <p className="text-xs text-muted-foreground">Take your mind off things</p>
              </div>
            </div>
            <ChevronRight size={18} className={`text-muted-foreground transition-transform ${activeSection === "games" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {activeSection === "games" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3">
                  <AnimatePresence mode="wait">
                    {!activeGame ? (
                      <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={randomGame} disabled={spinningGame}
                          className="w-full mb-3 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl py-3.5 text-sm font-heading text-primary hover:bg-primary/15 transition-colors">
                          <Shuffle size={14} className={spinningGame ? "animate-spin" : ""} />
                          {spinningGame ? "Picking…" : "Surprise me!"}
                        </motion.button>
                        <div className="grid grid-cols-2 gap-2">
                          {gameList.map((g, i) => (
                            <motion.button key={g.action} whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                              onClick={() => startGame(g.action)}
                              className="bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-all hover:scale-[1.02]">
                              <span className="text-2xl block mb-2">{g.emoji}</span>
                              <p className="text-sm font-heading leading-tight">{g.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{g.desc}</p>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="game" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-xl p-5">
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
                                <button onClick={initEmojiMatch} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Play again</button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-1.5">
                                {matchCards.map((emoji, i) => {
                                  const isVisible = flipped.includes(i) || matched.includes(i);
                                  return (
                                    <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => handleCardFlip(i)}
                                      className={`aspect-square rounded-lg text-lg flex items-center justify-center transition-all ${isVisible ? "bg-primary/10 border border-primary/30" : "bg-muted/60 border border-border"} ${matched.includes(i) ? "opacity-50" : ""}`}>
                                      {isVisible ? emoji : "?"}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        {activeGame === "color-match" && (
                          <div className="text-center">
                            <p className="font-heading text-sm mb-2">🎨 Color Match</p>
                            <p className="text-xs text-muted-foreground mb-4">What COLOR is the text? (Not what it says!)</p>
                            {colorRound >= colorMaxRounds ? (
                              <div className="py-4">
                                <p className="text-3xl mb-2">🏆</p>
                                <p className="font-heading text-base">Score: {colorScore}/{colorMaxRounds}</p>
                                <button onClick={initColorMatch} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Play again</button>
                              </div>
                            ) : (
                              <>
                                <div className={`text-4xl font-heading font-black mb-6 py-4 rounded-xl ${colorTarget.displayColor} bg-clip-text`} style={{ WebkitTextFillColor: "transparent", WebkitBackgroundClip: "text" }}>{colorTarget.name}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {colorOptions.map((c) => (
                                    <motion.button key={c.name} whileTap={{ scale: 0.92 }} onClick={() => handleColorAnswer(c.name)}
                                      className={`py-3 rounded-xl ${c.hex} ${c.textColor} font-bold text-sm`}>{c.name}</motion.button>
                                  ))}
                                </div>
                                {colorFeedback && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm mt-3 font-medium">{colorFeedback}</motion.p>}
                                <p className="text-[10px] text-muted-foreground mt-3">{colorRound + 1} / {colorMaxRounds}</p>
                              </>
                            )}
                          </div>
                        )}
                        {activeGame === "gratitude-bingo" && (
                          <div className="text-center">
                            <p className="font-heading text-sm mb-1">🎯 Gratitude Bingo</p>
                            <p className="text-xs text-muted-foreground mb-3">Tap the things you did today!</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {gratitudeTiles.map((tile, i) => (
                                <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => toggleBingo(i)}
                                  className={`aspect-square rounded-lg text-[10px] leading-tight font-medium flex items-center justify-center p-1 transition-all ${bingoChecked.has(i) ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted"}`}>
                                  {tile}
                                </motion.button>
                              ))}
                            </div>
                            {bingoChecked.size >= 12 && (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-3">
                                <p className="font-heading text-base">Bingo! 🎉</p>
                                <p className="text-xs text-muted-foreground">You've had a great day!</p>
                              </motion.div>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-2">{bingoChecked.size}/16 checked</p>
                          </div>
                        )}
                        {activeGame === "spin" && (
                          <div className="text-center">
                            <p className="font-heading text-sm mb-4">🎰 Positivity Spin</p>
                            {spinResult ? (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <p className="font-heading text-base leading-relaxed mb-4">{spinResult}</p>
                                <button onClick={handleSpin} className="text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Spin again</button>
                              </motion.div>
                            ) : (
                              <motion.button whileTap={{ scale: 0.9 }} onClick={handleSpin} disabled={spinning}
                                animate={spinning ? { rotate: 360 } : {}} transition={spinning ? { duration: 0.5, repeat: Infinity, ease: "linear" } : {}}
                                className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center mx-auto">
                                <span className="text-3xl">{spinning ? "🌀" : "🎰"}</span>
                              </motion.button>
                            )}
                            {!spinResult && !spinning && <p className="text-xs text-muted-foreground mt-3">Tap to spin!</p>}
                          </div>
                        )}
                        {activeGame === "word-scramble" && (
                          <div className="text-center">
                            <p className="font-heading text-sm mb-2">🔤 Word Unscramble</p>
                            {scrambleIndex >= wordScrambles.length ? (
                              <div className="py-4">
                                <p className="text-3xl mb-2">🎉</p>
                                <p className="font-heading">All done!</p>
                                <button onClick={() => { setScrambleIndex(0); setScrambleInput(""); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Play again</button>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-center gap-2 mb-4">
                                  {wordScrambles[scrambleIndex].scrambled.split("").map((letter, i) => (
                                    <motion.span key={i} initial={{ rotateY: 180 }} animate={{ rotateY: 0 }}
                                      className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-heading text-lg">{letter}</motion.span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 justify-center">
                                  <input value={scrambleInput} onChange={(e) => setScrambleInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleScrambleCheck()}
                                    placeholder="Your answer" className="w-32 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-primary" />
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleScrambleCheck} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Check</motion.button>
                                </div>
                                {scrambleResult && (
                                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm mt-2 ${scrambleResult === "correct" ? "text-emerald-500" : "text-destructive"}`}>
                                    {scrambleResult === "correct" ? "Correct! ✨" : `It was: ${wordScrambles[scrambleIndex].answer}`}
                                  </motion.p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {activeGame === "trivia" && (
                          <div className="text-center">
                            <p className="font-heading text-sm mb-2">❓ Feel-Good Trivia</p>
                            {triviaIndex >= triviaQuestions.length - 1 && triviaAnswer !== null ? (
                              <div className="py-4">
                                <p className="text-3xl mb-2">🏆</p>
                                <p className="font-heading text-base">Score: {triviaScore}/{triviaQuestions.length}</p>
                                <button onClick={() => { setTriviaIndex(0); setTriviaScore(0); setTriviaAnswer(null); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Play again</button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm mb-4 font-medium">{triviaQuestions[triviaIndex].q}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {triviaQuestions[triviaIndex].options.map((opt) => (
                                    <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => !triviaAnswer && handleTriviaAnswer(opt)}
                                      className={`py-3 px-2 rounded-xl border text-sm transition-all ${triviaAnswer === opt ? opt === triviaQuestions[triviaIndex].correct ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-red-100 border-red-400 text-red-800" : "border-border bg-muted/30 hover:bg-muted/60"}`}>
                                      {opt}
                                    </motion.button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <button onClick={() => setActiveGame(null)} className="text-xs text-muted-foreground underline mt-4 block mx-auto">← Back to games</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
