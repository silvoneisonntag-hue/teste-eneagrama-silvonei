import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      type_1_name, type_1_pct, type_2_name, type_2_pct, type_3_name, type_3_pct,
      wing, dominant_subtype, dominant_center, tritype, health_level,
      integration_direction, disintegration_direction,
      subtype_preservation, subtype_social, subtype_sexual,
      level, // "basico" | "intermediario" | "completo"
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // For basic level, only generate skills
    if (level === "basico") {
      return new Response(JSON.stringify({ sections: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileInfo = `
Perfil do participante:
- Tipo principal: ${type_1_name} (${type_1_pct}%)
${type_2_name ? `- Segundo tipo: ${type_2_name} (${type_2_pct}%)` : ""}
${type_3_name ? `- Terceiro tipo: ${type_3_name} (${type_3_pct}%)` : ""}
${wing ? `- Asa: ${wing}` : ""}
${dominant_subtype ? `- Subtipo dominante: ${dominant_subtype}` : ""}
${dominant_center ? `- Centro dominante: ${dominant_center}` : ""}
${tritype ? `- Tritipo: ${tritype}` : ""}
${health_level ? `- Nível de saúde: ${health_level}/9` : ""}
${integration_direction ? `- Direção de integração: ${integration_direction}` : ""}
${disintegration_direction ? `- Direção de desintegração: ${disintegration_direction}` : ""}
${subtype_preservation != null ? `- Autopreservação: ${subtype_preservation}%` : ""}
${subtype_social != null ? `- Social: ${subtype_social}%` : ""}
${subtype_sexual != null ? `- Sexual: ${subtype_sexual}%` : ""}`.trim();

    const sectionsToGenerate = level === "completo" 
      ? [
          "perfil_dominante",
          "caracteristicas",
          "motivacoes_medos",
          "comportamentos",
          "equipe_conflitos",
          "influencia_asas",
          "influencia_secundario",
          "integracao",
          "estresse",
          "nivel_saude",
          "habilidades_naturais",
          "habilidades_desenvolver",
          "reflexao",
          "dicas_relacionamento",
          "desenvolvimento",
        ]
      : [
          "perfil_dominante",
          "caracteristicas",
          "habilidades_naturais",
          "habilidades_desenvolver",
          "nivel_saude",
        ];

    const prompt = `Você é um especialista em Eneagrama com profundo conhecimento dos 9 tipos, asas, subtipos, níveis de saúde e dinâmicas de integração/desintegração.

${profileInfo}

Gere um relatório completo e personalizado em formato JSON com as seguintes seções. Cada seção de texto deve ter 2-3 parágrafos detalhados (150-250 palavras cada). Use linguagem acolhedora e pessoal (você/sua).

Retorne APENAS um JSON válido (sem markdown) com esta estrutura:
{
${sectionsToGenerate.includes("perfil_dominante") ? `  "perfil_dominante": "Texto descrevendo o perfil dominante, motivações centrais, como se manifesta no dia a dia, incluindo exemplos práticos",` : ""}
${sectionsToGenerate.includes("caracteristicas") ? `  "caracteristicas": "Texto sobre características principais, fortalezas, como a asa influencia o perfil, desafios e dicas práticas",` : ""}
${sectionsToGenerate.includes("motivacoes_medos") ? `  "motivacoes_medos": "Texto sobre motivação central profunda, medo mais profundo, como isso se manifesta e dicas para equilibrar",` : ""}
${sectionsToGenerate.includes("comportamentos") ? `  "comportamentos": "Texto sobre padrões de comportamento, como age em diferentes contextos, influência das asas nos comportamentos",` : ""}
${sectionsToGenerate.includes("equipe_conflitos") ? `  "equipe_conflitos": "Texto sobre como age em equipe, pontos fortes na colaboração, como lida com conflitos e dicas de crescimento",` : ""}
${sectionsToGenerate.includes("influencia_asas") ? `  "influencia_asas": "Texto detalhado sobre como cada asa influencia o perfil dominante, com exemplos práticos e ações sugeridas",` : ""}
${sectionsToGenerate.includes("influencia_secundario") ? `  "influencia_secundario": "Texto sobre como o perfil secundário influencia o dominante, exemplos e ações práticas para equilíbrio",` : ""}
${sectionsToGenerate.includes("integracao") ? `  "integracao": "Texto sobre a direção de integração, como se manifesta em cada nível, ações práticas para avançar",` : ""}
${sectionsToGenerate.includes("estresse") ? `  "estresse": "Texto sobre a direção de estresse, como se manifesta, sinais de alerta e estratégias para lidar",` : ""}
${sectionsToGenerate.includes("nivel_saude") ? `  "nivel_saude": "Texto sobre o nível de saúde atual, como se manifesta, ações para evoluir e o que esperar em outros níveis",` : ""}
${sectionsToGenerate.includes("habilidades_naturais") ? `  "habilidades_naturais": ["lista de 6-8 habilidades naturais, cada uma com no máximo 10 palavras"],` : ""}
${sectionsToGenerate.includes("habilidades_desenvolver") ? `  "habilidades_desenvolver": ["lista de 6-8 áreas para desenvolver, cada uma com no máximo 10 palavras"],` : ""}
${sectionsToGenerate.includes("reflexao") ? `  "reflexao": ["lista de 5-6 perguntas reflexivas personalizadas para este tipo"],` : ""}
${sectionsToGenerate.includes("dicas_relacionamento") ? `  "dicas_relacionamento": [{"tipo": "Tipo 1 - O Perfeccionista", "dica": "texto da dica"}, {"tipo": "Tipo 2 - O Prestativo", "dica": "..."}, {"tipo": "Tipo 3 - O Bem-Sucedido", "dica": "..."}, {"tipo": "Tipo 4 - O Individualista", "dica": "..."}, {"tipo": "Tipo 5 - O Observador", "dica": "..."}, {"tipo": "Tipo 6 - O Leal", "dica": "..."}, {"tipo": "Tipo 7 - O Entusiasta", "dica": "..."}, {"tipo": "Tipo 8 - O Desafiador", "dica": "..."}, {"tipo": "Tipo 9 - O Pacificador", "dica": "..."}],` : ""}
${sectionsToGenerate.includes("desenvolvimento") ? `  "desenvolvimento": ["lista de 4-5 sugestões práticas de desenvolvimento pessoal, incluindo práticas diárias, leituras e ferramentas"]` : ""}
}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional, sem blocos de código markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em Eneagrama. Responda apenas com JSON válido, sem markdown, sem blocos de código." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar o relatório." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao gerar relatório" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let sections;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      sections = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error("Failed to parse report JSON:", content.slice(0, 500));
      sections = null;
    }

    return new Response(JSON.stringify({ sections: sections || {} }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
