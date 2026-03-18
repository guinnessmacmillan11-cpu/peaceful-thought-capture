import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import pandaIdle from "@/assets/panda-idle.png";

export default function Auth() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto sign in anonymously
    const signInAnonymously = async () => {
      try {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("Anonymous sign-in error:", error);
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };
    signInAnonymously();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <motion.img
          src={pandaIdle}
          alt="Bao"
          className="w-28 h-28 mx-auto mb-6"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <h1 className="text-3xl font-heading mb-2">Meet Bao 🎋</h1>
        <p className="text-sm text-muted-foreground mb-6">Setting things up for you...</p>
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </motion.div>
    </div>
  );
}
