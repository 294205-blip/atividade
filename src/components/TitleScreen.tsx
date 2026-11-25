import { Check, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { STAGES } from '../game/level';

interface TitleScreenProps {
  onStart: () => void;
  onSelectStage: (stageIndex: number) => void;
  completedStages: number[];
  muted: boolean;
  onToggleMute: () => void;
}

const EMBERS = [
  { left: '54%', bottom: '28%', dur: '6.5s', delay: '0s' },
  { left: '58%', bottom: '22%', dur: '8.2s', delay: '1.4s' },
  { left: '62%', bottom: '32%', dur: '7.1s', delay: '2.6s' },
  { left: '48%', bottom: '18%', dur: '9.0s', delay: '0.7s' },
  { left: '70%', bottom: '24%', dur: '6.8s', delay: '3.1s' },
];

export function TitleScreen({
  onStart,
  onSelectStage,
  completedStages,
  muted,
  onToggleMute,
}: TitleScreenProps) {
  const [imgError, setImgError] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showStageSelect) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setShowStageSelect(false);
        }
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart, showStageSelect]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050608] text-slate-100">
      {/* Key-Art Backdrop with Slow Atmospheric Pan */}
      {!imgError ? (
        <img
          src="/src/assets/images/title_horror_realistic_1795544065101.jpg"
          alt="Investigador sob chuva noturna diante dos portões de ferro do Sanatório Blackwood"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center animate-ken-burns opacity-95"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#06090e] via-[#101c22] to-[#050608]"
        />
      )}

      {/* Drifting Amber Lantern Embers */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {EMBERS.map((emb, idx) => (
          <span
            key={idx}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-ember"
            style={
              {
                left: emb.left,
                bottom: emb.bottom,
                '--ember-dur': emb.dur,
                '--ember-delay': emb.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Measured Scrim for 4.5:1+ Contrast on the Calm Left Third */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#040508]/95 via-[#05070b]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#040508]/90 via-transparent to-[#040508]/45"
      />

      {/* Top-Right Audio Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Ativar som' : 'Silenciar som'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-700/70 bg-[#0b0e14]/85 text-slate-200 hover:text-amber-300 hover:border-amber-500/60 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero Title Lockup & Start CTA */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 md:py-12 max-w-2xl">
        <div className="my-auto space-y-6">
          {/* Bespoke SVG Lantern-Keyhole Emblem */}
          <div className="flex items-center gap-4">
            <svg
              width="52"
              height="52"
              viewBox="0 0 56 56"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="28" cy="28" r="26" stroke="#334155" strokeWidth="1.2" />
              <path
                d="M28 9L34 17H22L28 9Z"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <rect
                x="20"
                y="17"
                width="16"
                height="20"
                rx="2"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <path
                d="M28 22C29.8 24.8 31 27 31 29.2C31 31 29.6 32.5 28 32.5C26.4 32.5 25 31 25 29.2C25 27 26.2 24.8 28 22Z"
                fill="#fbbf24"
              />
              <path d="M18 37H38L35 44H21L18 37Z" stroke="#94a3b8" strokeWidth="1.3" />
            </svg>
            <div className="text-xs tracking-[0.18em] uppercase text-amber-400/90 font-medium">
              Aventura de Terror 2D · {STAGES.length} Fases
            </div>
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-50 leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            Sussurros de Blackwood
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-md">
            Atravesse a floresta enevoada, a capela em ruínas, o sanatório, a mansão do diretor e
            os dutos submersos até enfrentar o Carcereiro antes que sua lanterna se apague.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="min-h-[44px] px-8 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-slate-950 font-semibold text-base tracking-wide transition-all shadow-lg shadow-amber-950/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 whitespace-nowrap"
            >
              Iniciar Aventura
            </button>
            <button
              type="button"
              onClick={() => setShowStageSelect(true)}
              className="min-h-[44px] px-6 py-3 rounded-lg border border-slate-700/80 hover:border-amber-500/60 bg-[#0b0e14]/85 text-slate-200 hover:text-amber-200 font-medium text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap"
            >
              Selecionar Fase ({STAGES.length})
            </button>
          </div>
        </div>

        {/* Single Flat Control-Hint Line */}
        <p className="text-xs text-slate-300 tracking-wide leading-relaxed">
          <strong className="font-mono-hud text-amber-300">A / D</strong> ou{' '}
          <strong className="font-mono-hud text-amber-300">◄ / ►</strong> Mover ·{' '}
          <strong className="font-mono-hud text-amber-300">Espaço / W</strong> Pular ·{' '}
          <strong className="font-mono-hud text-amber-300">J / Z</strong> Golpear ·{' '}
          <strong className="font-mono-hud text-amber-300">K / X</strong> Clarão ·{' '}
          <strong className="font-mono-hud text-amber-300">Shift</strong> Esquivar ·{' '}
          <strong className="font-mono-hud text-amber-300">E</strong> Curar ·{' '}
          <strong className="font-mono-hud text-amber-300">Esc</strong> Pausar
        </p>
      </div>

      {/* Stage Selector Modal */}
      {showStageSelect && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040508]/85 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#0b0e14] p-6 text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <p className="text-xs text-amber-400/90 uppercase tracking-[0.14em] font-medium">
                  Capítulos da Investigação
                </p>
                <h2 className="font-display text-2xl font-bold text-slate-50 mt-1">
                  Selecionar Fase
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowStageSelect(false)}
                aria-label="Fechar seleção de fase"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
              {STAGES.map((stage) => {
                const cleared = completedStages.includes(stage.index);
                return (
                  <button
                    key={stage.index}
                    type="button"
                    onClick={() => {
                      setShowStageSelect(false);
                      onSelectStage(stage.index);
                    }}
                    className="text-left p-4 rounded-lg border border-slate-800 hover:border-amber-500/70 bg-[#07090e] hover:bg-[#10141d] transition-colors cursor-pointer flex flex-col justify-between gap-2 min-h-[104px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-base font-semibold text-slate-100 leading-snug">
                        {stage.title}
                      </span>
                      {cleared && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          Concluída
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{stage.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
