import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface EnneagramResult {
  id: string;
  type_1_name: string;
  type_1_pct: number;
  type_2_name: string | null;
  type_2_pct: number | null;
  type_3_name: string | null;
  type_3_pct: number | null;
  dominant_subtype: string | null;
  summary: string | null;
  created_at: string;
}

const History = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<EnneagramResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from("enneagram_results")
        .select("id, type_1_name, type_1_pct, type_2_name, type_2_pct, type_3_name, type_3_pct, dominant_subtype, summary, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Erro ao carregar histórico");
      } else {
        setResults(data || []);
      }
      setLoading(false);
    };
    fetchResults();
  }, [user]);

  const deleteResult = async (id: string) => {
    const { error } = await supabase.from("enneagram_results").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir resultado");
    } else {
      setResults((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resultado excluído");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">Meu Histórico</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground font-body text-lg mb-4">Nenhum resultado ainda.</p>
            <Link to="/">
              <Button variant="hero" className="rounded-xl">Fazer o teste</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-foreground">
                      {result.type_1_name} ({result.type_1_pct}%)
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-body mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(result.created_at)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteResult(result.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {result.type_2_name && (
                  <p className="text-sm text-muted-foreground font-body mb-1">
                    2º: {result.type_2_name} ({result.type_2_pct}%) · 3º: {result.type_3_name} ({result.type_3_pct}%)
                  </p>
                )}
                {result.dominant_subtype && (
                  <p className="text-sm text-muted-foreground font-body mb-3">
                    Subtipo: {result.dominant_subtype}
                  </p>
                )}

                {result.summary && (
                  <>
                    <button
                      onClick={() => setExpanded(expanded === result.id ? null : result.id)}
                      className="text-sm text-primary hover:underline font-body font-medium"
                    >
                      {expanded === result.id ? "Ocultar detalhes" : "Ver detalhes"}
                    </button>
                    {expanded === result.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 prose prose-sm prose-stone max-w-none font-body [&_p]:my-1"
                      >
                        <ReactMarkdown>{result.summary}</ReactMarkdown>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
