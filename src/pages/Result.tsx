import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Share2, MessageCircle, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { toast } from "sonner";
import ResultCharts from "@/components/result/ResultCharts";
import ResultSections from "@/components/result/ResultSections";
import ResultFeedback from "@/components/result/ResultFeedback";

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
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) toast.error("Resultado não encontrado");
      else setResult(data);

      const { data: fb } = await supabase
        .from("enneagram_feedback")
        .select("id")
        .eq("result_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Sua Análise</h1>
        </div>

        {/* Opening quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-accent font-body font-medium text-sm tracking-[0.25em] uppercase mb-4">
            ✦ Mapa Interior
          </p>
          <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground leading-snug max-w-xl mx-auto italic">
            "Existe um padrão muito claro na forma como você se organiza por dentro."
          </h2>
        </motion.div>

        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border/50 p-8 shadow-[var(--shadow-card)] mb-10"
        >
          <div className="text-center mb-2">
            <p className="text-muted-foreground font-body text-sm mb-1">Padrão principal identificado</p>
            <h3 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-1">
              {result.type_1_name}
            </h3>
            <p className="text-accent font-heading text-xl font-semibold">{result.type_1_pct}%</p>
          </div>

          {/* Charts */}
          <ResultCharts result={result} />

          {/* Meta cards */}
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

        {/* 10 Analysis Sections */}
        <ResultSections summary={result.summary} />

        {/* Share */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/60 rounded-2xl border border-border/40 p-7 mb-8"
        >
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent" />
            Compartilhar
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="rounded-xl font-body border-accent/30 text-accent hover:bg-accent/10 gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareLinkedIn} className="rounded-xl font-body border-accent/30 text-accent hover:bg-accent/10 gap-2">
              LinkedIn
            </Button>
          </div>
        </motion.div>

        {/* Feedback */}
        <ResultFeedback
          resultId={id!}
          userId={user!.id}
          feedbackSent={feedbackSent}
          onFeedbackSent={() => setFeedbackSent(true)}
        />
      </div>
    </div>
  );
};

export default Result;
