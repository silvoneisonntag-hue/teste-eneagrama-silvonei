import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(43,80%,55%)", "hsl(265,40%,50%)", "hsl(200,60%,50%)",
  "hsl(340,70%,55%)", "hsl(160,50%,45%)", "hsl(30,80%,55%)",
  "hsl(280,50%,60%)", "hsl(120,40%,45%)", "hsl(10,70%,55%)",
];

interface StatsData {
  typeDistribution: { name: string; count: number }[];
  subtypeDistribution: { name: string; count: number }[];
  totalTests: number;
  avgRating: number;
  feedbackCount: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      // Type distribution
      const { data: results } = await supabase
        .from("enneagram_results")
        .select("type_1_name, dominant_subtype");

      // Feedback stats
      const { data: feedback } = await supabase
        .from("enneagram_feedback")
        .select("accuracy_rating, agrees_with_type");

      if (!results) return;

      // Count types
      const typeCounts: Record<string, number> = {};
      const subtypeCounts: Record<string, number> = {};
      for (const r of results) {
        // Extract just the type number/name
        const typeName = r.type_1_name || "Desconhecido";
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
        if (r.dominant_subtype) {
          subtypeCounts[r.dominant_subtype] = (subtypeCounts[r.dominant_subtype] || 0) + 1;
        }
      }

      const typeDistribution = Object.entries(typeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const subtypeDistribution = Object.entries(subtypeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const totalTests = results.length;
      const feedbackCount = feedback?.length || 0;
      const avgRating = feedbackCount > 0
        ? feedback!.reduce((sum, f) => sum + f.accuracy_rating, 0) / feedbackCount
        : 0;

      setStats({ typeDistribution, subtypeDistribution, totalTests, avgRating, feedbackCount });
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="mb-10">
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card/80 rounded-2xl border border-border/50 p-5 text-center">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Total de Testes</p>
          <p className="text-3xl font-heading font-bold text-primary">{stats.totalTests}</p>
        </div>
        <div className="bg-card/80 rounded-2xl border border-border/50 p-5 text-center">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Feedbacks</p>
          <p className="text-3xl font-heading font-bold text-primary">{stats.feedbackCount}</p>
        </div>
        <div className="bg-card/80 rounded-2xl border border-border/50 p-5 text-center">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Nota Média</p>
          <p className="text-3xl font-heading font-bold text-primary">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}<span className="text-lg text-muted-foreground">/5</span>
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Type distribution */}
        {stats.typeDistribution.length > 0 && (
          <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Distribuição de Tipos</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.typeDistribution}>
                <XAxis dataKey="name" tick={{ fill: "hsl(45,60%,90%)", fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "hsl(260,15%,55%)", fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Testes" radius={[8, 8, 0, 0]}>
                  {stats.typeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subtype distribution */}
        {stats.subtypeDistribution.length > 0 && (
          <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Subtipos Mais Comuns</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.subtypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  dataKey="count"
                  label={({ name, count }) => `${name} (${count})`}
                >
                  {stats.subtypeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
