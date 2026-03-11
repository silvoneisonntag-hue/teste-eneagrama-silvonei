import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Shield, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { generateEnneagramPDF, ReportLevel, ReportSections } from "@/lib/generate-pdf";
import AdminStats from "@/components/AdminStats";
import logoSrc from "@/assets/logo.png";

interface ResultWithProfile {
  id: string;
  type_1_name: string;
  type_1_pct: number;
  type_2_name: string | null;
  type_2_pct: number | null;
  type_3_name: string | null;
  type_3_pct: number | null;
  dominant_subtype: string | null;
  wing: string | null;
  health_level: number | null;
  dominant_center: string | null;
  tritype: string | null;
  summary: string | null;
  conversation: any;
  created_at: string;
  user_id: string;
  profiles: { display_name: string | null } | null;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultWithProfile[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast.error("Acesso negado");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      fetchResults();
    };
    checkAdmin();
  }, [user]);

  const fetchResults = async () => {
    // Fetch results and profiles separately (no FK between them)
    const { data: resultsData } = await supabase
      .from("enneagram_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (resultsData) {
      const userIds = [...new Set(resultsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setResults(resultsData.map(r => ({
        ...r,
        profiles: profileMap.get(r.user_id) || null,
      })) as ResultWithProfile[]);
    }
    setLoading(false);
  };

  const getUserEmail = async (userId: string): Promise<string> => {
    // We can't access auth.users directly, so use profile name
    const profile = results.find(r => r.user_id === userId)?.profiles;
    return profile?.display_name || userId.slice(0, 8);
  };

  const handleGeneratePDF = async (result: ResultWithProfile) => {
    toast.info("Gerando relatório com IA...");

    // Fetch logo and skills in parallel
    const [logoBase64, skills] = await Promise.all([
      (async () => {
        try {
          const response = await fetch(logoSrc);
          const blob = await response.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch { return undefined; }
      })(),
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("enneagram-skills", {
            body: {
              type_1_name: result.type_1_name,
              type_1_pct: result.type_1_pct,
              type_2_name: result.type_2_name,
              type_2_pct: result.type_2_pct,
              type_3_name: result.type_3_name,
              type_3_pct: result.type_3_pct,
              wing: result.wing,
              dominant_subtype: result.dominant_subtype,
            },
          });
          if (error) throw error;
          return data;
        } catch (e) {
          console.error("Skills generation failed:", e);
          return null;
        }
      })(),
    ]);

    generateEnneagramPDF(result, logoBase64, skills);
    toast.success("PDF gerado com sucesso!");
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">Painel Admin</h1>
          <span className="ml-auto text-muted-foreground font-body text-sm">
            {results.length} resultado(s)
          </span>
        </div>

        <AdminStats />

        {results.length === 0 ? (
          <p className="text-muted-foreground font-body text-center py-20">Nenhum resultado ainda.</p>
        ) : (
          <div className="space-y-4">
            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {result.type_1_name} ({result.type_1_pct}%)
                    </h3>
                    <p className="text-sm text-muted-foreground font-body mt-1">
                      {result.profiles?.display_name || "Sem nome"} · {formatDate(result.created_at)}
                    </p>
                    {result.type_2_name && (
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        2º: {result.type_2_name} ({result.type_2_pct}%) · 3º: {result.type_3_name} ({result.type_3_pct}%)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(expanded === result.id ? null : result.id)}
                      className="text-muted-foreground"
                    >
                      {expanded === result.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePDF(result)}
                      className="gap-2 border-primary/30 text-primary hover:bg-primary/10 rounded-xl font-body"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>

                {expanded === result.id && result.summary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-border/50"
                  >
                    <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">
                      {result.summary.replace(/[#*_`]/g, "").slice(0, 500)}
                      {result.summary.length > 500 ? "..." : ""}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
