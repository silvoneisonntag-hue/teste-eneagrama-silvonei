import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, Download, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateEnneagramPDF, getPDFFileName, ReportLevel, REPORT_LEVEL_LABELS } from "@/lib/generate-pdf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logoSrc from "@/assets/logo.png";
import ResultPreviewModal from "@/components/admin/ResultPreviewModal";

interface ReportRow {
  id: string;
  user_id: string;
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
  display_name: string | null;
  phone: string | null;
}

const LEVEL_BADGE_STYLES: Record<ReportLevel, string> = {
  basico: "bg-green-600/20 text-green-400 border-green-600/30",
  intermediario: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  completo: "bg-blue-600/20 text-blue-400 border-blue-600/30",
};

const RelatoriosPage = () => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, ReportLevel>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [previewRow, setPreviewRow] = useState<ReportRow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: results } = await supabase
        .from("enneagram_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (!results) { setLoading(false); return; }

      const userIds = [...new Set(results.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      setRows(
        results.map((r) => ({
          ...r,
          display_name: profileMap.get(r.user_id)?.display_name || null,
          phone: profileMap.get(r.user_id)?.phone || null,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.display_name || "").toLowerCase().includes(q) ||
      (r.phone || "").includes(q)
    );
  });

  const getLevel = (id: string): ReportLevel => selectedLevels[id] || "basico";

  const handlePDF = async (row: ReportRow) => {
    const level = getLevel(row.id);
    setGeneratingId(row.id);
    toast.info(`Gerando relatório ${REPORT_LEVEL_LABELS[level]}...`);
    try {
      const needsSkills = level !== "basico";

      const [logoBase64, skills] = await Promise.all([
        (async () => {
          try {
            const resp = await fetch(logoSrc);
            const blob = await resp.blob();
            return await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch { return undefined; }
        })(),
        needsSkills
          ? (async () => {
              try {
                const { data, error } = await supabase.functions.invoke("enneagram-skills", {
                  body: {
                    type_1_name: row.type_1_name,
                    type_1_pct: row.type_1_pct,
                    type_2_name: row.type_2_name,
                    type_2_pct: row.type_2_pct,
                    type_3_name: row.type_3_name,
                    type_3_pct: row.type_3_pct,
                    wing: row.wing,
                    dominant_subtype: row.dominant_subtype,
                  },
                });
                if (error) throw error;
                return data;
              } catch { return null; }
            })()
          : Promise.resolve(null),
      ]);
      generateEnneagramPDF(row as any, logoBase64, skills, level);
      toast.success("PDF gerado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleWhatsApp = async (row: ReportRow) => {
    if (!row.phone) {
      toast.error("Este cliente não possui telefone cadastrado.");
      return;
    }

    const level = getLevel(row.id);
    setSendingId(row.id);
    toast.info("Gerando PDF e preparando envio...");

    try {
      const needsSkills = level !== "basico";
      const [logoBase64, skills] = await Promise.all([
        (async () => {
          try {
            const resp = await fetch(logoSrc);
            const blob = await resp.blob();
            return await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch { return undefined; }
        })(),
        needsSkills
          ? (async () => {
              try {
                const { data, error } = await supabase.functions.invoke("enneagram-skills", {
                  body: {
                    type_1_name: row.type_1_name, type_1_pct: row.type_1_pct,
                    type_2_name: row.type_2_name, type_2_pct: row.type_2_pct,
                    type_3_name: row.type_3_name, type_3_pct: row.type_3_pct,
                    wing: row.wing, dominant_subtype: row.dominant_subtype,
                  },
                });
                if (error) throw error;
                return data;
              } catch { return null; }
            })()
          : Promise.resolve(null),
      ]);

      const blob = generateEnneagramPDF(row as any, logoBase64, skills, level, true) as Blob;
      const fileName = getPDFFileName(row as any);

      // Upload to storage
      const filePath = `${row.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, blob, { contentType: "application/pdf", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Format phone for WhatsApp (remove non-digits, ensure country code)
      let phone = row.phone.replace(/\D/g, "");
      if (phone.startsWith("0")) phone = "55" + phone.slice(1);
      if (!phone.startsWith("55")) phone = "55" + phone;

      const message = encodeURIComponent(
        `Olá ${row.display_name || ""}! 🌟\n\nSeu relatório de Eneagrama (${REPORT_LEVEL_LABELS[level]}) está pronto!\n\n📄 Acesse aqui: ${publicUrl}\n\nQualquer dúvida, estou à disposição!`
      );

      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      toast.success("WhatsApp aberto com o link do relatório!");
    } catch (err) {
      console.error("WhatsApp send error:", err);
      toast.error("Erro ao preparar envio por WhatsApp");
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground font-body">
          Gere relatórios para clientes que responderam o questionário
        </p>
      </div>

      <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Clientes Prontos para Relatório
            </h3>
            <p className="text-xs text-muted-foreground font-body">{filtered.length} cliente(s) disponíveis</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl font-body"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 mt-2">
          <span className="text-xs text-muted-foreground font-body">Legenda:</span>
          <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">Básico</Badge>
          <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-[10px]">Intermediário</Badge>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-[10px]">Completo</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground font-body py-10">Nenhum relatório disponível.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground font-body">
                  <th className="text-left py-3 px-2 font-medium">Nome</th>
                  <th className="text-left py-3 px-2 font-medium">Perfil Dominante</th>
                  <th className="text-left py-3 px-2 font-medium">Tipo Relatório</th>
                  <th className="text-left py-3 px-2 font-medium">Data</th>
                  <th className="text-right py-3 px-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const level = getLevel(row.id);
                  return (
                    <tr key={row.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-body text-foreground">{row.display_name || "Sem nome"}</p>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {row.type_1_name}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={level}
                          onValueChange={(v) => setSelectedLevels((prev) => ({ ...prev, [row.id]: v as ReportLevel }))}
                        >
                          <SelectTrigger className="w-[150px] h-8 rounded-lg font-body text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(REPORT_LEVEL_LABELS) as ReportLevel[]).map((l) => (
                              <SelectItem key={l} value={l} className="font-body text-xs">
                                <span className="flex items-center gap-2">
                                  <span className={`inline-block w-2 h-2 rounded-full ${
                                    l === "basico" ? "bg-green-400" : l === "intermediario" ? "bg-orange-400" : "bg-blue-400"
                                  }`} />
                                  {REPORT_LEVEL_LABELS[l]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2 font-body text-muted-foreground">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setPreviewRow(row)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400 hover:text-green-300"
                            onClick={() => handlePDF(row)}
                            disabled={generatingId === row.id}
                          >
                            {generatingId === row.id ? (
                              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-400 hover:text-blue-300"
                            onClick={() => handleWhatsApp(row)}
                            disabled={sendingId === row.id}
                            title={row.phone ? "Enviar por WhatsApp" : "Sem telefone cadastrado"}
                          >
                            {sendingId === row.id ? (
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ResultPreviewModal
        result={previewRow}
        open={!!previewRow}
        onOpenChange={(open) => { if (!open) setPreviewRow(null); }}
      />
    </div>
  );
};

export default RelatoriosPage;
