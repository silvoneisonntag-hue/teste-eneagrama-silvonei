import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Json } from "@/integrations/supabase/types";
import { Send, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat, type Message } from "@/lib/chat-stream";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChatInterfaceProps {
  onBack?: () => void;
  onResultSaved?: (resultId: string) => void;
}

const ChatInterface = ({ onBack, onResultSaved }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startInterview = async () => {
    setStarted(true);
    setIsLoading(true);

    const initialMessages: Message[] = [
      { role: "user", content: "Olá, gostaria de fazer o teste de Eneagrama." },
    ];
    setMessages(initialMessages);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: initialMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => { toast.error(error); setIsLoading(false); },
      });
    } catch {
      toast.error("Erro ao conectar com a IA");
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => { toast.error(error); setIsLoading(false); },
      });
    } catch {
      toast.error("Erro ao conectar com a IA");
      setIsLoading(false);
    }
  };

  // Auto-save results silently when interview finishes
  const autoSaveResults = async () => {
    if (!user || autoSaved) return;

    const fullText = messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .join("\n");

    // Multiple regex patterns to handle different AI output formats
    const patterns = [
      // "Tipo 4 — O Individualista (65%)"
      /Tipo\s+(\d+)\s*[—–\-:]\s*([^(\n]+?)\s*\((\d+)%\)/gi,
      // "Tipo 4 — O Individualista: 65%"
      /Tipo\s+(\d+)\s*[—–\-:]\s*([^(\n]+?)\s*[:—–\-]\s*(\d+)%/gi,
      // "**Tipo 4 — O Individualista** (65%)"
      /\*{0,2}Tipo\s+(\d+)\s*[—–\-:]\s*([^*(\n]+?)\*{0,2}\s*\((\d+)%\)/gi,
      // "1º tipo: Tipo 4 — O Individualista (65%)"
      /(\d+)[º°]?\s*(?:tipo|lugar|posição)[:\s]*Tipo\s+(\d+)\s*[—–\-]\s*([^(\n]+?)\s*\((\d+)%\)/gi,
      // "Tipo 4 (O Individualista) — 65%"
      /Tipo\s+(\d+)\s*\(([^)]+)\)\s*[—–\-:]\s*(\d+)%/gi,
      // "Tipo 4 com Asa 3 (4w3) — 65%" or "Tipo 4 com Asa 3: 65%"
      /Tipo\s+(\d+)\s+com\s+[Aa]sa\s+\d+[^—–\-:\n]*?[—–\-:]\s*(\d+)%/gi,
      // "Tipo mais provável: 4" with percentage nearby
      /Tipo\s+mais\s+prov[áa]vel[:\s]*(\d+)\s*[—–\-]?\s*([^(\n]*?)\s*\(?(\d+)%\)?/gi,
      // "Tipo 4: 65%" simple format
      /Tipo\s+(\d+)\s*:\s*(\d+)%/gi,
    ];

    let allMatches: { num: string; name: string; pct: number }[] = [];

    for (const pattern of patterns) {
      const matches = [...fullText.matchAll(pattern)];
      if (matches.length > 0) {
        for (const m of matches) {
          if (pattern === patterns[3] && m.length === 5) {
            // Pattern with ordinal: group 2=num, 3=name, 4=pct
            allMatches.push({ num: m[2], name: m[3].trim(), pct: parseInt(m[4]) });
          } else if (pattern === patterns[5]) {
            // "Tipo N com Asa X: pct%" — only 2 capture groups
            allMatches.push({ num: m[1], name: `Tipo ${m[1]}`, pct: parseInt(m[2]) });
          } else if (pattern === patterns[7]) {
            // "Tipo N: pct%" — only 2 capture groups
            allMatches.push({ num: m[1], name: `Tipo ${m[1]}`, pct: parseInt(m[2]) });
          } else {
            allMatches.push({ num: m[1], name: m[2].trim(), pct: parseInt(m[3]) });
          }
        }
        break; // Use first pattern that matches
      }
    }

    // Fallback: look for any "X%" near "Tipo N" mentions
    if (allMatches.length === 0) {
      const loosePct = /Tipo\s+(\d+)[^%\n]{0,80}?(\d{1,3})%/gi;
      const looseMatches = [...fullText.matchAll(loosePct)];
      for (const m of looseMatches) {
        const pct = parseInt(m[2]);
        if (pct > 0 && pct <= 100) {
          allMatches.push({ num: m[1], name: `Tipo ${m[1]}`, pct });
        }
      }
    }

    // Last resort: look for "N%" patterns in final message context
    if (allMatches.length === 0) {
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        const tipoNumPattern = /Tipo\s+(\d+)/gi;
        const tipoNums = [...lastAssistant.content.matchAll(tipoNumPattern)];
        const uniqueNums = [...new Set(tipoNums.map(m => m[1]))];
        if (uniqueNums.length > 0) {
          // Assign descending percentages based on mention order
          uniqueNums.forEach((num, i) => {
            const estimatedPct = Math.max(80 - i * 20, 10);
            allMatches.push({ num, name: `Tipo ${num}`, pct: estimatedPct });
          });
        }
      }
    }

    // Deduplicate by type number, keep highest pct
    const seen = new Map<string, { num: string; name: string; pct: number }>();
    for (const m of allMatches) {
      const existing = seen.get(m.num);
      if (!existing || m.pct > existing.pct) seen.set(m.num, m);
    }
    const uniqueMatches = [...seen.values()].sort((a, b) => b.pct - a.pct);

    let type1Name = "Resultado salvo";
    let type1Pct = 0;
    let type2Name: string | null = null;
    let type2Pct: number | null = null;
    let type3Name: string | null = null;
    let type3Pct: number | null = null;

    if (uniqueMatches.length >= 1) {
      type1Name = `Tipo ${uniqueMatches[0].num} — ${uniqueMatches[0].name}`;
      type1Pct = uniqueMatches[0].pct;
    }
    if (uniqueMatches.length >= 2) {
      type2Name = `Tipo ${uniqueMatches[1].num} — ${uniqueMatches[1].name}`;
      type2Pct = uniqueMatches[1].pct;
    }
    if (uniqueMatches.length >= 3) {
      type3Name = `Tipo ${uniqueMatches[2].num} — ${uniqueMatches[2].name}`;
      type3Pct = uniqueMatches[2].pct;
    }

    // Extract subtypes with broader patterns
    const subtypePatterns = [
      /subtipo\s+(?:predominante|dominante)[:\s]*(\w+)/i,
      /subtipo[:\s]*(\w+)/i,
      /subtipo\s+(\w+)\s*(?:\(|—|–|-)/i,
    ];
    let dominantSubtype: string | null = null;
    for (const sp of subtypePatterns) {
      const sm = fullText.match(sp);
      if (sm) { dominantSubtype = sm[1]; break; }
    }

    // Extract wing
    const wingPatterns = [
      /[Aa]sa\s+(\d+)\s*\((\d+)w(\d+)\)/i,
      /(\d+)w(\d+)/i,
      /[Aa]sa\s+(\d+)/i,
    ];
    let wing: string | null = null;
    for (const wp of wingPatterns) {
      const wm = fullText.match(wp);
      if (wm) {
        if (wm[0].match(/\d+w\d+/)) {
          wing = wm[0].match(/\d+w\d+/)![0];
        } else {
          wing = `Asa ${wm[1]}`;
        }
        break;
      }
    }

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

    const { data, error } = await supabase.from("enneagram_results").insert([{
      user_id: user.id,
      type_1_name: type1Name,
      type_1_pct: type1Pct,
      type_2_name: type2Name,
      type_2_pct: type2Pct,
      type_3_name: type3Name,
      type_3_pct: type3Pct,
      dominant_subtype: dominantSubtype,
      conversation: JSON.parse(JSON.stringify(messages)) as Json,
      summary: lastAssistantMsg?.content || null,
    }]).select("id").single();

    setAutoSaved(true);
    if (!error && data?.id && onResultSaved) {
      onResultSaved(data.id);
    }
  };

  const resetInterview = () => {
    setMessages([]);
    setStarted(false);
    setInput("");
    setAutoSaved(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Check if the interview seems finished - require enough messages AND final result indicators
  const lastMsg = messages[messages.length - 1];
  const hasEnoughMessages = messages.filter(m => m.role === "user").length >= 10;
  const interviewDone =
    !isLoading &&
    hasEnoughMessages &&
    lastMsg?.role === "assistant" &&
    (
      // Must contain percentage-like result indicators
      (/Tipo\s+\d+.*\d+%/i.test(lastMsg.content) && lastMsg.content.toLowerCase().includes("tipo mais provável")) ||
      // Or explicit final analysis markers with percentages somewhere in conversation
      (lastMsg.content.toLowerCase().includes("análise final") && /\d+%/.test(lastMsg.content)) ||
      (lastMsg.content.toLowerCase().includes("resultado final") && /\d+%/.test(lastMsg.content))
    );

  // Auto-save when interview is done
  useEffect(() => {
    if (interviewDone && !autoSaved) {
      autoSaveResults();
    }
  }, [interviewDone, autoSaved]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          <h2 className="font-heading text-3xl font-semibold text-foreground mb-4">
            Pronto para se conhecer melhor?
          </h2>
          <p className="text-muted-foreground font-body leading-relaxed mb-8">
            A entrevista será conduzida por uma IA especializada em Eneagrama.
            Responda com sinceridade — não existem respostas certas ou erradas.
            A conversa dura entre 25 a 40 perguntas.
          </p>
          <Button variant="hero" size="lg" onClick={startInterview} className="px-10 py-6 text-lg rounded-xl">
            Iniciar Entrevista
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h2 className="font-heading text-xl font-semibold text-foreground">Entrevista de Eneagrama</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetInterview} className="gap-2 text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
            Recomeçar
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-card-foreground rounded-bl-md border border-border"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-stone max-w-none font-body [&_p]:my-1 [&_strong]:text-foreground [&_li]:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="font-body text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua resposta..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "48px";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <Button
            variant="hero"
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="rounded-xl h-12 w-12 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
