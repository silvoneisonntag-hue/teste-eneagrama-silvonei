import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  message: string;
  clientName: string;
  created_at: string;
}

const NotificacoesPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      // Build notifications from recent results
      const { data: results } = await supabase
        .from("enneagram_results")
        .select("id, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!results) { setLoading(false); return; }

      const userIds = [...new Set(results.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      setNotifications(
        results.map((r) => ({
          id: r.id,
          type: "Questionário respondido",
          message: `${profileMap.get(r.user_id) || "Cliente"} respondeu ao questionário e está pronto para geração de relatório.`,
          clientName: profileMap.get(r.user_id) || "Cliente",
          created_at: r.created_at,
        }))
      );
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days} dias`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Notificações</h1>
        <p className="text-sm text-muted-foreground font-body">
          Acompanhe as atividades dos seus clientes
        </p>
      </div>

      <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Suas Notificações</h3>
          <span className="text-xs text-primary font-body cursor-pointer hover:underline">Todas lidas</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground font-body py-10">Nenhuma notificação.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-primary">{n.type}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{n.message}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{n.clientName}</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground font-body whitespace-nowrap">
                  {timeAgo(n.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificacoesPage;
