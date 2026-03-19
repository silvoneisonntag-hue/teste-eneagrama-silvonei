import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Json } from "@/integrations/supabase/types";
import { Send, RotateCcw, ArrowLeft, Info, Mic, MicOff, X, Settings, Save } from "lucide-react";
import InterviewProgress from "@/components/InterviewProgress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [micError, setMicError] = useState<"not-supported" | "not-allowed" | "iframe-blocked" | null>(null);
  const isInIframe = useRef(window !== window.top);
  const [restoredSession, setRestoredSession] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localSessionKey = user ? `interview_session_${user.id}` : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Persist conversation to DB + local backup ──
  const persistSession = useCallback(async (msgs: Message[], completed = false) => {
    if (!user || msgs.length === 0) return;

    const payload = JSON.parse(JSON.stringify(msgs)) as Json;
    const nowIso = new Date().toISOString();

    try {
      if (localSessionKey) {
        localStorage.setItem(localSessionKey, JSON.stringify({
          messages: msgs,
          is_completed: completed,
          updated_at: nowIso,
        }));
      }
    } catch (e) {
      console.error("Failed to save session locally:", e);
    }

    try {
      const { error } = await supabase
        .from("interview_sessions")
        .upsert(
          {
            user_id: user.id,
            messages: payload,
            is_completed: completed,
            updated_at: nowIso,
          },
          { onConflict: "user_id" },
        );

      if (error) {
        console.error("Failed to persist session:", error.message);
      }
    } catch (e) {
      console.error("Failed to persist session:", e);
    }
  }, [user, localSessionKey]);

  // Save session continuously while interview is in progress
  useEffect(() => {
    if (!started || !user || autoSaved || messages.length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistSession(messages);
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, started, user, autoSaved, persistSession]);

  // Flush latest state when tab/app is hidden or closed
  useEffect(() => {
    if (!started || !user || autoSaved) return;

    const flushSession = () => {
      if (messages.length > 0) {
        void persistSession(messages);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushSession();
    };

    window.addEventListener("pagehide", flushSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [messages, started, user, autoSaved, persistSession]);

  // ── Restore session on mount (local backup first, DB second) ──
  useEffect(() => {
    if (!user || restoredSession) return;

    const restore = async () => {
      let localCount = 0;

      try {
        if (localSessionKey) {
          const localRaw = localStorage.getItem(localSessionKey);
          if (localRaw) {
            const localData = JSON.parse(localRaw);
            if (!localData?.is_completed && Array.isArray(localData?.messages) && localData.messages.length > 0) {
              localCount = localData.messages.length;
              setMessages(localData.messages as Message[]);
              setStarted(true);
            }
          }
        }
      } catch (e) {
        console.error("Failed to restore local session:", e);
      }

      try {
        const { data, error } = await supabase
          .from("interview_sessions")
          .select("messages, is_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Failed to restore session from DB:", error.message);
        }

        if (data?.is_completed) {
          if (localSessionKey) localStorage.removeItem(localSessionKey);
        } else if (data && Array.isArray(data.messages) && (data.messages as any[]).length > 0) {
          const dbMessages = data.messages as Message[];
          if (dbMessages.length >= localCount) {
            setMessages(dbMessages);
            setStarted(true);
          }
        }
      } catch (e) {
        console.error("Failed to restore session from DB:", e);
      } finally {
        setRestoredSession(true);
      }
    };

    void restore();
  }, [user, restoredSession, localSessionKey]);

  // ── Clear session after result saved ──
  const clearSession = useCallback(async () => {
    if (!user) return;

    if (localSessionKey) {
      localStorage.removeItem(localSessionKey);
    }

    await supabase.from("interview_sessions").delete().eq("user_id", user.id);
  }, [user, localSessionKey]);

  const startInterview = async () => {
    setStarted(true);
    setIsLoading(true);

    const initialMessages: Message[] = [
      { role: "user", content: "Olá, gostaria de fazer o teste de Eneagrama." },
    ];
    setMessages(initialMessages);
    void persistSession(initialMessages);

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

    // Stop recording and clear transcript before sending
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    void persistSession(newMessages);
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

    // Parse the structured "Resumo executivo" section from the final report
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const reportText = lastAssistant?.content || fullText;

    // Structured format patterns (from Resumo executivo)
    const structuredPatterns = [
      /Tipo\s+mais\s+prov[áa]vel[:\s]*Tipo\s+(\d+)\s*[—–\-]\s*(.+?)\s*\((\d+)%\)/i,
      /Segundo\s+tipo\s+poss[íi]vel[:\s]*Tipo\s+(\d+)\s*[—–\-]\s*(.+?)\s*\((\d+)%\)/i,
      /Terceira\s+possibilidade[:\s]*Tipo\s+(\d+)\s*[—–\-]\s*(.+?)\s*\((\d+)%\)/i,
    ];

    let allMatches: { num: string; name: string; pct: number }[] = [];

    for (const sp of structuredPatterns) {
      const m = reportText.match(sp);
      if (m) {
        allMatches.push({ num: m[1], name: m[2].trim().replace(/\*+/g, ""), pct: parseInt(m[3]) });
      }
    }

    if (allMatches.length < 2) {
      allMatches = [];
      const genericPatterns = [
        /Tipo\s+(\d+)\s*[—–\-:]\s*(.+?)\s*\((\d+)%\)/gi,
        /\*{0,2}Tipo\s+(\d+)\s*[—–\-:]\s*(.+?)\*{0,2}\s*\((\d+)%\)/gi,
        /Tipo\s+(\d+)\s*\(([^)]+)\)\s*[—–\-:]\s*(\d+)%/gi,
        /Tipo\s+(\d+)\s*:\s*(\d+)%/gi,
      ];

      for (const pattern of genericPatterns) {
        const matches = [...reportText.matchAll(pattern)];
        if (matches.length > 0) {
          for (const m of matches) {
            if (pattern === genericPatterns[3]) {
              allMatches.push({ num: m[1], name: `Tipo ${m[1]}`, pct: parseInt(m[2]) });
            } else {
              allMatches.push({ num: m[1], name: m[2].trim().replace(/\*+/g, ""), pct: parseInt(m[3]) });
            }
          }
          break;
        }
      }
    }

    if (allMatches.length === 0) {
      const loosePct = /Tipo\s+(\d+)[^%\n]{0,80}?(\d{1,3})%/gi;
      const looseMatches = [...reportText.matchAll(loosePct)];
      for (const m of looseMatches) {
        const pct = parseInt(m[2]);
        if (pct > 0 && pct <= 100) {
          allMatches.push({ num: m[1], name: `Tipo ${m[1]}`, pct });
        }
      }
    }

    if (allMatches.length === 0 && lastAssistant) {
      const tipoNumPattern = /Tipo\s+(\d+)/gi;
      const tipoNums = [...lastAssistant.content.matchAll(tipoNumPattern)];
      const uniqueNums = [...new Set(tipoNums.map(m => m[1]))];
      if (uniqueNums.length > 0) {
        uniqueNums.forEach((num, i) => {
          const estimatedPct = Math.max(80 - i * 20, 10);
          allMatches.push({ num, name: `Tipo ${num}`, pct: estimatedPct });
        });
      }
    }

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

    // Extract subtypes
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

    // Extract additional fields
    const healthMatch = fullText.match(/n[íi]vel\s+(?:de\s+)?sa[úu]de[:\s]*(\d+)/i);
    const healthLevel = healthMatch ? parseInt(healthMatch[1]) : null;

    const integrationMatch = fullText.match(/integra[çc][ãa]o[^.]*?Tipo\s+(\d+)/i);
    const integrationDirection = integrationMatch ? `Tipo ${integrationMatch[1]}` : null;

    const disintegrationMatch = fullText.match(/(?:desintegra[çc][ãa]o|estresse)[^.]*?Tipo\s+(\d+)/i);
    const disintegrationDirection = disintegrationMatch ? `Tipo ${disintegrationMatch[1]}` : null;

    const tritypeMatch = fullText.match(/tritipo[:\s]*(\d[\s\-—–,]+\d[\s\-—–,]+\d)/i);
    const tritype = tritypeMatch ? tritypeMatch[1].replace(/[\s—–]+/g, "-") : null;

    const centerMatch = fullText.match(/centro\s+(?:dominante|principal)[:\s]*([\w\s]+?)(?:\.|,|\n)/i);
    const dominantCenter = centerMatch ? centerMatch[1].trim() : null;

    // Subtype percentages
    const preservMatch = fullText.match(/(?:preserva[çc][ãa]o|autopreserva[çc][ãa]o)[:\s]*(\d+)%/i);
    const socialMatch = fullText.match(/social[:\s]*(\d+)%/i);
    const sexualMatch = fullText.match(/sexual[:\s]*(\d+)%/i);

    const { data, error } = await supabase.from("enneagram_results").insert([{
      user_id: user.id,
      type_1_name: type1Name,
      type_1_pct: type1Pct,
      type_2_name: type2Name,
      type_2_pct: type2Pct,
      type_3_name: type3Name,
      type_3_pct: type3Pct,
      dominant_subtype: dominantSubtype,
      wing,
      health_level: healthLevel,
      integration_direction: integrationDirection,
      disintegration_direction: disintegrationDirection,
      tritype,
      dominant_center: dominantCenter,
      subtype_preservation: preservMatch ? parseInt(preservMatch[1]) : null,
      subtype_social: socialMatch ? parseInt(socialMatch[1]) : null,
      subtype_sexual: sexualMatch ? parseInt(sexualMatch[1]) : null,
      conversation: JSON.parse(JSON.stringify(messages)) as Json,
      summary: lastAssistant?.content || null,
    }]).select("id").single();

    setAutoSaved(true);
    // Mark session as completed and clean up
    await persistSession(messages, true);
    await clearSession();
    
    if (!error && data?.id && onResultSaved) {
      onResultSaved(data.id);
    }
  };

  // Manual save button handler
  const handleManualSave = async () => {
    if (autoSaved || manualSaving) return;
    setManualSaving(true);
    try {
      await autoSaveResults();
      toast.success("Resultado salvo com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar resultado");
    }
    setManualSaving(false);
  };

  const resetInterview = async () => {
    setMessages([]);
    setStarted(false);
    setInput("");
    setAutoSaved(false);
    await clearSession();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("not-supported");
      return;
    }

    // If currently recording, stop
    if (isRecording && recognitionRef.current) {
      setIsProcessingAudio(true);
      recognitionRef.current.stop();
      setIsRecording(false);
      setTimeout(() => setIsProcessingAudio(false), 800);
      return;
    }

    // Clear any previous error and try again immediately
    setMicError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      const errorCode = String(event.error || "unknown");
      console.error("Speech recognition error:", errorCode);

      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(errorCode)) {
        setMicError(isInIframe.current ? "iframe-blocked" : "not-allowed");
      } else if (["language-not-supported", "bad-grammar"].includes(errorCode)) {
        setMicError("not-supported");
      }

      setIsRecording(false);
      setIsProcessingAudio(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setTimeout(() => setIsProcessingAudio(false), 600);
    };

    try {
      recognition.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsRecording(false);
      setMicError("not-supported");
    }
  };

  // Detect current interview phase based on messages
  const userMsgCount = messages.filter(m => m.role === "user").length;
  const allText = messages.map(m => m.content).join("\n");

  const lastMsg = messages[messages.length - 1];
  const hasEnoughMessages = userMsgCount >= 20;
  
  // Interview done detection — adapted for new conversational format
  const interviewDone =
    !isLoading &&
    hasEnoughMessages &&
    lastMsg?.role === "assistant" &&
    (
      (/Tipo\s+\d+.*\d+%/i.test(lastMsg.content) && lastMsg.content.toLowerCase().includes("tipo mais provável")) ||
      (lastMsg.content.toLowerCase().includes("análise final") && /\d+%/.test(lastMsg.content)) ||
      (lastMsg.content.toLowerCase().includes("resultado final") && /\d+%/.test(lastMsg.content)) ||
      (/padr[ãa]o\s+psicol[óo]gico\s+central/i.test(lastMsg.content) && /\d+%/.test(lastMsg.content)) ||
      (/relat[óo]rio\s+de\s+perfil/i.test(lastMsg.content) && /\d+%/.test(lastMsg.content)) ||
      (/resumo\s+executivo/i.test(lastMsg.content) && /Tipo\s+\d+/i.test(lastMsg.content)) ||
      (lastMsg.content.length > 2000 && /Tipo\s+\d+/i.test(lastMsg.content) && /\d+%/.test(lastMsg.content) && /(motiva[çc][ãa]o|medo|asa|subtipo|integra[çc][ãa]o|padr[ãa]o|crescimento)/i.test(lastMsg.content))
    );

  // Show manual save button when interview seems advanced but not auto-detected as done
  const showManualSave = !autoSaved && !interviewDone && hasEnoughMessages && !isLoading && lastMsg?.role === "assistant" && 
    (/Tipo\s+\d+/i.test(lastMsg.content) && lastMsg.content.length > 800);

  // Phase detection based on message count (conversational flow)
  const currentPhase = interviewDone
    ? 4
    : userMsgCount >= 50
    ? 3
    : userMsgCount >= 30
    ? 2
    : userMsgCount >= 15
    ? 1
    : 0;

  // Auto-save when interview is done
  useEffect(() => {
    if (interviewDone && !autoSaved) {
      autoSaveResults();
    }
  }, [interviewDone, autoSaved]);

  if (!restoredSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm font-body text-muted-foreground">Restaurando sua conversa...</p>
      </div>
    );
  }

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
            Pronto para olhar para dentro?
          </h2>
          <p className="text-muted-foreground font-body leading-relaxed mb-8">
            Uma conversa tranquila e profunda, sem pressa e sem respostas certas.
            Responda com sinceridade — o mais importante é ser autêntico.
          </p>
          <Button variant="hero" size="lg" onClick={startInterview} className="px-10 py-6 text-lg rounded-2xl glow-warm">
            Iniciar Jornada
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
          {showManualSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={manualSaving}
              className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
            >
              <Save className="w-4 h-4" />
              {manualSaving ? "Salvando..." : "Salvar Resultado"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={resetInterview} className="gap-2 text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
            Recomeçar
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <InterviewProgress currentPhase={currentPhase} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Fixed disclaimer card */}
        <div className="rounded-xl border-2 border-primary/60 bg-primary/10 p-4 space-y-2">
          <p className="font-body text-xs font-bold text-primary flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Leia antes de começar
          </p>
          <p className="font-body text-xs text-foreground/80 leading-relaxed">
            Responda com <strong>honestidade e fidelidade à sua experiência real</strong> — não ao que gostaria de ser, mas ao que realmente acontece na sua vida.
          </p>
          <p className="font-body text-xs text-foreground/80 leading-relaxed">
            📌 Considere seus padrões <span className="text-primary font-semibold">desde os 18 anos até hoje</span>, tanto em situações <span className="text-primary font-semibold">pessoais</span> quanto <span className="text-primary font-semibold">profissionais</span>.
          </p>
        </div>

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

        {/* Auto-saved notification */}
        {autoSaved && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2">
              <p className="text-xs font-body text-primary font-semibold">✓ Resultado salvo automaticamente</p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mic permission help banner */}
      {micError && (
        <div className="border-t border-border px-4 py-3">
          <div className="max-w-3xl mx-auto rounded-xl bg-destructive/10 border border-destructive/30 p-3 relative">
            <button
              onClick={() => setMicError(null)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            {micError === "not-supported" ? (
              <div className="pr-6">
                <p className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-1">
                  <MicOff className="w-4 h-4" /> Navegador não suportado
                </p>
                <p className="text-xs text-muted-foreground">
                  Seu navegador não suporta reconhecimento de voz. Use <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
                </p>
              </div>
            ) : micError === "iframe-blocked" ? (
              <div className="pr-6">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                  <MicOff className="w-4 h-4" /> Microfone indisponível neste site
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  O microfone não pode ser usado quando o app está embutido em outro site. Para usar o recurso de voz:
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>Abra o teste diretamente em uma nova aba: <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 font-medium">Abrir em nova aba ↗</a></span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>Ou continue digitando suas respostas normalmente — o microfone é opcional!</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="pr-6">
                <p className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-2">
                  <MicOff className="w-4 h-4" /> Microfone bloqueado
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Para usar o recurso de voz, habilite o microfone:
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-start gap-1.5">
                    <Settings className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span><strong>Chrome/Edge:</strong> Toque no ícone de cadeado 🔒 ao lado da URL → Permissões → Microfone → Permitir</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Settings className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span><strong>Safari (iPhone):</strong> Toque em "aA" na barra de endereço → Configurações do Site → Microfone → Permitir</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Após habilitar, recarregue a página e tente novamente.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            variant={isRecording ? "destructive" : isProcessingAudio ? "secondary" : micError ? "outline" : "ghost"}
            size="icon"
            onClick={toggleRecording}
            disabled={isLoading || isProcessingAudio}
            className={`rounded-xl h-12 w-12 shrink-0 transition-all ${
              isRecording
                ? "animate-pulse"
                : isProcessingAudio
                ? "opacity-80"
                : micError
                ? "border-destructive/50 text-destructive"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={isRecording ? "Parar gravação" : isProcessingAudio ? "Processando áudio..." : micError ? "Ver instruções do microfone" : "Gravar áudio"}
          >
            {isProcessingAudio ? (
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
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
