import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Image, Shield, Save } from "lucide-react";
import { toast } from "sonner";

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setPhone(data.phone || "");
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Alterações salvas!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground font-body">
          Gerencie seu perfil e preferências
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="bg-secondary/50 rounded-xl">
          <TabsTrigger value="perfil" className="gap-2 font-body rounded-lg">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="logo" className="gap-2 font-body rounded-lg">
            <Image className="w-4 h-4" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2 font-body rounded-lg">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <div className="bg-card/80 rounded-2xl border border-border/50 p-6 space-y-6">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Informações do Perfil</h3>
              <p className="text-sm text-muted-foreground font-body">
                Atualize seus dados pessoais e profissionais
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">Nome completo</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl font-body"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Nome da empresa</Label>
                <Input
                  placeholder="Sua empresa"
                  className="rounded-xl font-body"
                  disabled
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">E-mail</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="rounded-xl font-body"
                />
                <p className="text-xs text-muted-foreground font-body">O e-mail não pode ser alterado</p>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl font-body"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl font-body">
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logo" className="mt-6">
          <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Logo</h3>
            <p className="text-sm text-muted-foreground font-body">
              Funcionalidade em breve — personalize o logo nos relatórios.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="seguranca" className="mt-6">
          <div className="bg-card/80 rounded-2xl border border-border/50 p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Segurança</h3>
            <p className="text-sm text-muted-foreground font-body">
              Funcionalidade em breve — altere sua senha e configure autenticação em dois fatores.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesPage;
