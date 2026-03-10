import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type_1_name, type_1_pct, type_2_name, type_2_pct, type_3_name, type_3_pct, wing, dominant_subtype } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Baseado no perfil de Eneagrama abaixo, gere EXATAMENTE em JSON (sem markdown):
{
  "habilidades_naturais": ["lista de 5-7 habilidades/pontos fortes que essa pessoa naturalmente possui"],
  "habilidades_desenvolver": ["lista de 5-7 habilidades/áreas que essa pessoa precisa desenvolver"]
}

Perfil:
- Tipo principal: ${type_1_name} (${type_1_pct}%)
${type_2_name ? `- Segundo tipo: ${type_2_name} (${type_2_pct}%)` : ""}
${type_3_name ? `- Terceiro tipo: ${type_3_name} (${type_3_pct}%)` : ""}
${wing ? `- Asa: ${wing}` : ""}
${dominant_subtype ? `- Subtipo: ${dominant_subtype}` : ""}

As habilidades devem ser específicas, práticas e relacionadas ao perfil. Cada item deve ter no máximo 8 palavras. Responda APENAS com o JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em Eneagrama. Responda apenas com JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar habilidades" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let skills;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      skills = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse skills JSON:", content);
      skills = null;
    }

    return new Response(JSON.stringify(skills || {
      habilidades_naturais: ["Não foi possível gerar"],
      habilidades_desenvolver: ["Não foi possível gerar"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("skills error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
