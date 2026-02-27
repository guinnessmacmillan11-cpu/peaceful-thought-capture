import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, X } from "lucide-react";
import { addEntry, type JournalEntry } from "@/lib/journal-store";
import { useNavigate } from "react-router-dom";

type Message = { role: "user" | "assistant"; content: string };

// Simple calming responses (no backend needed)
const calmResponses = [
  "That sounds really valid. Take a moment to breathe with that feeling.",
  "I hear you. It's okay to feel this way. What do you think is at the root of it?",
  "Thank you for sharing that. Sometimes just saying it out loud helps. What else is on your mind?",
  "That takes courage to express. Remember, this moment will pass. How does it feel to talk about it?",
  "I'm here with you. Let's sit with that for a moment. There's no rush.",
  "It sounds like you're carrying a lot right now. What would feel like a small relief?",
  "You're doing something really brave by being honest with yourself right now.",
  "That's a really thoughtful observation about yourself. Keep going — I'm listening.",
  "Sometimes our feelings just need a safe place to land. This is that place.",
  "What would you tell a friend who felt the same way? Maybe that advice applies to you too.",
];

function getCalmResponse(): string {
  return calmResponses[Math.floor(Math.random() * calmResponses.length)];
}

function generateSummary(messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return "A quiet moment of reflection.";
  const topics = userMessages.map((m) => m.content).join(" ");
  if (topics.length < 50) return `Reflected on: "${topics}"`;
  return `Talked through some feelings. Key thoughts: "${topics.slice(0, 120)}..."`;
}

function getMoodFromMessages(messages: Message[]): string {
  const text = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");
  if (/anxious|worried|stress|nervous|panic/.test(text)) return "anxious";
  if (/sad|down|depress|lonely|cry/.test(text)) return "sad";
  if (/angry|frustrat|annoy|mad/.test(text)) return "frustrated";
  if (/happy|good|great|joy|excit/.test(text)) return "hopeful";
  if (/tired|exhaust|drain|sleep/.test(text)) return "tired";
  return "reflective";
}

export default function TalkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [started, setStarted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    // Try to pick a soft voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google UK English Female")
    );
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = { role: "user", content: text.trim() };
      const assistantMsg: Message = { role: "assistant", content: getCalmResponse() };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      // Speak the response
      setTimeout(() => speak(assistantMsg.content), 300);
    },
    [speak]
  );

  const toggleListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, sendMessage]);

  const saveToJournal = useCallback(() => {
    if (messages.length === 0) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      summary: generateSummary(messages),
      mood: getMoodFromMessages(messages),
      messages: [...messages],
    };
    addEntry(entry);
    setMessages([]);
    setStarted(false);
    navigate("/journal");
  }, [messages, navigate]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-8 w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-breathe" />
            <div className="absolute inset-3 rounded-full bg-primary/30 animate-breathe" style={{ animationDelay: "0.3s" }} />
            <div className="absolute inset-6 rounded-full bg-primary/40 flex items-center justify-center">
              <Mic size={24} className="text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-heading mb-3">Talk it out</h1>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Say whatever's on your mind. I'll listen, and your journal will remember.
          </p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStarted(true)}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium text-sm shadow-lg shadow-primary/20"
          >
            Begin
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-heading text-lg">Talking</h2>
        {messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={saveToJournal}
            className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full font-medium"
          >
            Save to Journal
          </motion.button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-card-foreground border border-border rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-1.5 px-4 py-3 bg-card rounded-2xl border border-border">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`p-3 rounded-full transition-colors ${
              isListening
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Or type here..."
            className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="p-3 rounded-full bg-secondary text-secondary-foreground disabled:opacity-40"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
