import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { addEntry, type JournalEntry } from "@/lib/journal-store";
import { streamChat, type Msg } from "@/lib/stream-chat";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

import pandaIdle from "@/assets/panda-idle.png";
import pandaTalking from "@/assets/panda-talking.png";
import pandaListening from "@/assets/panda-listening.png";
import pandaThinking from "@/assets/panda-thinking.png";

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

function getPandaImage(state: "idle" | "speaking" | "listening" | "thinking") {
  switch (state) {
    case "speaking": return pandaTalking;
    case "listening": return pandaListening;
    case "thinking": return pandaThinking;
    default: return pandaIdle;
  }
}

async function speakWithElevenLabs(text: string, voiceName?: string): Promise<void> {
  try {
    const voiceId = voiceMap[voiceName || "River"] || voiceMap.River;
    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok) {
      console.warn("ElevenLabs TTS failed, falling back to browser TTS");
      return browserSpeak(text);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.play().catch(() => resolve());
    });
  } catch {
    return browserSpeak(text);
  }
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
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callTimerRef = useRef<ReturnType<typeof setInterval>>();
  const autoListenRef = useRef(false);
  const promptHandled = useRef(false);
  const { profile } = useProfile();
  const { user } = useAuth();

  const voiceName = (profile as any)?.voice_preference || "River";
  const pandaState = isListening ? "listening" : isSpeaking ? "speaking" : isThinking ? "thinking" : "idle";

  useEffect(() => {
    if (inCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [inCall]);

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

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      await speakWithElevenLabs(text, voiceName);
    } finally {
      setIsSpeaking(false);
    }
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
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
          }
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
            if (assistantText) {
              await speak(assistantText);
              if (autoListenRef.current && !muted) startListening();
            }
          },
          onError: (err) => { setIsThinking(false); toast.error(err); },
        });
      } catch {
        setIsThinking(false);
        toast.error("Connection lost. Try again.");
      }
    },
    [speak, muted, profile, user]
  );

  const sendMessage = useCallback(
    async (text: string) => { await sendMessageDirect(text, messages); },
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
    const greeting = `Hey${profile?.name ? ` ${profile.name.split(" ")[0]}` : ""}! What's on your mind?`;
    setMessages([{ role: "assistant", content: greeting }]);
    speak(greeting).then(() => startListening());
  }, [speak, startListening, profile]);

  const startCallWithPrompt = useCallback((prompt: string) => {
    setInCall(true);
    autoListenRef.current = true;
    const greetingMsg: Msg = { role: "assistant", content: "Hey, I'm here. Let's talk about that." };
    setMessages([greetingMsg]);
    speak(greetingMsg.content).then(() => sendMessageDirect(prompt, [greetingMsg]));
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
      if (!m) { recognitionRef.current?.stop(); setIsListening(false); }
      return !m;
    });
  }, []);

  if (!inCall) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
          <motion.div className="relative mx-auto mb-6" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
            <img src={pandaIdle} alt="Panda companion" className="w-36 h-36 relative z-10 mx-auto" />
          </motion.div>
          <h1 className="text-2xl font-heading mb-2">Talk to Bao 🎋</h1>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Your chill panda buddy is ready to listen. Just talk, like calling a friend.
          </p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={startCall}
            className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 mx-auto">
            <Phone size={24} />
          </motion.button>
          <p className="text-xs text-muted-foreground mt-3">Tap to call Bao</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-4rem)] px-6 py-8 bg-background">
      <div className="text-center">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {isListening ? "Bao is listening..." : isSpeaking ? "Bao is talking..." : isThinking ? "Bao is thinking..." : "Connected with Bao"}
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">{formatDuration(callDuration)}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: isSpeaking ? [1, 1.4, 1] : isListening ? [1, 1.2, 1] : [1, 1.1, 1] }}
            transition={{ duration: isSpeaking ? 0.6 : 2, repeat: Infinity }}
            style={{ width: 200, height: 200, top: -20, left: -20 }}
          />
          <AnimatePresence mode="wait">
            <motion.img
              key={pandaState}
              src={getPandaImage(pandaState)}
              alt={`Bao is ${pandaState}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: isSpeaking ? [0, -6, 0] : [0, -4, 0] }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { duration: 0.3 }, opacity: { duration: 0.3 },
                y: { duration: isSpeaking ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="w-40 h-40 relative z-10"
            />
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {messages.length > 0 && (
            <motion.div
              key={messages[messages.length - 1].content.slice(0, 20)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mt-4 bg-card border border-border rounded-2xl px-4 py-3 max-w-xs shadow-sm"
            >
              <p className="text-xs text-muted-foreground/60 mb-1 font-medium">
                {messages[messages.length - 1].role === "assistant" ? "🐼 Bao" : "You"}
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
          className={`w-14 h-14 rounded-full flex items-center justify-center ${muted ? "bg-muted text-muted-foreground" : "bg-card border border-border text-foreground"}`}>
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={endCall}
          className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg">
          <PhoneOff size={22} />
        </motion.button>
      </div>
    </div>
  );
}
