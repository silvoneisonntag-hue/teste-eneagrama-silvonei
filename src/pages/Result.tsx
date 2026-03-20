import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Share2, MessageCircle, ThumbsUp, ThumbsDown, Star,
  Brain, Shield, Heart, Zap, Layers, Sparkles, Eye, RotateCcw, TrendingUp, Feather,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────
interface EnneagramResult {
  id: string;
  type_1_name: string;
  type_1_pct: number;
  type_2_name: string | null;
  type_2_pct: number | null;
  type_3_name: string | null;
  type_3_pct: number | null;
  dominant_subtype: string | null;
  wing: string | null;
  tritype: string | null;
  health_level: number | null;
  dominant_center: string | null;
  subtype_preservation: number | null;
  subtype_social: number | null;
  subtype_sexual: number | null;
  summary: string | null;
  created_at: string;
}

// ─── Charts ─────────────────────────────────────────────────
const CHART_COLORS = [
  "hsl(349, 26%, 61%)",
  "hsl(264, 7%, 43%)",
  "hsl(36, 30%, 70%)",
];

const ResultCharts = ({ result }: { result: EnneagramResult }) => {
  const typeData = [
    { name: result.type_1_name, value: result.type_1_pct },
    ...(result.type_2_name ? [{ name: result.type_2_name, value: result.type_2_pct! }] : []),
    ...(result.type_3_name ? [{ name: result.type_3_name, value: result.type_3_pct! }] : []),
  ];
  const subtypeData = [
    { name: "Preservação", value: result.subtype_preservation ?? 33 },
    { name: "Social", value: result.subtype_social ?? 33 },
    { name: "Sexual", value: result.subtype_sexual ?? 34 },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 mt-8">
      <div>
        <h4 className="font-heading text-base font-semibold text-foreground mb-4 text-center">Distribuição de Padrões</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" label={({ value }) => `${value}%`} strokeWidth={2} stroke="hsl(36, 23%, 95%)">
              {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {typeData.map((d, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
              {d.name}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-heading text-base font-semibold text-foreground mb-4 text-center">Expressão Instintiva</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={subtypeData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(264, 5%, 55%)", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: "hsl(0, 0%, 18%)", fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Bar dataKey="value" fill="hsl(349, 26%, 61%)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {result.dominant_subtype && (
          <p className="text-center text-xs text-muted-foreground font-body mt-2">
            Instinto dominante: <span className="text-accent font-semibold">{result.dominant_subtype}</span>
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Sections Parser ────────────────────────────────────────
const SECTION_CONFIG = [
  { key: "padrao-psicologico", title: "Padrão Psicológico Central", icon: Brain, accent: true },
  { key: "mecanismo-interno", title: "Mecanismo Interno e Estratégias", icon: Shield },
  { key: "origem-emocional", title: "Origem Emocional e Adaptação Primária", icon: Heart },
  { key: "expressao-instintiva", title: "Expressão Instintiva e Foco de Energia", icon: Zap },
  { key: "integracao-subtipo", title: "Integração do Subtipo e Dinâmica Única", icon: Layers },
  { key: "forcas-recursos", title: "Forças e Recursos", icon: Sparkles },
  { key: "pontos-cegos", title: "Pontos Cegos e Desafios", icon: Eye },
  { key: "ciclos-repetitivos", title: "Ciclos Repetitivos e Padrões Sistêmicos", icon: RotateCcw },
  { key: "caminho-crescimento", title: "Caminho de Crescimento e Evolução", icon: TrendingUp },
  { key: "reflexao-final", title: "Reflexão Final", icon: Feather, accent: true },
];

const HEADING_PATTERNS = [
  /padr[ãa]o\s+psicol[óo]gico\s+central/i,
  /mecanismo\s+interno/i,
  /origem\s+emocional/i,
  /express[ãa]o\s+instintiva/i,
  /integra[çc][ãa]o\s+do\s+subtipo/i,
  /for[çc]as\s+e\s+recursos/i,
  /pontos\s+cegos/i,
  /ciclos\s+repetitivos/i,
  /caminho\s+de\s+crescimento/i,
  /reflex[ãa]o\s+final/i,
];

function parseSections(summary: string): { title: string; content: string }[] {
  const lines = summary.split("\n");
  const sections: { title: string; content: string }[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/^#+\s*/, "").replace(/\*+/g, "").trim();
    const matchIndex = HEADING_PATTERNS.findIndex(p => p.test(cleanLine));
    if (matchIndex !== -1) {
      if (currentTitle && currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = SECTION_CONFIG[matchIndex].title;
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }
  if (currentTitle && currentContent.length > 0) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }
  return sections;
}

const ResultSections = ({ summary }: { summary: string | null }) => {
  if (!summary) return null;
  const parsed = parseSections(summary);

  if (parsed.length === 0) {
    const cleaned = summary
      .replace(/\*\*Tipo mais provável.*?\n/gi, "")
      .replace(/\*\*Segundo tipo.*?\n/gi, "")
      .replace(/\*\*Terceira possibilidade.*?\n/gi, "")
      .replace(/Subtipo instintivo:[\s\S]*?(?=\n\n|\n#|\n\*\*[A-Z])/i, "")
      .replace(/Asa:\s*Asa\s*\d+\s*\n?/i, "")
      .trim();
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card/60 rounded-2xl border border-border/40 p-7 mb-8">
        <h3 className="font-heading text-xl font-semibold text-foreground mb-4">Análise Profunda</h3>
        <div className="prose prose-sm max-w-none font-body leading-relaxed text-foreground/85 [&_p]:my-2 [&_strong]:text-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-heading [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2">
          <ReactMarkdown>{cleaned}</ReactMarkdown>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 mb-10">
      {parsed.map((section, i) => {
        const config = SECTION_CONFIG.find(c => c.title === section.title) || SECTION_CONFIG[0];
        const Icon = config.icon;
        const isAccent = config.accent;
        return (
          <motion.div key={config.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className={`rounded-2xl border p-7 ${isAccent ? "bg-accent/5 border-accent/20" : "bg-card/60 border-border/40"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAccent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">{section.title}</h3>
              </div>
            </div>
            <div className="prose prose-sm max-w-none font-body leading-relaxed text-foreground/80 [&_p]:my-2 [&_strong]:text-foreground [&_li]:my-1">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Feedback ───────────────────────────────────────────────
const ResultFeedback = ({ resultId, userId, feedbackSent, onFeedbackSent }: {
  resultId: string; userId: string; feedbackSent: boolean; onFeedbackSent: () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [agrees, setAgrees] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const [suggestedType, setSuggestedType] = useState("");

  const sendFeedback = async () => {
    if (rating === 0) { toast.error("Por favor, dê uma nota de 1 a 5"); return; }
    const { error } = await supabase.from("enneagram_feedback").insert({
      user_id: userId, result_id: resultId, accuracy_rating: rating,
      agrees_with_type: agrees, comments: comments || null,
      suggested_type: agrees === false ? suggestedType || null : null,
    });
    if (error) toast.error("Erro ao enviar feedback");
    else { toast.success("Obrigado pelo feedback!"); onFeedbackSent(); }
  };

  if (feedbackSent) {
    return (
      <div className="bg-card/60 rounded-2xl border border-border/40 p-7 text-center">
        <p className="text-accent font-body font-semibold">✓ Feedback enviado! Obrigado.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="bg-card rounded-2xl border border-border/50 p-7 shadow-[var(--shadow-card)]">
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Como foi essa experiência?</h3>

      <div className="mb-5">
        <p className="text-sm text-muted-foreground font-body mb-2">Precisão da análise (1 a 5):</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${rating >= n ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
              <Star className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-sm text-muted-foreground font-body mb-2">Você se reconheceu na análise?</p>
        <div className="flex gap-3">
          <Button variant={agrees === true ? "hero" : "outline"} size="sm" onClick={() => setAgrees(true)} className="rounded-xl gap-2 font-body">
            <ThumbsUp className="w-4 h-4" /> Sim
          </Button>
          <Button variant={agrees === false ? "destructive" : "outline"} size="sm" onClick={() => setAgrees(false)} className="rounded-xl gap-2 font-body">
            <ThumbsDown className="w-4 h-4" /> Não
          </Button>
        </div>
      </div>

      {agrees === false && (
        <div className="mb-5">
          <label className="text-sm text-muted-foreground font-body block mb-1">Qual tipo você acredita ser?</label>
          <input value={suggestedType} onChange={(e) => setSuggestedType(e.target.value)} placeholder="Ex: Tipo 4"
            className="w-full rounded-xl border border-input bg-background px-4 py-2 font-body text-sm text-foreground" />
        </div>
      )}

      <div className="mb-5">
        <label className="text-sm text-muted-foreground font-body block mb-1">Comentários (opcional)</label>
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Conte o que achou da experiência..."
          className="w-full rounded-xl border border-input bg-background px-4 py-2 font-body text-sm text-foreground resize-none" />
      </div>

      <Button variant="hero" onClick={sendFeedback} className="rounded-xl font-body">Enviar Feedback</Button>
    </motion.div>
  );
};

// ─── Main Page ──────────────────────────────────────────────
const Result = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [result, setResult] = useState<EnneagramResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("enneagram_results")
        .select("id, type_1_name, type_1_pct, type_2_name, type_2_pct, type_3_name, type_3_pct, dominant_subtype, wing, tritype, health_level, dominant_center, subtype_preservation, subtype_social, subtype_sexual, summary, created_at")
        .eq("id", id).eq("user_id", user.id).maybeSingle();
      if (error || !data) toast.error("Resultado não encontrado");
      else setResult(data);

      const { data: fb } = await supabase.from("enneagram_feedback").select("id").eq("result_id", id).eq("user_id", user.id).maybeSingle();
      if (fb) setFeedbackSent(true);
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `Descobri padrões profundos sobre mim mesmo no Mapa Interior! Faça sua jornada também: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`, "_blank");
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="flex items-center gap-4 mb-10">
          <Link to="/"><Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Sua Análise</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="text-accent font-body font-medium text-sm tracking-[0.25em] uppercase mb-4">✦ Mapa Interior</p>
          <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground leading-snug max-w-xl mx-auto italic">
            "Existe um padrão muito claro na forma como você se organiza por dentro."
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border/50 p-8 shadow-[var(--shadow-card)] mb-10">
          <div className="text-center mb-2">
            <p className="text-muted-foreground font-body text-sm mb-1">Padrão principal identificado</p>
            <h3 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-1">{result.type_1_name}</h3>
            <p className="text-accent font-heading text-xl font-semibold">{result.type_1_pct}%</p>
          </div>
          <ResultCharts result={result} />
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {result.wing && (
              <div className="bg-secondary/60 rounded-xl p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-1">Asa</p>
                <p className="text-foreground font-heading font-semibold text-sm">{result.wing}</p>
              </div>
            )}
            {result.tritype && (
              <div className="bg-secondary/60 rounded-xl p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-1">Tritipo</p>
                <p className="text-foreground font-heading font-semibold text-sm">{result.tritype}</p>
              </div>
            )}
            {result.health_level && (
              <div className="bg-secondary/60 rounded-xl p-4 text-center">
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-1">Nível de Saúde</p>
                <p className="text-foreground font-heading font-semibold text-sm">{result.health_level}/9</p>
              </div>
            )}
          </div>
        </motion.div>

        <ResultSections summary={result.summary} />

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card/60 rounded-2xl border border-border/40 p-7 mb-8">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent" /> Compartilhar
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="rounded-xl font-body border-accent/30 text-accent hover:bg-accent/10 gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareLinkedIn} className="rounded-xl font-body border-accent/30 text-accent hover:bg-accent/10 gap-2">
              LinkedIn
            </Button>
          </div>
        </motion.div>

        <ResultFeedback resultId={id!} userId={user!.id} feedbackSent={feedbackSent} onFeedbackSent={() => setFeedbackSent(true)} />
      </div>
    </div>
  );
};

export default Result;