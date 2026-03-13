import { Check } from "lucide-react";

const PHASES = [
  { key: "exploracao", label: "Exploração", short: "Explor." },
  { key: "questionario-tipo", label: "Tipo", short: "Tipo" },
  { key: "questionario-instinto", label: "Instinto", short: "Inst." },
  { key: "confirmacao", label: "Confirmação", short: "Conf." },
  { key: "resultado", label: "Resultado", short: "Result." },
] as const;

interface InterviewProgressProps {
  currentPhase: number; // 0-4
}

const InterviewProgress = ({ currentPhase }: InterviewProgressProps) => {
  const progress = ((currentPhase) / (PHASES.length - 1)) * 100;

  return (
    <div className="px-3 sm:px-4 py-2 border-b border-border/50 bg-background/50 backdrop-blur-sm">
      {/* Progress bar track */}
      <div className="relative h-1 rounded-full bg-muted mb-1.5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        {/* Phase dots on the track */}
        {PHASES.map((_, i) => {
          const left = (i / (PHASES.length - 1)) * 100;
          const isCompleted = i < currentPhase;
          const isCurrent = i === currentPhase;
          return (
            <div
              key={i}
              className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                isCompleted
                  ? "bg-primary border-primary"
                  : isCurrent
                  ? "bg-primary/30 border-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                  : "bg-muted border-border"
              }`}
              style={{ left: `${left}%`, transform: "translate(-50%, -50%)" }}
            >
              {isCompleted && <Check className="w-1.5 h-1.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {PHASES.map((phase, i) => {
          const isCurrent = i === currentPhase;
          const isCompleted = i < currentPhase;
          return (
            <span
              key={phase.key}
              className={`text-[9px] sm:text-[10px] font-medium transition-colors text-center ${
                isCurrent
                  ? "text-primary font-bold"
                  : isCompleted
                  ? "text-foreground/70"
                  : "text-muted-foreground/50"
              }`}
              style={{ width: `${100 / PHASES.length}%` }}
            >
              <span className="hidden sm:inline">{phase.label}</span>
              <span className="sm:hidden">{phase.short}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewProgress;
