import { motion, AnimatePresence } from "framer-motion";
import { Wind, Gamepad2, Trophy, RotateCcw, Shuffle, ChevronRight, Heart, Palette, Music } from "lucide-react";
import PandaBreathing from "@/components/PandaBreathing";
import { useState, useCallback } from "react";
import pandaIdle from "@/assets/panda-idle.png";

const emojiPairs = ["😊", "🌟", "🦋", "🌈", "🎵", "💫"];
const wordScrambles = [
  { scrambled: "CEPAE", answer: "PEACE" }, { scrambled: "MLAC", answer: "CALM" },
  { scrambled: "PEHO", answer: "HOPE" }, { scrambled: "VLEO", answer: "LOVE" }, { scrambled: "MILSE", answer: "SMILE" },
  { scrambled: "YOJF", answer: "JOY" }, { scrambled: "TRUS", answer: "TRUST" },
];
const spinChallenges = [
  "Text someone you love 💬", "Dance to your fave song 💃", "Say 3 nice things about yourself 🪞",
  "Take a silly selfie 🤳", "Hum a happy tune 🎶", "Stretch for 30 seconds 🧘",
  "Smile at yourself in the mirror 😁", "Write down a dream goal ✨",
  "Give someone a compliment 🌟", "Draw something happy 🎨", "Take 5 deep breaths 🌬️",
];
const triviaQuestions = [
  { q: "Laughing for 15 min burns how many cal?", options: ["10", "40", "100", "5"], correct: "40" },
  { q: "What hormone do hugs release?", options: ["Cortisol", "Oxytocin", "Adrenaline", "Melatonin"], correct: "Oxytocin" },
  { q: "How many muscles to smile?", options: ["17", "43", "6", "26"], correct: "17" },
  { q: "Most calming color?", options: ["Red", "Blue", "Yellow", "Green"], correct: "Blue" },
  { q: "Best time for creativity?", options: ["Morning", "Night", "When tired", "Afternoon"], correct: "When tired" },
  { q: "Walking in nature reduces stress by?", options: ["10%", "25%", "50%", "70%"], correct: "50%" },
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

const complimentGenerator = [
  "You light up every room 🌟", "Your smile is contagious 😊", "You're stronger than you know 💪",
  "The world is better with you in it 🌎", "You're a work of art 🎨", "Your kindness matters 💚",
  "You inspire people around you ✨", "Your energy is magnetic 🧲",
];

type GameType = "emoji-match" | "spin" | "word-scramble" | "trivia" | "color-match" | "gratitude-bingo" | "compliment" | "doodle-prompt" | null;
type ActivitySection = "breathing" | "games" | "self-care" | null;

const gameList: { title: string; desc: string; emoji: string; action: GameType }[] = [
  { title: "Emoji Match", desc: "Test your memory", emoji: "🧠", action: "emoji-match" },
  { title: "Color Match", desc: "What color is it?", emoji: "🎨", action: "color-match" },
  { title: "Gratitude Bingo", desc: "Check off good things", emoji: "🎯", action: "gratitude-bingo" },
  { title: "Positivity Spin", desc: "Get a fun challenge", emoji: "🎰", action: "spin" },
  { title: "Word Unscramble", desc: "Find the word", emoji: "🔤", action: "word-scramble" },
  { title: "Feel-Good Trivia", desc: "Learn fun facts", emoji: "❓", action: "trivia" },
  { title: "Compliment Me", desc: "Get a boost", emoji: "💝", action: "compliment" },
  { title: "Doodle Prompt", desc: "Draw something", emoji: "✏️", action: "doodle-prompt" },
];

const doodlePrompts = [
  "Draw your happy place 🏠", "Sketch your mood as a weather ☁️", "Draw Bao doing something fun 🐼",
  "Design your dream vacation 🏖️", "Draw what peace looks like 🕊️", "Sketch your favorite food 🍕",
];

export default function ActivitiesPage() {
  const [activeSection, setActiveSection] = useState<ActivitySection>(null);
  const [activeGame, setActiveGame] = useState<GameType>(null);
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
  const [complimentIndex, setComplimentIndex] = useState(0);
  const [doodleIndex, setDoodleIndex] = useState(0);

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
    if (action === "compliment") setComplimentIndex(Math.floor(Math.random() * complimentGenerator.length));
    if (action === "doodle-prompt") setDoodleIndex(Math.floor(Math.random() * doodlePrompts.length));
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
    <div className="min-h-[80vh] px-5 pt-6 pb-24 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
        <motion.img src={pandaIdle} alt="Bao" className="w-10 h-10" animate={{ rotate: [0, -3, 3, 0] }} transition={{ duration: 3, repeat: Infinity }} />
        <div>
          <h1 className="text-xl font-heading">Activities</h1>
          <p className="text-xs text-muted-foreground">Recharge & have fun 🎮</p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {/* Breathing */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button onClick={() => setActiveSection(activeSection === "breathing" ? null : "breathing")}
            className="w-full flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/20 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Wind size={20} className="text-primary" />
              </motion.div>
              <div className="text-left">
                <p className="font-heading text-sm">Breathing</p>
                <p className="text-[10px] text-muted-foreground">Calm your mind</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === "breathing" ? "rotate-90" : ""}`} />
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
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button onClick={() => { setActiveSection(activeSection === "games" ? null : "games"); setActiveGame(null); }}
            className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Gamepad2 size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-heading text-sm">Mini Games</p>
                <p className="text-[10px] text-muted-foreground">Fun stress relief</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === "games" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {activeSection === "games" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3">
                  <AnimatePresence mode="wait">
                    {!activeGame ? (
                      <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={randomGame} disabled={spinningGame}
                          className="w-full mb-3 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl py-3 text-sm font-heading text-primary hover:bg-primary/15 transition-colors">
                          <Shuffle size={14} className={spinningGame ? "animate-spin" : ""} />
                          {spinningGame ? "Picking…" : "Surprise me!"}
                        </motion.button>
                        <div className="grid grid-cols-2 gap-2">
                          {gameList.map((g, i) => (
                            <motion.button key={g.action} whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                              onClick={() => startGame(g.action)}
                              className="bg-card border border-border rounded-xl p-3 text-left hover:bg-muted/50 transition-all hover:scale-[1.02]">
                              <span className="text-xl block mb-1">{g.emoji}</span>
                              <p className="text-xs font-heading leading-tight">{g.title}</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">{g.desc}</p>
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
                                <p className="text-xs text-muted-foreground">{matchMoves} moves</p>
                                <button onClick={initEmojiMatch} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Again</button>
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
                            <p className="text-[10px] text-muted-foreground mb-4">What COLOR is the text?</p>
                            {colorRound >= colorMaxRounds ? (
                              <div className="py-4">
                                <p className="text-3xl mb-2">🏆</p>
                                <p className="font-heading text-base">Score: {colorScore}/{colorMaxRounds}</p>
                                <button onClick={initColorMatch} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Again</button>
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
                                <p className="text-[10px] text-muted-foreground mt-3">{colorRound + 1}/{colorMaxRounds}</p>
                              </>
                            )}
                          </div>
                        )}
                        {activeGame === "gratitude-bingo" && (
                          <div className="text-center">
                            <p className="font-heading text-sm mb-1">🎯 Gratitude Bingo</p>
                            <p className="text-[10px] text-muted-foreground mb-3">Tap what you did today!</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {gratitudeTiles.map((tile, i) => (
                                <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => toggleBingo(i)}
                                  className={`aspect-square rounded-lg text-[9px] leading-tight font-medium flex items-center justify-center p-1 transition-all ${bingoChecked.has(i) ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted"}`}>
                                  {tile}
                                </motion.button>
                              ))}
                            </div>
                            {bingoChecked.size >= 12 && (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-3">
                                <p className="font-heading text-base">Bingo! 🎉</p>
                              </motion.div>
                            )}
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
                                <button onClick={() => { setScrambleIndex(0); setScrambleInput(""); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Again</button>
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
                                <button onClick={() => { setTriviaIndex(0); setTriviaScore(0); setTriviaAnswer(null); }} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Again</button>
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
                        {activeGame === "compliment" && (
                          <div className="text-center py-4">
                            <p className="font-heading text-sm mb-4">💝 Compliment Generator</p>
                            <motion.div key={complimentIndex} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-2xl p-6 mb-4">
                              <p className="text-lg font-heading">{complimentGenerator[complimentIndex]}</p>
                            </motion.div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setComplimentIndex((i) => (i + 1) % complimentGenerator.length)}
                              className="text-xs text-primary flex items-center gap-1 mx-auto">
                              <Heart size={12} /> Another one
                            </motion.button>
                          </div>
                        )}
                        {activeGame === "doodle-prompt" && (
                          <div className="text-center py-4">
                            <p className="font-heading text-sm mb-4">✏️ Doodle Prompt</p>
                            <motion.div key={doodleIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl p-6 mb-4">
                              <p className="text-lg font-heading">{doodlePrompts[doodleIndex]}</p>
                              <p className="text-xs text-muted-foreground mt-2">Grab paper and draw! 🎨</p>
                            </motion.div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDoodleIndex((i) => (i + 1) % doodlePrompts.length)}
                              className="text-xs text-primary flex items-center gap-1 mx-auto">
                              <Palette size={12} /> New prompt
                            </motion.button>
                          </div>
                        )}
                        <button onClick={() => setActiveGame(null)} className="text-xs text-muted-foreground underline mt-4 block mx-auto">← Back</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Self-Care Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button onClick={() => setActiveSection(activeSection === "self-care" ? null : "self-care")}
            className="w-full flex items-center justify-between bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border border-pink-200 dark:border-pink-800 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Heart size={20} className="text-pink-500" />
              </div>
              <div className="text-left">
                <p className="font-heading text-sm">Self-Care</p>
                <p className="text-[10px] text-muted-foreground">Quick wellness boosts</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === "self-care" ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {activeSection === "self-care" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3 space-y-2">
                  {[
                    { emoji: "🧊", title: "Ice Cube Exercise", desc: "Hold ice, focus on the sensation to ground yourself" },
                    { emoji: "🌈", title: "5-4-3-2-1 Grounding", desc: "5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste" },
                    { emoji: "🫧", title: "Bubble Breathing", desc: "Imagine blowing bubbles as you exhale slowly" },
                    { emoji: "🧸", title: "Comfort Corner", desc: "Find your softest blanket and cozy up for 5 minutes" },
                    { emoji: "🎵", title: "Mood Music", desc: "Put on a song that makes you feel something good" },
                  ].map((item, i) => (
                    <motion.div key={item.title}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3">
                      <span className="text-xl">{item.emoji}</span>
                      <div>
                        <p className="text-xs font-heading">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
