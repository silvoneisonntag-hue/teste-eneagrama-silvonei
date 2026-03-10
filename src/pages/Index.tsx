import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Circle, Sparkles, Brain, LogOut, User, History, Instagram, Youtube, Linkedin } from "lucide-react";
import enneagramSymbol from "@/assets/enneagram-symbol.png";
import logo from "@/assets/logo.png";
import silvoneiPhoto from "@/assets/silvonei.jpg";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";

const enneagramTypes = [
  { num: 1, name: "O Perfeccionista", desc: "Busca a perfeição, é ético e tem forte senso de certo e errado." },
  { num: 2, name: "O Prestativo", desc: "Generoso e amoroso, busca ser necessário e ajudar os outros." },
  { num: 3, name: "O Realizador", desc: "Orientado ao sucesso, adaptável e focado em resultados." },
  { num: 4, name: "O Individualista", desc: "Sensível e introspectivo, busca autenticidade e significado." },
  { num: 5, name: "O Investigador", desc: "Analítico e reservado, busca conhecimento e compreensão." },
  { num: 6, name: "O Leal", desc: "Responsável e comprometido, busca segurança e confiança." },
  { num: 7, name: "O Entusiasta", desc: "Espontâneo e versátil, busca experiências e possibilidades." },
  { num: 8, name: "O Desafiador", desc: "Assertivo e decidido, busca controle e proteção." },
  { num: 9, name: "O Pacificador", desc: "Receptivo e tranquilo, busca harmonia e paz interior." },
];

const Index = () => {
  const [showChat, setShowChat] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-border/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-9 h-9" />
            <span className="font-heading text-xl font-semibold text-primary tracking-widest">ENEAGRAMA</span>
          </Link>
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground font-body hover:text-primary">
                    <History className="w-4 h-4" />
                    Histórico
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground font-body hover:text-primary">
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
              <p className="text-primary font-body font-semibold text-sm tracking-[0.3em] uppercase mb-4">
                ✦ Autoconhecimento profundo
              </p>
              <h1 className="font-heading text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                Descubra seu tipo no{" "}
                <span className="text-primary text-glow">Eneagrama</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg leading-relaxed max-w-md mb-8">
                Uma entrevista adaptativa conduzida por inteligência artificial
                para revelar seus padrões de personalidade, motivações e medos
                mais profundos.
              </p>
              <Button
                variant="hero"
                size="lg"
                onClick={handleStartInterview}
                className="px-8 py-6 text-base rounded-xl gap-3 glow-gold"
              >
                Começar Entrevista
                <ArrowRight className="w-5 h-5" />
              </Button>
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
                className="w-72 lg:w-80 drop-shadow-[0_0_40px_hsl(43_80%_55%_/_0.3)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
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
              Uma experiência personalizada que vai muito além de questionários tradicionais.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Entrevista Adaptativa",
                desc: "A IA adapta cada pergunta com base nas suas respostas anteriores, aprofundando a investigação.",
              },
              {
                icon: <Circle className="w-6 h-6" />,
                title: "25-40 Perguntas",
                desc: "Uma investigação completa que analisa motivações, medos, padrões de relacionamento e estresse.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Resultado Detalhado",
                desc: "Receba seu tipo com probabilidades, subtipo instintivo e uma análise psicológica completa.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-7 border border-border/50 shadow-[var(--shadow-card)] hover:border-primary/30 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 Types */}
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
              Os 9 Tipos do Eneagrama
            </h2>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              Cada tipo representa um padrão fundamental de motivação, medo e comportamento.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {enneagramTypes.map((type, i) => (
              <motion.div
                key={type.num}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-card/60 backdrop-blur-sm rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-colors duration-300"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-heading font-bold text-sm">
                    {type.num}
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{type.name}</h3>
                </div>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{type.desc}</p>
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
            className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 lg:p-10 shadow-[var(--shadow-card)]"
          >
            <div className="text-center">
              <img
                src={silvoneiPhoto}
                alt="Silvonei Sonntag - Instrutor de Eneagrama"
                className="w-36 h-36 rounded-full object-cover object-top mx-auto mb-6 border-2 border-primary/30 shadow-lg"
              />
              <p className="text-primary font-body font-semibold text-sm tracking-[0.3em] uppercase mb-3">
                ✦ Sobre o instrutor
              </p>
              <h2 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground mb-5">
                Silvonei Sonntag
              </h2>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-4">
                Estudioso e instrutor de Eneagrama com anos de experiência em desenvolvimento pessoal e autoconhecimento. 
                Silvonei utiliza o Eneagrama como ferramenta de transformação, ajudando pessoas a compreenderem seus 
                padrões de personalidade, motivações profundas e caminhos de crescimento.
              </p>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-8">
                Sua abordagem combina a sabedoria tradicional do Eneagrama com metodologias modernas, 
                incluindo esta ferramenta de entrevista por inteligência artificial que torna o processo 
                de tipificação mais acessível, profundo e personalizado.
              </p>

              <div className="flex items-center justify-center gap-4">
                <a
                  href="https://www.instagram.com/silvoneisonntag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.youtube.com/@silvoneisonntag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/silvoneisonntag/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
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
                q: "O que é o Eneagrama?",
                a: "O Eneagrama é um sistema de tipologia de personalidade que descreve 9 tipos fundamentais, cada um com padrões distintos de motivação, medo e comportamento. É usado para autoconhecimento e desenvolvimento pessoal.",
              },
              {
                q: "Como funciona a entrevista por IA?",
                a: "A inteligência artificial conduz uma entrevista adaptativa de 25 a 40 perguntas, analisando suas respostas em tempo real para aprofundar a investigação e identificar seu tipo com mais precisão.",
              },
              {
                q: "O resultado é definitivo?",
                a: "O resultado é indicativo e baseado nas suas respostas durante a entrevista. Para uma tipificação definitiva, recomendamos acompanhamento com um profissional especializado.",
              },
              {
                q: "Posso refazer o teste?",
                a: "Sim! Você pode fazer quantas entrevistas quiser. Cada resultado é salvo no seu histórico para que você possa comparar.",
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
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground font-body text-sm">
            Este teste é apenas indicativo e não substitui avaliação profissional.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
