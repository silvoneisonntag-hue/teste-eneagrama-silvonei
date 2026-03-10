import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Share2, MessageCircle, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ReactMarkdown from "react-markdown";

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

const CHART_COLORS = [
  "hsl(43, 80%, 55%)",
  "hsl(265, 40%, 45%)",
  "hsl(200, 60%, 50%)",
];

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [result, setResult] = useState<EnneagramResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [rating, setRating] = useState(0);
  const [agrees, setAgrees] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const [suggestedType, setSuggestedType] = useState("");

  useEffect(() => {
    if (!id || !user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("enneagram_results")
        .select("id, type_1_name, type_1_pct, type_2_name, type_2_pct, type_3_name, type_3_pct, dominant_subtype, wing, tritype, health_level, dominant_center, subtype_preservation, subtype_social, subtype_sexual, summary, created_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) toast.error("Resultado não encontrado");
      else setResult(data);

      // Check if feedback already sent
      const { data: fb } = await supabase
        .from("enneagram_feedback")
        .select("id")
        .eq("result_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (fb) setFeedbackSent(true);

      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const sendFeedback = async () => {
    if (!user || !id || rating === 0) {
      toast.error("Por favor, dê uma nota de 1 a 5");
      return;
    }
    const { error } = await supabase.from("enneagram_feedback").insert({
      user_id: user.id,
      result_id: id,
      accuracy_rating: rating,
      agrees_with_type: agrees,
      comments: comments || null,
      suggested_type: agrees === false ? suggestedType || null : null,
    });
    if (error) toast.error("Erro ao enviar feedback");
    else {
      toast.success("Obrigado pelo feedback!");
      setFeedbackSent(true);
    }
  };

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `Meu resultado no teste de Eneagrama: ${result.type_1_name} (${result.type_1_pct}%)! Descubra seu tipo também: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareLinkedIn = () => {
    const url = window.location.origin;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  };

  const copyLink = () => {
    if (!result) return;
    const text = `Meu resultado no teste de Eneagrama: ${result.type_1_name} (${result.type_1_pct}%)! Descubra seu tipo: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado!");
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/history">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">Seu Resultado</h1>
        </div>

        {/* Main Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 shadow-[var(--shadow-card)] mb-8"
        >
          <div className="text-center mb-6">
            <p className="text-primary font-body font-semibold text-sm tracking-[0.3em] uppercase mb-2">
              ✦ Tipo Principal
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-1">
              {result.type_1_name}
            </h2>
            <p className="text-primary font-heading text-2xl font-semibold">{result.type_1_pct}%</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Type Distribution Chart */}
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 text-center">
                Distribuição de Tipos
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${value}%`}
                  >
                    {typeData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {typeData.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Subtype Chart */}
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 text-center">
                Subtipos Instintivos
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subtypeData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(260,15%,55%)", fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: "hsl(45,60%,90%)", fontSize: 13 }} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="value" fill="hsl(43, 80%, 55%)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {result.dominant_subtype && (
                <p className="text-center text-sm text-muted-foreground font-body mt-2">
                  Subtipo dominante: <span className="text-primary font-semibold">{result.dominant_subtype}</span>
                </p>
              )}
            </div>
          </div>

          {/* Extra info */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {result.wing && (
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Asa</p>
                <p className="text-foreground font-heading font-semibold">{result.wing}</p>
              </div>
            )}
            {result.tritype && (
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Tritipo</p>
                <p className="text-foreground font-heading font-semibold">{result.tritype}</p>
              </div>
            )}
            {result.health_level && (
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Nível de Saúde</p>
                <p className="text-foreground font-heading font-semibold">{result.health_level}/9</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Summary */}
        {result.summary && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/60 rounded-2xl border border-border/40 p-7 mb-8"
          >
            <h3 className="font-heading text-xl font-semibold text-foreground mb-4">Análise Detalhada</h3>
            <div className="prose prose-sm prose-stone max-w-none font-body [&_p]:my-1 [&_strong]:text-foreground">
              <ReactMarkdown>{result.summary}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Share */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/60 rounded-2xl border border-border/40 p-7 mb-8"
        >
          <h3 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartilhar Resultado
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="rounded-xl font-body border-primary/30 text-primary hover:bg-primary/10 gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareLinkedIn} className="rounded-xl font-body border-primary/30 text-primary hover:bg-primary/10 gap-2">
              LinkedIn
            </Button>
          </div>
        </motion.div>

        {/* Feedback */}
        {!feedbackSent ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/80 rounded-2xl border border-border/50 p-7 shadow-[var(--shadow-card)]"
          >
            <h3 className="font-heading text-xl font-semibold text-foreground mb-4">
              O que achou do resultado?
            </h3>

            {/* Rating */}
            <div className="mb-5">
              <p className="text-sm text-muted-foreground font-body mb-2">Precisão (1 a 5):</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      rating >= n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Star className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Agree? */}
            <div className="mb-5">
              <p className="text-sm text-muted-foreground font-body mb-2">Você concorda com o tipo identificado?</p>
              <div className="flex gap-3">
                <Button
                  variant={agrees === true ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setAgrees(true)}
                  className="rounded-xl gap-2 font-body"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Sim
                </Button>
                <Button
                  variant={agrees === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setAgrees(false)}
                  className="rounded-xl gap-2 font-body"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Não
                </Button>
              </div>
            </div>

            {agrees === false && (
              <div className="mb-5">
                <label className="text-sm text-muted-foreground font-body block mb-1">Qual tipo você acredita ser?</label>
                <input
                  value={suggestedType}
                  onChange={(e) => setSuggestedType(e.target.value)}
                  placeholder="Ex: Tipo 4"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2 font-body text-sm text-foreground"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="text-sm text-muted-foreground font-body block mb-1">Comentários (opcional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Conte o que achou..."
                className="w-full rounded-xl border border-input bg-background px-4 py-2 font-body text-sm text-foreground resize-none"
              />
            </div>

            <Button variant="hero" onClick={sendFeedback} className="rounded-xl font-body">
              Enviar Feedback
            </Button>
          </motion.div>
        ) : (
          <div className="bg-card/60 rounded-2xl border border-border/40 p-7 text-center">
            <p className="text-primary font-body font-semibold">✓ Feedback enviado! Obrigado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
