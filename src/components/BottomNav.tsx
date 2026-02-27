import { NavLink, useLocation } from "react-router-dom";
import { Home, MessageCircle, BookOpen } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/talk", icon: MessageCircle, label: "Talk" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
