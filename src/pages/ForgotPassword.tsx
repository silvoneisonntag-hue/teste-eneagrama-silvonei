import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Recuperar Senha</h1>
          <p className="text-muted-foreground font-body">Enviaremos um link para redefinir sua senha.</p>
        </div>

        {sent ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-[var(--shadow-soft)]">
            <p className="text-foreground font-body mb-4">Email enviado! Verifique sua caixa de entrada.</p>
            <Link to="/auth">
              <Button variant="outline" className="rounded-xl">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl border border-border p-8 shadow-[var(--shadow-soft)]">
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
            <Button variant="hero" type="submit" disabled={loading} className="w-full rounded-xl py-6">
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
            <p className="text-center">
              <Link to="/auth" className="text-sm text-primary hover:underline font-body">Voltar ao login</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
