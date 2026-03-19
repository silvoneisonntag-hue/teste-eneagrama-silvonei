import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, LogOut, User, Shield, Play, Feather, Eye, Heart } from "lucide-react";
import enneagramSymbol from "@/assets/enneagram-symbol.png";
import logo from "@/assets/logo.png";
import silvoneiPhoto from "@/assets/silvonei.png";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showChat, setShowChat] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPendingSession, setHasPendingSession] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setIsAdmin(false); setHasPendingSession(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));

    supabase
      .from("interview_sessions")
      .select("id, is_completed")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .maybeSingle()
      .then(({ data }) => setHasPendingSession(!!data));
  }, [user]);

  const handleStartInterview = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowChat(true);
  };

  if (showChat && user) {
    return (
      <div className="min-h-screen bg-background">
        <ChatInterface
          onBack={() => setShowChat(false)}
          onResultSaved={(id) => navigate(`/result/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle warm ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/3 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-border/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-9 h-9" />
            <span className="font-heading text-xl font-semibold text-foreground tracking-wider">Mapa Interior</span>
          </Link>
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground font-body hover:text-accent">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground font-body hover:text-accent">
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl font-body border-primary/30 text-primary hover:bg-primary/10">
                  <User className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10">
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-accent font-body font-medium text-sm tracking-[0.25em] uppercase mb-4">
                ✦ Jornada de autoconhecimento
              </p>
              <h1 className="font-heading text-5xl lg:text-6xl font-bold text-foreground leading-[1.15] mb-6">
                Descubra os padrões que moldam{" "}
                <span className="text-accent italic">quem você é</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg leading-relaxed max-w-lg mb-8">
                Uma conversa profunda e acolhedora que revela seus padrões de personalidade, motivações e as dinâmicas invisíveis que guiam sua vida.
              </p>

              <div className="bg-card/80 border border-border/60 rounded-2xl p-5 mb-8 max-w-lg shadow-[var(--shadow-soft)]">
                <p className="font-body text-sm text-foreground/80 leading-relaxed">
                  <span className="text-accent font-semibold">Antes de começar:</span> Reserve um momento tranquilo e sem interrupções. Responda com honestidade, pensando em como você realmente é — não em como gostaria de ser. Considere seus padrões desde os 18 anos, em situações pessoais e profissionais.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleStartInterview}
                  className="px-8 py-6 text-base rounded-2xl gap-3 glow-warm"
                >
                  {hasPendingSession ? "Continuar Conversa" : "Iniciar Jornada"}
                  {hasPendingSession ? <Play className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              <motion.img
                src={enneagramSymbol}
                alt="Símbolo do Eneagrama com nove pontos interconectados"
                className="w-[300px] lg:w-[360px] opacity-80"
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground mb-3">
              Como funciona
            </h2>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              Uma experiência que vai muito além de questionários tradicionais.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Conversa Acolhedora",
                desc: "Uma experiência conversacional profunda, como uma conversa com alguém que realmente te entende.",
              },
              {
                icon: <Eye className="w-6 h-6" />,
                title: "Investigação Profunda",
                desc: "A cada resposta, a conversa se adapta, revelando padrões emocionais e comportamentais únicos.",
              },
              {
                icon: <Feather className="w-6 h-6" />,
                title: "Análise Personalizada",
                desc: "Receba uma leitura detalhada dos seus padrões, forças, desafios e caminhos de crescimento.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-card/80 rounded-2xl p-7 border border-border/50 shadow-[var(--shadow-card)] hover:border-accent/30 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor / About */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-card/80 rounded-3xl border border-border/50 p-8 lg:p-10 shadow-[var(--shadow-card)]"
          >
            <div className="text-center">
              <img
                src={silvoneiPhoto}
                alt="Silvonei Sonntag"
                className="w-36 h-36 rounded-full object-cover object-top mx-auto mb-6 border-2 border-accent/30 shadow-lg"
              />
              <p className="text-accent font-body font-medium text-sm tracking-[0.25em] uppercase mb-3">
                ✦ Sobre o criador
              </p>
              <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground mb-5">
                Silvonei Sonntag
              </h2>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-4">
                Estudioso e instrutor com anos de experiência em desenvolvimento humano e autoconhecimento.
                Sua abordagem combina sabedoria tradicional com metodologias modernas, incluindo esta ferramenta
                de conversa por inteligência artificial.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground mb-3">
              Perguntas Frequentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "O que é essa experiência?",
                a: "É uma conversa guiada por inteligência artificial que revela seus padrões de personalidade, motivações profundas e dinâmicas comportamentais através de um diálogo adaptativo e acolhedor.",
              },
              {
                q: "Como funciona a conversa?",
                a: "A IA conduz uma conversa profunda e personalizada, adaptando cada pergunta com base nas suas respostas. Não é um questionário — é uma experiência conversacional que investiga seus padrões de forma natural.",
              },
              {
                q: "O resultado é definitivo?",
                a: "O resultado é uma leitura profunda baseada nos padrões que emergiram durante a conversa. Para uma compreensão completa, recomendamos acompanhamento com um profissional especializado.",
              },
              {
                q: "Posso refazer a conversa?",
                a: "Sim! Você pode iniciar novas conversas quando quiser. Cada resultado é salvo para que possa revisitar suas descobertas.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-card/60 rounded-2xl border border-border/40 p-6"
              >
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50 relative z-10">
        <div className="container mx-auto px-6 text-center space-y-2">
          <p className="text-muted-foreground font-body text-sm">
            Esta experiência é indicativa e não substitui acompanhamento profissional.
          </p>
          <p className="text-muted-foreground/60 font-body text-xs">
            © 2026 Todos os direitos reservados para Silvonei Sonntag Desenvolvimento Humano Ltda
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
