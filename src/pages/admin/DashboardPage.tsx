import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Users, Clock, CheckCircle, Bell, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(43,80%,55%)", "hsl(265,40%,50%)", "hsl(200,60%,50%)",
  "hsl(340,70%,55%)", "hsl(160,50%,45%)", "hsl(30,80%,55%)",
  "hsl(280,50%,60%)", "hsl(120,40%,45%)", "hsl(10,70%,55%)",
];

interface Stats {
  totalResults: number;
  uniqueClients: number;
  pendingFeedback: number;
  readyForReport: number;
  typeDistribution: { name: string; count: number }[];
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Get profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfileName(profile?.display_name || user.email?.split("@")[0] || "Admin");

      // Get all results
      const { data: results } = await supabase
        .from("enneagram_results")
        .select("type_1_name, user_id");

      // Get feedback
      const { data: feedback } = await supabase
        .from("enneagram_feedback")
        .select("result_id");

      if (!results) return;

      const uniqueUsers = new Set(results.map((r) => r.user_id));
      const feedbackResultIds = new Set(feedback?.map((f) => f.result_id) || []);
      const resultsWithFeedback = results.filter((r: any) => feedbackResultIds.has(r.id));

      // Type distribution
      const typeCounts: Record<string, number> = {};
      for (const r of results) {
        const name = r.type_1_name || "Desconhecido";
        typeCounts[name] = (typeCounts[name] || 0) + 1;
      }
      const typeDistribution = Object.entries(typeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalResults: results.length,
        uniqueClients: uniqueUsers.size,
        pendingFeedback: results.length - (feedback?.length || 0),
        readyForReport: results.length,
        typeDistribution,
      });
    };
    fetchData();
  }, [user]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Relatórios Gerados", value: stats.totalResults, sub: `Total acumulado: ${stats.totalResults}`, icon: FileText },
    { label: "Clientes Com Relatórios", value: stats.uniqueClients, sub: "clientes únicos atendidos", icon: Users },
    { label: "Aguardando Resposta", value: stats.pendingFeedback, sub: "questionários pendentes", icon: Clock },
    { label: "Prontos p/ Relatório", value: stats.readyForReport, sub: "clientes responderam", icon: CheckCircle },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Olá, {profileName}!
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Bem-vindo ao seu painel de controle
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl font-body border-border">
            <Bell className="w-4 h-4" />
            Notificações
          </Button>
          <Button className="gap-2 rounded-xl font-body">
            <UserPlus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Plan card */}
      <div className="bg-card/80 rounded-2xl border border-border/50 p-6 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Seu Plano</h3>
          <p className="text-sm text-muted-foreground font-body">Plano Profissional</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Créditos ilimitados disponíveis</p>
        </div>
        <div className="text-right">
          <span className="text-primary font-heading font-bold text-lg">∞ Créditos</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card/80 rounded-2xl border border-border/50 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-body">{kpi.label}</p>
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      {stats.typeDistribution.length > 0 && (
        <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Distribuição de Tipos do Eneagrama
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Perfis dominantes dos seus clientes
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.typeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="count"
                label={({ name, count }) => `${name}: ${count}`}
              >
                {stats.typeDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
