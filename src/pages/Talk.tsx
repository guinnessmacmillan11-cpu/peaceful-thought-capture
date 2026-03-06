import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { addEntry, type JournalEntry } from "@/lib/journal-store";
import { streamChat, type Msg } from "@/lib/stream-chat";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

function generateSummary(messages: Msg[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return "A quiet moment of reflection.";
  const topics = userMessages.map((m) => m.content).join(" ");
  if (topics.length < 50) return `Reflected on: "${topics}"`;
  return `Talked through some feelings. Key thoughts: "${topics.slice(0, 120)}..."`;
}

function getMoodFromMessages(messages: Msg[]): string {
  const text = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()).join(" ");
  if (/anxious|worried|stress|nervous|panic/.test(text)) return "anxious";
  if (/sad|down|depress|lonely|cry/.test(text)) return "sad";
  if (/angry|frustrat|annoy|mad/.test(text)) return "frustrated";
  if (/happy|good|great|joy|excit/.test(text)) return "hopeful";
  if (/tired|exhaust|drain|sleep/.test(text)) return "tired";
  return "reflective";
}

export default function TalkPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inCall, setInCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callTimerRef = useRef<ReturnType<typeof setInterval>>();
  const autoListenRef = useRef(false);
  const promptHandled = useRef(false);

  // Call timer
  useEffect(() => {
    if (inCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [inCall]);

  // Auto-start from prompt
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && !promptHandled.current && !inCall) {
      promptHandled.current = true;
      startCallWithPrompt(prompt);
    }
  }, [searchParams]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google UK English Female")
      );
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const sendMessageDirect = useCallback(
    async (text: string, existingMessages: Msg[]) => {
      if (!text.trim()) return;
      const userMsg: Msg = { role: "user", content: text.trim() };
      const newMessages = [...existingMessages, userMsg];
      setMessages(newMessages);
      setIsThinking(true);

      let assistantText = "";
      const upsertAssistant = (chunk: string) => {
        assistantText += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
          }
          return [...prev, { role: "assistant", content: assistantText }];
        });
      };

      try {
        await streamChat({
          messages: newMessages,
          onDelta: (chunk) => {
            setIsThinking(false);
            upsertAssistant(chunk);
          },
          onDone: async () => {
            setIsThinking(false);
            if (assistantText) {
              await speak(assistantText);
              if (autoListenRef.current && !muted) {
                startListening();
              }
            }
          },
          onError: (err) => {
            setIsThinking(false);
            toast.error(err);
          },
        });
      } catch {
        setIsThinking(false);
        toast.error("Connection lost. Try again.");
      }
    },
    [speak, muted]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      await sendMessageDirect(text, messages);
    },
    [messages, sendMessageDirect]
  );

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported. Try Chrome or Edge.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [sendMessage]);

  const startCall = useCallback(() => {
    setInCall(true);
    autoListenRef.current = true;
    const greeting = "Hey, I'm here. What's on your mind?";
    setMessages([{ role: "assistant", content: greeting }]);
    speak(greeting).then(() => {
      startListening();
    });
  }, [speak, startListening]);

  const startCallWithPrompt = useCallback((prompt: string) => {
    setInCall(true);
    autoListenRef.current = true;
    const greetingMsg: Msg = { role: "assistant", content: "Hey, I'm here. Let's talk about that." };
    setMessages([greetingMsg]);
    speak(greetingMsg.content).then(() => {
      sendMessageDirect(prompt, [greetingMsg]);
    });
  }, [speak, sendMessageDirect]);

  const endCall = useCallback(() => {
    setInCall(false);
    autoListenRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);

    if (messages.length > 1) {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        summary: generateSummary(messages),
        mood: getMoodFromMessages(messages),
        messages: [...messages],
      };
      addEntry(entry);
      toast.success("Saved to your journal");
      navigate("/journal");
    }
  }, [messages, navigate]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      return !m;
    });
  }, []);

  // Pre-call screen
  if (!inCall) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-8 w-32 h-32">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-breathe" />
            <div className="absolute inset-4 rounded-full bg-primary/30 animate-breathe" style={{ animationDelay: "0.3s" }} />
            <div className="absolute inset-8 rounded-full bg-primary/40 animate-breathe" style={{ animationDelay: "0.6s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Phone size={28} className="text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-heading mb-2">Call your companion</h1>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Just talk, like calling a friend. I'll listen and respond. Your journal will remember everything.
          </p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startCall}
            className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 mx-auto"
          >
            <Phone size={24} />
          </motion.button>
          <p className="text-xs text-muted-foreground mt-3">Tap to call</p>
        </motion.div>
      </div>
    );
  }

  // In-call screen
  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-4rem)] px-6 py-8 bg-background">
      <div className="text-center">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : isThinking ? "Thinking..." : "Connected"}
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">{formatDuration(callDuration)}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: isSpeaking ? [1, 1.3, 1] : isListening ? [1, 1.15, 1] : [1, 1.05, 1] }}
            transition={{ duration: isSpeaking ? 0.6 : 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-primary/20"
            animate={{ scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : [1, 1.03, 1] }}
            transition={{ duration: isSpeaking ? 0.8 : 2.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="absolute inset-8 rounded-full bg-primary/30"
            animate={{ scale: isSpeaking ? [1, 1.15, 1] : [1, 1.02, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {isThinking && (
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {messages.length > 0 && (
            <motion.p
              key={messages[messages.length - 1].content.slice(0, 20)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 text-sm text-muted-foreground text-center max-w-xs leading-relaxed italic"
            >
              "{messages[messages.length - 1].content.slice(0, 100)}{messages[messages.length - 1].content.length > 100 ? "..." : ""}"
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            muted ? "bg-muted text-muted-foreground" : "bg-card border border-border text-foreground"
          }`}
        >
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
        >
          <PhoneOff size={22} />
        </motion.button>
      </div>
    </div>
  );
}
