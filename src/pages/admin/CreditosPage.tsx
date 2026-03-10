import { Coins, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CreditosPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Comprar Créditos</h1>
        <p className="text-sm text-muted-foreground font-body">
          Adquira créditos adicionais para gerar mais relatórios
        </p>
      </div>

      {/* Current credits */}
      <div className="bg-card/80 rounded-2xl border border-border/50 p-6 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Seus Créditos Atuais</h3>
          <p className="text-sm text-muted-foreground font-body">Créditos disponíveis para gerar relatórios</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Créditos ilimitados disponíveis</p>
        </div>
        <span className="text-primary font-heading font-bold text-lg">∞ Créditos</span>
      </div>

      {/* Package */}
      <h3 className="font-heading text-lg font-semibold text-foreground">Pacotes de Créditos</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card/80 rounded-2xl border-2 border-primary/50 p-6 flex flex-col">
          <div className="text-center mb-4">
            <Coins className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-heading font-bold text-foreground">10</p>
            <p className="text-xs text-muted-foreground font-body">Pacote 10 Créditos</p>
            <p className="text-xl font-heading font-bold text-foreground mt-2">R$ 49,90</p>
            <p className="text-[10px] text-muted-foreground font-body">R$ 4,99 por crédito</p>
          </div>
          <ul className="space-y-2 text-sm font-body text-foreground/80 flex-1">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 10 créditos para relatórios</li>
            <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> Válidos por 90 dias</li>
          </ul>
          <Button className="mt-4 rounded-xl font-body w-full gap-2">
            <Coins className="w-4 h-4" />
            Comprar
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Como funcionam os créditos?</h3>
        <ul className="space-y-2 text-sm font-body text-foreground/80">
          <li>• <strong>Créditos são acumulativos:</strong> Os créditos que você compra são somados aos créditos que você já possui.</li>
          <li>• <strong>Validade de 90 dias:</strong> Os créditos comprados são válidos por 90 dias a partir da data da compra.</li>
          <li>• <strong>1 crédito = 1 cliente:</strong> Cada cliente único consome 1 crédito, independente de quantos relatórios você gerar para ele.</li>
          <li>• <strong>Compra avulsa:</strong> Você pode comprar créditos sempre que precisar, sem assinatura.</li>
        </ul>
      </div>
    </div>
  );
};

export default CreditosPage;
