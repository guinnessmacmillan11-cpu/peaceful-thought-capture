import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("profiles")
      .select("current_streak, longest_streak")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setStreak((data as any).current_streak || 0);
          setLongestStreak((data as any).longest_streak || 0);
        }
        setLoading(false);
      });
  }, [user]);

  return { streak, longestStreak, loading, refetch: () => {
    if (!user) return;
    supabase.from("profiles")
      .select("current_streak, longest_streak")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setStreak((data as any).current_streak || 0);
          setLongestStreak((data as any).longest_streak || 0);
        }
      });
  }};
}
