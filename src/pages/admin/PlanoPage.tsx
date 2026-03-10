import { Check, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PlanoPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Plano e Assinatura</h1>
        <p className="text-sm text-muted-foreground font-body">
          Gerencie seu plano e acompanhe seu uso
        </p>
      </div>

      {/* Current plan */}
      <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Seu Plano Atual</h3>
            <p className="text-sm text-muted-foreground font-body">Plano Profissional</p>
            <p className="text-xs text-muted-foreground font-body mt-2">
              Você tem créditos ilimitados disponíveis
            </p>
          </div>
          <span className="text-primary font-heading font-bold">∞ Créditos</span>
        </div>
      </div>

      {/* Billing rules */}
      <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
        <h3 className="font-heading text-lg font-semibold text-foreground">Regras de Cobrança</h3>
        <p className="text-xs text-muted-foreground font-body mb-3">Como funciona sua assinatura</p>
        <ul className="space-y-2 text-sm font-body text-foreground/80">
          <li>• <strong>Pagamento mensal:</strong> Sua assinatura é cobrada mensalmente.</li>
          <li>• <strong>Sem bloqueio de acesso:</strong> Mesmo se parar de pagar, você pode usar os créditos restantes.</li>
        </ul>
      </div>

      {/* Plans */}
      <h3 className="font-heading text-lg font-semibold text-foreground">Planos Disponíveis</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-card/80 rounded-2xl border border-border/50 p-6 flex flex-col">
          <div className="text-center mb-4">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <h4 className="font-heading text-lg font-bold text-foreground">Gratuito</h4>
            <p className="text-xs text-muted-foreground font-body">Acesse a plataforma e compre créditos quando precisar</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-2">R$ 0,00<span className="text-sm text-muted-foreground">/mês</span></p>
          </div>
          <ul className="space-y-2 text-sm font-body text-foreground/80 flex-1">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-muted-foreground" /> Acesso à plataforma</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-muted-foreground" /> Visualizar relatórios existentes</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-muted-foreground" /> Comprar créditos avulsos</li>
          </ul>
          <Button variant="outline" className="mt-4 rounded-xl font-body w-full" disabled>
            Indisponível
          </Button>
        </div>

        {/* Premium */}
        <div className="bg-card/80 rounded-2xl border-2 border-primary/50 p-6 flex flex-col relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-body">
            Mais Popular
          </Badge>
          <div className="text-center mb-4">
            <Star className="w-8 h-8 mx-auto text-primary mb-2" />
            <h4 className="font-heading text-lg font-bold text-foreground">Ilimitado</h4>
            <p className="text-xs text-muted-foreground font-body">Para empresas e equipes</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-2">R$ 79,90<span className="text-sm text-muted-foreground">/mês</span></p>
          </div>
          <ul className="space-y-2 text-sm font-body text-foreground/80 flex-1">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Créditos ilimitados</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Questionário completo</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 3 tipos de relatório</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Logo personalizado</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Suporte por e-mail</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Relatórios em PDF</li>
          </ul>
          <Button className="mt-4 rounded-xl font-body w-full">
            Fazer Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanoPage;
