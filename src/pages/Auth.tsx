import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Mail } from "lucide-react";
import pandaIdle from "@/assets/panda-idle.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      // Try sign in first, if fails try sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: email.trim() + "_bao_secure_2024",
      });

      if (signInError) {
        // New user - sign up with auto-generated password
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: email.trim() + "_bao_secure_2024",
        });
        if (signUpError) throw signUpError;
        toast.success("Welcome to Bao! 🐼");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.img
            src={pandaIdle}
            alt="Bao"
            className="w-24 h-24 mx-auto mb-4"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="text-3xl font-heading mb-1">Hey there! 🎋</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to get started with Bao
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
            ) : (
              <>
                Get Started <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground mt-6 leading-relaxed">
          We'll remember you by your email — no passwords needed!
        </p>
      </motion.div>
    </div>
  );
}
