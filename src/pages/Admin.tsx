import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

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
    const { data, error } = await supabase
      .from("enneagram_results")
      .select("*, profiles!enneagram_results_user_id_fkey(display_name)")
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback: fetch without join
      const { data: resultsOnly } = await supabase
        .from("enneagram_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (resultsOnly) {
        // Fetch profiles separately
        const userIds = [...new Set(resultsOnly.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setResults(resultsOnly.map(r => ({
          ...r,
          profiles: profileMap.get(r.user_id) || null,
        })) as ResultWithProfile[]);
      }
    } else {
      setResults((data || []) as unknown as ResultWithProfile[]);
    }
    setLoading(false);
  };

  const getUserEmail = async (userId: string): Promise<string> => {
    // We can't access auth.users directly, so use profile name
    const profile = results.find(r => r.user_id === userId)?.profiles;
    return profile?.display_name || userId.slice(0, 8);
  };

  const generatePDF = async (result: ResultWithProfile) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    const addText = (text: string, size: number = 11, bold: boolean = false) => {
      doc.setFontSize(size);
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");

      const lines = doc.splitTextToSize(text, 170);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += size * 0.5;
      }
      y += 3;
    };

    const addSeparator = () => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setDrawColor(180, 160, 120);
      doc.line(margin, y, 190, y);
      y += 8;
    };

    // Header
    addText("RELATÓRIO DE ENEAGRAMA", 18, true);
    addText(`Data: ${new Date(result.created_at).toLocaleDateString("pt-BR")}`, 10);
    y += 5;
    addSeparator();

    // User data
    addText("DADOS DO USUÁRIO", 13, true);
    const userName = result.profiles?.display_name || "Não informado";
    addText(`Nome: ${userName}`);
    addText(`ID: ${result.user_id}`);
    y += 3;
    addSeparator();

    // Results
    addText("RESULTADO", 13, true);
    addText(`Tipo Principal: ${result.type_1_name} (${result.type_1_pct}%)`, 12, true);
    if (result.type_2_name) addText(`2º Tipo: ${result.type_2_name} (${result.type_2_pct}%)`);
    if (result.type_3_name) addText(`3º Tipo: ${result.type_3_name} (${result.type_3_pct}%)`);
    if (result.dominant_subtype) addText(`Subtipo Dominante: ${result.dominant_subtype}`);
    if (result.wing) addText(`Asa: ${result.wing}`);
    if (result.health_level) addText(`Nível de Saúde: ${result.health_level}`);
    if (result.dominant_center) addText(`Centro Dominante: ${result.dominant_center}`);
    if (result.tritype) addText(`Tritipo: ${result.tritype}`);
    y += 3;
    addSeparator();

    // Summary
    if (result.summary) {
      addText("ANÁLISE / RESUMO", 13, true);
      addText(result.summary.replace(/[#*_`]/g, ""));
      y += 3;
      addSeparator();
    }

    // Conversation
    if (result.conversation && Array.isArray(result.conversation)) {
      addText("CONVERSA COMPLETA", 13, true);
      y += 3;
      for (const msg of result.conversation) {
        const role = msg.role === "user" ? "Usuário" : "IA";
        addText(`${role}:`, 10, true);
        addText(msg.content?.replace(/[#*_`]/g, "") || "", 10);
        y += 2;
      }
    }

    doc.save(`eneagrama-${userName.replace(/\s+/g, "-")}-${new Date(result.created_at).toISOString().slice(0, 10)}.pdf`);
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
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">Painel Admin</h1>
          <span className="ml-auto text-muted-foreground font-body text-sm">
            {results.length} resultado(s)
          </span>
        </div>

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
                      onClick={() => generatePDF(result)}
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
