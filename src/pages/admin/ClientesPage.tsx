import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Eye, Trash2, FileText, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Client {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  email?: string;
  hasResult: boolean;
}

const ClientesPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const fetchClients = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone, created_at")
      .order("created_at", { ascending: false });

    const { data: results } = await supabase
      .from("enneagram_results")
      .select("user_id");

    const resultUserIds = new Set(results?.map((r) => r.user_id) || []);

    setClients(
      (profiles || []).map((p) => ({
        ...p,
        hasResult: resultUserIds.has(p.user_id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client", {
        body: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Erro ao cadastrar cliente");
        return;
      }

      toast.success("Cliente cadastrado com sucesso!");
      setForm({ name: "", email: "", phone: "" });
      setDialogOpen(false);
      await fetchClients();
    } catch {
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.display_name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  const handleDelete = async (client: Client) => {
    if (!confirm(`Tem certeza que deseja excluir "${client.display_name || "Sem nome"}"?`)) return;
    try {
      // Delete related results and feedback first
      const { data: resultIds } = await supabase
        .from("enneagram_results")
        .select("id")
        .eq("user_id", client.user_id);

      if (resultIds && resultIds.length > 0) {
        await supabase
          .from("enneagram_feedback")
          .delete()
          .in("result_id", resultIds.map(r => r.id));

        await supabase
          .from("enneagram_results")
          .delete()
          .eq("user_id", client.user_id);
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", client.user_id);

      if (error) throw error;
      toast.success("Cliente excluído com sucesso!");
      setClients((prev) => prev.filter((c) => c.user_id !== client.user_id));
    } catch (e: any) {
      console.error("Delete error:", e);
      toast.error("Erro ao excluir cliente");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground font-body">
            Gerencie seus clientes e envie questionários
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl font-body">
              <UserPlus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-body">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-xl font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-xl font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-body">WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="rounded-xl font-body"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="w-full rounded-xl font-body"
              >
                {submitting ? "Cadastrando..." : "Cadastrar Cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Lista de Clientes</h3>
            <p className="text-xs text-muted-foreground font-body">{filtered.length} cliente(s) cadastrado(s)</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl font-body"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground font-body py-10">Nenhum cliente encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground font-body">
                  <th className="text-left py-3 px-2 font-medium">Nome</th>
                  <th className="text-left py-3 px-2 font-medium">WhatsApp</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="text-left py-3 px-2 font-medium">Cadastro</th>
                  <th className="text-right py-3 px-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.user_id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-2 font-body text-foreground">
                      {client.display_name || "Sem nome"}
                    </td>
                    <td className="py-3 px-2 font-body text-muted-foreground">
                      {client.phone || "—"}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={client.hasResult ? "default" : "secondary"}
                        className={client.hasResult ? "bg-green-600/20 text-green-400 border-green-600/30" : ""}
                      >
                        {client.hasResult ? "Respondido" : "Pendente"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-body text-muted-foreground">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientesPage;
