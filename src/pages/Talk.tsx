import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Send, MessageSquare, ArrowLeft } from "lucide-react";
import { addEntry, type JournalEntry } from "@/lib/journal-store";
import { streamChat, type Msg } from "@/lib/stream-chat";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

const voiceMap: Record<string, string> = {
  River: "SAz9YHcvj6GT2YYXdXww",
  Lily: "pFZP5JQG7iQjIQuC4Bku",
  Charlie: "IKne3meq5aSn9XLyUdCD",
  Alice: "Xb7hH8MSUJpSbSDYk0k2",
};

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

async function speakWithElevenLabs(text: string, voiceName?: string): Promise<void> {
  try {
    const voiceId = voiceMap[voiceName || "River"] || voiceMap.River;
    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ text, voiceId }),
    });
    if (!response.ok) return browserSpeak(text);
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    return new Promise((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.play().catch(() => resolve());
    });
  } catch { return browserSpeak(text); }
}

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export default function TalkPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inCall, setInCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<"voice" | "text" | null>(null);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callTimerRef = useRef<ReturnType<typeof setInterval>>();
  const autoListenRef = useRef(false);
  const promptHandled = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useProfile();
  const { user } = useAuth();

  const voiceName = (profile as any)?.voice_preference || "River";

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "text" && !mode) {
      setMode("text");
      setMessages([{ role: "assistant", content: `Hey${profile?.name ? ` ${profile.name.split(" ")[0]}` : ""}! What's on your mind? 💭` }]);
    }
  }, [searchParams]);

  useEffect(() => {
    if (inCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else { clearInterval(callTimerRef.current); }
    return () => clearInterval(callTimerRef.current);
  }, [inCall]);

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && !promptHandled.current && !inCall && !mode) {
      promptHandled.current = true;
      startCallWithPrompt(prompt);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try { await speakWithElevenLabs(text, voiceName); }
    finally { setIsSpeaking(false); }
  }, [voiceName]);

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
          if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
          return [...prev, { role: "assistant", content: assistantText }];
        });
      };
      try {
        await streamChat({
          messages: newMessages,
          userName: profile?.name,
          userAge: profile?.age ?? undefined,
          userId: user?.id,
          onDelta: (chunk) => { setIsThinking(false); upsertAssistant(chunk); },
          onDone: async () => {
            setIsThinking(false);
            if (assistantText && mode === "voice") {
              await speak(assistantText);
              if (autoListenRef.current && !muted) startListening();
            }
          },
          onError: (err) => { setIsThinking(false); toast.error(err); },
        });
      } catch { setIsThinking(false); toast.error("Connection lost. Try again."); }
    },
    [speak, muted, profile, user, mode]
  );

  const sendMessage = useCallback(async (text: string) => { await sendMessageDirect(text, messages); }, [messages, sendMessageDirect]);

  const sendTextMessage = () => {
    if (!textInput.trim()) return;
    sendMessage(textInput.trim());
    setTextInput("");
  };

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
    setMode("voice");
    setInCall(true);
    autoListenRef.current = true;
    const greeting = `Hey${profile?.name ? ` ${profile.name.split(" ")[0]}` : ""}! What's on your mind?`;
    setMessages([{ role: "assistant", content: greeting }]);
    speak(greeting).then(() => startListening());
  }, [speak, startListening, profile]);

  const startCallWithPrompt = useCallback((prompt: string) => {
    setMode("voice");
    setInCall(true);
    autoListenRef.current = true;
    const greetingMsg: Msg = { role: "assistant", content: "Hey, I'm here. Let's talk about that." };
    setMessages([greetingMsg]);
    speak(greetingMsg.content).then(() => sendMessageDirect(prompt, [greetingMsg]));
  }, [speak, sendMessageDirect]);

  const endSession = useCallback(() => {
    setInCall(false);
    setMode(null);
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
      if (!m) { recognitionRef.current?.stop(); setIsListening(false); }
      return !m;
    });
  }, []);

  // Mode selection
  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center w-full max-w-sm">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="text-2xl font-heading mb-2">Talk to Bao 🎋</motion.h1>
          <p className="text-muted-foreground text-sm mb-8">Choose how you'd like to connect</p>
          
          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={startCall}
              className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-5 flex items-center gap-4 text-left shadow-lg shadow-primary/15">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Phone size={22} />
              </motion.div>
              <div>
                <p className="font-heading text-lg">Voice Call</p>
                <p className="text-xs opacity-80">Talk like calling a friend</p>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setMode("text");
                setMessages([{ role: "assistant", content: `Hey${profile?.name ? ` ${profile.name.split(" ")[0]}` : ""}! What's on your mind? 💭` }]);
              }}
              className="w-full bg-card border border-border rounded-2xl px-5 py-5 flex items-center gap-4 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare size={22} className="text-primary" />
              </div>
              <div>
                <p className="font-heading text-lg">Text Chat</p>
                <p className="text-xs text-muted-foreground">Type your thoughts out</p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Text chat mode
  if (mode === "text") {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-lg">
          <button onClick={endSession} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="font-heading text-sm">Bao</p>
            <p className="text-[10px] text-muted-foreground">{isThinking ? "typing..." : "online"}</p>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {isThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              autoFocus
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={sendTextMessage}
              disabled={!textInput.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity">
              <Send size={16} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Voice call mode (existing)
  if (!inCall) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
          <h1 className="text-2xl font-heading mb-2">Talk to Bao 🎋</h1>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Your chill buddy is ready to listen.
          </p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={startCall}
            className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 mx-auto">
            <Phone size={24} />
          </motion.button>
          <p className="text-xs text-muted-foreground mt-3">Tap to call</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-4rem)] px-6 py-8 bg-background">
      <div className="text-center">
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : isThinking ? "Thinking..." : "Connected"}
        </motion.p>
        <p className="text-sm text-muted-foreground/60 mt-1">{formatDuration(callDuration)}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
            animate={{
              scale: isSpeaking ? [1, 1.3, 1] : isListening ? [1, 1.15, 1] : [1, 1.05, 1],
              opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
            }}
            transition={{ duration: isSpeaking ? 0.5 : 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/30 to-primary/10"
            animate={{ scale: isSpeaking ? [1, 1.2, 1] : [1, 1.08, 1] }}
            transition={{ duration: isSpeaking ? 0.6 : 2.5, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: isSpeaking ? [1, 1.1, 1] : [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone size={24} className="text-primary" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {messages.length > 0 && (
            <motion.div
              key={messages[messages.length - 1].content.slice(0, 20)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mt-6 bg-card border border-border rounded-2xl px-4 py-3 max-w-xs shadow-sm">
              <p className="text-xs text-muted-foreground/60 mb-1 font-medium">
                {messages[messages.length - 1].role === "assistant" ? "Bao" : "You"}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {messages[messages.length - 1].content.slice(0, 150)}{messages[messages.length - 1].content.length > 150 ? "..." : ""}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-muted text-muted-foreground" : "bg-card border border-border text-foreground"}`}>
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={endSession}
          className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg">
          <PhoneOff size={22} />
        </motion.button>
      </div>
    </div>
  );
}
