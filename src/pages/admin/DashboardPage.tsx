import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, Users, Clock, CheckCircle, Bell, UserPlus,
  TrendingUp, BarChart3, Send, Download, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#7c3aed", "#eab308", "#3b82f6", "#ef4444",
  "#10b981", "#f97316", "#8b5cf6", "#06b6d4", "#ec4899",
];

interface Stats {
  totalResults: number;
  uniqueClients: number;
  pendingFeedback: number;
  avgRating: number;
  feedbackCount: number;
  typeDistribution: { name: string; count: number }[];
  subtypeDistribution: { name: string; count: number }[];
  recentResults: { id: string; type_1_name: string; created_at: string; user_id: string }[];
}

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfileName(profile?.display_name || user.email?.split("@")[0] || "Admin");

      const { data: allProfiles } = await supabase.from("profiles").select("user_id, display_name");
      const pMap: Record<string, string> = {};
      allProfiles?.forEach((p) => { pMap[p.user_id] = p.display_name || "Sem nome"; });
      setProfilesMap(pMap);

      const { data: results } = await supabase
        .from("enneagram_results")
        .select("id, type_1_name, user_id, dominant_subtype, created_at")
        .order("created_at", { ascending: false });

      const { data: feedback } = await supabase
        .from("enneagram_feedback")
        .select("result_id, accuracy_rating");

      if (!results) return;

      const uniqueUsers = new Set(results.map((r) => r.user_id));

      const typeCounts: Record<string, number> = {};
      const subtypeCounts: Record<string, number> = {};
      for (const r of results) {
        const name = r.type_1_name || "Desconhecido";
        typeCounts[name] = (typeCounts[name] || 0) + 1;
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

      const feedbackCount = feedback?.length || 0;
      const avgRating = feedbackCount > 0
        ? feedback!.reduce((sum, f) => sum + f.accuracy_rating, 0) / feedbackCount
        : 0;

      setStats({
        totalResults: results.length,
        uniqueClients: uniqueUsers.size,
        pendingFeedback: results.length - feedbackCount,
        avgRating,
        feedbackCount,
        typeDistribution,
        subtypeDistribution,
        recentResults: results.slice(0, 5),
      });
    };
    fetchData();
  }, [user]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Relatórios Gerados", value: stats.totalResults, icon: FileText, color: "bg-violet-100 text-violet-600" },
    { label: "Clientes Atendidos", value: stats.uniqueClients, icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Feedbacks Recebidos", value: stats.feedbackCount, icon: CheckCircle, color: "bg-emerald-100 text-emerald-600" },
    { label: "Nota Média", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", icon: Star, color: "bg-amber-100 text-amber-600", suffix: stats.avgRating > 0 ? "/5" : "" },
  ];

  const quickActions = [
    { label: "Novo Cliente", icon: UserPlus, onClick: () => navigate("/admin/clientes"), color: "bg-violet-600 hover:bg-violet-700 text-white" },
    { label: "Ver Relatórios", icon: BarChart3, onClick: () => navigate("/admin/relatorios"), color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Notificações", icon: Bell, onClick: () => navigate("/admin/notificacoes"), color: "bg-amber-500 hover:bg-amber-600 text-white" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {profileName}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Aqui está o resumo da sua plataforma
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm ${action.color}`}
              >
                <action.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {kpi.value}
                {kpi.suffix && <span className="text-sm font-normal text-gray-400">{kpi.suffix}</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          {stats.typeDistribution.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Distribuição de Tipos</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Perfis dominantes dos clientes</p>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.typeDistribution} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={55}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "13px" }}
                  />
                  <Bar dataKey="count" name="Testes" radius={[8, 8, 0, 0]}>
                    {stats.typeDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pie Chart */}
          {stats.subtypeDistribution.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Subtipos</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Distribuição dos subtipos identificados</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.subtypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, count }) => `${name} (${count})`}
                    labelLine={{ stroke: "#94a3b8" }}
                  >
                    {stats.subtypeDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Tipos (Donut)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Visão proporcional dos tipos</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                    labelLine={{ stroke: "#94a3b8" }}
                  >
                    {stats.typeDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Results Table */}
        {stats.recentResults.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Últimos Resultados</h3>
                <p className="text-xs text-gray-500 mt-0.5">Os 5 testes mais recentes</p>
              </div>
              <button
                onClick={() => navigate("/admin/relatorios")}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Ver todos →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Dominante</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentResults.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {profilesMap[r.user_id] || "Usuário"}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                          {r.type_1_name}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
