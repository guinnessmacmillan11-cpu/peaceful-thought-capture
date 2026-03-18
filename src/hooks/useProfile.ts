import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  name: string;
  age: number | null;
  onboarding_complete: boolean;
  vision_images: string[];
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  voice_preference: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data as unknown as Profile);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    await supabase.from("profiles").update(updates).eq("id", user.id);
    setProfile((p) => p ? { ...p, ...updates } : p);
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
