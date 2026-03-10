import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ResultData {
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
  created_at: string;
  display_name: string | null;
  phone: string | null;
  subtype_preservation?: number | null;
  subtype_social?: number | null;
  subtype_sexual?: number | null;
  integration_direction?: string | null;
  disintegration_direction?: string | null;
}

interface Props {
  result: ResultData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-xs text-muted-foreground font-body">{label}</span>
    <span className="text-sm font-body text-foreground font-medium">{value}</span>
  </div>
);

const TypeBar = ({ name, pct, color }: { name: string; pct: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-body">
      <span className="text-foreground font-medium">{name}</span>
      <span className="text-muted-foreground">{pct}%</span>
    </div>
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const ResultPreviewModal = ({ result, open, onOpenChange }: Props) => {
  if (!result) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-3">
            Resultado de {result.display_name || "Sem nome"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-body">{formatDate(result.created_at)}</p>
        </DialogHeader>

        {/* Main type */}
        <div className="text-center py-4">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-1.5 font-heading">
            {result.type_1_name}
          </Badge>
          <p className="text-3xl font-bold text-primary mt-2 font-heading">{result.type_1_pct}%</p>
        </div>

        {/* Type bars */}
        <div className="space-y-3">
          <TypeBar name={result.type_1_name} pct={result.type_1_pct} color="bg-primary" />
          {result.type_2_name && result.type_2_pct && (
            <TypeBar name={result.type_2_name} pct={result.type_2_pct} color="bg-blue-500" />
          )}
          {result.type_3_name && result.type_3_pct && (
            <TypeBar name={result.type_3_name} pct={result.type_3_pct} color="bg-emerald-500" />
          )}
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-0.5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-2">Perfil Detalhado</h3>
          {result.wing && <StatItem label="Asa" value={result.wing} />}
          {result.dominant_subtype && <StatItem label="Subtipo Dominante" value={result.dominant_subtype} />}
          {result.dominant_center && <StatItem label="Centro Dominante" value={result.dominant_center} />}
          {result.tritype && <StatItem label="Tritipo" value={result.tritype} />}
          {result.health_level && <StatItem label="Nível de Saúde" value={`${result.health_level}/9`} />}
        </div>

        {/* Subtypes */}
        {(result.subtype_preservation != null || result.subtype_social != null || result.subtype_sexual != null) && (
          <>
            <Separator />
            <div className="space-y-0.5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-2">Subtipos</h3>
              {result.subtype_preservation != null && <StatItem label="Autopreservação" value={`${result.subtype_preservation}%`} />}
              {result.subtype_social != null && <StatItem label="Social" value={`${result.subtype_social}%`} />}
              {result.subtype_sexual != null && <StatItem label="Sexual" value={`${result.subtype_sexual}%`} />}
            </div>
          </>
        )}

        {/* Growth directions */}
        {(result.integration_direction || result.disintegration_direction) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-heading text-sm font-semibold text-foreground">Direções de Crescimento</h3>
              {result.integration_direction && (
                <div>
                  <p className="text-xs text-muted-foreground font-body mb-0.5">Integração</p>
                  <p className="text-sm font-body text-foreground">{result.integration_direction}</p>
                </div>
              )}
              {result.disintegration_direction && (
                <div>
                  <p className="text-xs text-muted-foreground font-body mb-0.5">Desintegração</p>
                  <p className="text-sm font-body text-foreground">{result.disintegration_direction}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Summary */}
        {result.summary && (
          <>
            <Separator />
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground mb-2">Análise</h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {result.summary.replace(/[#*_`]/g, "").slice(0, 800)}
                {result.summary.length > 800 ? "..." : ""}
              </p>
            </div>
          </>
        )}

        {/* Contact */}
        {result.phone && (
          <>
            <Separator />
            <StatItem label="Telefone" value={result.phone} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResultPreviewModal;
