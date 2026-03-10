import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedLgpd, setAcceptedLgpd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, phone },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
            {isLogin ? "Entrar" : "Criar Conta"}
          </h1>
          <p className="text-muted-foreground font-body">
            {isLogin
              ? "Acesse seus resultados de Eneagrama"
              : "Crie sua conta para salvar seus resultados"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl border border-border p-8 shadow-[var(--shadow-soft)]">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="font-body text-sm text-foreground">Nome</Label>
              <Input
                id="name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="rounded-xl font-body"
                required
              />
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-body text-sm text-foreground">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="rounded-xl font-body"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-body text-sm text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="rounded-xl font-body"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-body text-sm text-foreground">Senha</Label>
              {isLogin && (
                <Link to="/forgot-password" className="text-sm text-primary hover:underline font-body">
                  Esqueceu a senha?
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl font-body"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="lgpd"
                checked={acceptedLgpd}
                onCheckedChange={(checked) => setAcceptedLgpd(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="lgpd" className="text-xs text-muted-foreground font-body leading-relaxed cursor-pointer">
                Li e concordo com a{" "}
                <Link to="/privacidade" className="text-primary hover:underline font-medium">
                  Política de Privacidade
                </Link>{" "}
                e autorizo o tratamento dos meus dados pessoais conforme a LGPD.
              </label>
            </div>
          )}

          <Button variant="hero" type="submit" disabled={loading || (!isLogin && !acceptedLgpd)} className="w-full rounded-xl py-6">
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground font-body">
            {isLogin ? "Não tem conta? " : "Já tem conta? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
