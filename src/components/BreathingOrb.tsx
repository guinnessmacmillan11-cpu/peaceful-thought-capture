import { motion } from "framer-motion";

interface BreathingOrbProps {
  size?: number;
  className?: string;
}

export default function BreathingOrb({ size = 120, className = "" }: BreathingOrbProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer pulse rings */}
      <div
        className="absolute rounded-full bg-primary/10 animate-pulse-ring"
        style={{ width: size * 1.4, height: size * 1.4 }}
      />
      <div
        className="absolute rounded-full bg-primary/5 animate-pulse-ring"
        style={{ width: size * 1.6, height: size * 1.6, animationDelay: "1s" }}
      />
      {/* Main orb */}
      <motion.div
        className="rounded-full bg-gradient-to-br from-primary/40 to-primary/20 backdrop-blur-sm animate-breathe"
        style={{ width: size, height: size }}
      />
      {/* Inner glow */}
      <div
        className="absolute rounded-full bg-primary/30 animate-breathe"
        style={{ width: size * 0.5, height: size * 0.5, animationDelay: "0.5s" }}
      />
    </div>
  );
}
