import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userName, userAge, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const age = userAge || 20;
    const name = userName || "friend";

    // Fetch recent conversation history for memory
    let memoryContext = "";
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: recentEntries } = await supabase
          .from("journal_entries")
          .select("summary, mood, created_at, messages")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentEntries && recentEntries.length > 0) {
          const summaries = recentEntries.map((e: any) => {
            const date = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const msgs = Array.isArray(e.messages) ? e.messages : [];
            const userMsgs = msgs.filter((m: any) => m.role === "user").map((m: any) => m.content).join("; ");
            return `[${date}] Mood: ${e.mood}. They said: "${userMsgs.slice(0, 200)}"`;
          });
          memoryContext = `\n\nPREVIOUS CONVERSATIONS (use these to reference past topics naturally, like "last time you mentioned..."): \n${summaries.join("\n")}`;
        }
      } catch (e) {
        console.error("Memory fetch error:", e);
      }
    }

    let toneGuide = "";
    if (age <= 10) {
      toneGuide = `The user is a young kid (age ~${age}) named ${name}. Use simple words, be super friendly and fun. Use emojis sometimes. Keep responses to 2-3 short sentences. Be like a cool older sibling. Avoid complex topics.`;
    } else if (age <= 15) {
      toneGuide = `The user is a teen (age ~${age}) named ${name}. Be chill and relatable. Use casual language they'd use with friends. Keep responses to 2-4 sentences. Be real, not preachy. Reference things teens deal with.`;
    } else if (age <= 18) {
      toneGuide = `The user is ${name}, age ~${age}. Be like a trusted friend. Keep it real and conversational. 2-4 sentences max. Don't lecture. Validate their feelings and offer perspective naturally.`;
    } else {
      toneGuide = `The user is ${name}, age ~${age}. Be a warm, genuine friend. Keep responses to 2-4 sentences — conversational, not paragraph-heavy. Be specific to what they said. Offer real perspective.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are Bao, a chill panda companion — like the most supportive best friend. ${toneGuide} IMPORTANT: Keep responses SHORT — 2 to 4 sentences only. Make every word count. Be specific to what they said. Validate feelings. Offer a fresh thought or ask a follow-up question to keep things flowing. Never be generic. Never diagnose or give medical advice. Sound like a real person texting a friend, not an AI writing an essay. If you have context from previous conversations, naturally reference them (like "hey, last time you mentioned..." or "how's that thing with...") but don't force it.${memoryContext}`,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests, please slow down." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
