import { Check } from "lucide-react";

const PHASES = [
  { key: "exploracao", label: "Exploração" },
  { key: "questionario-tipo", label: "Tipo" },
  { key: "questionario-instinto", label: "Instinto" },
  { key: "confirmacao", label: "Confirmação" },
  { key: "resultado", label: "Resultado" },
] as const;

interface InterviewProgressProps {
  currentPhase: number; // 0-4
}

const InterviewProgress = ({ currentPhase }: InterviewProgressProps) => {
  return (
    <div className="flex items-center gap-1 px-4 py-2.5 bg-muted/40 border-b border-border overflow-x-auto">
      {PHASES.map((phase, i) => {
        const isCompleted = i < currentPhase;
        const isCurrent = i === currentPhase;

        return (
          <div key={phase.key} className="flex items-center min-w-0">
            {i > 0 && (
              <div
                className={`w-4 sm:w-6 h-0.5 shrink-0 transition-colors ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {phase.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InterviewProgress;
