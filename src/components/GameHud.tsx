import { Gamepad2, Pause, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchControls: boolean;
  onToggleMute: () => void;
  onToggleTouchControls: () => void;
  onPause: () => void;
  onTouchDir: (dir: 'left' | 'right', active: boolean) => void;
  onTouchAction: (action: 'jump' | 'attack' | 'dash' | 'flare' | 'heal', pressed: boolean) => void;
}

export function GameHud({
  hud,
  muted,
  showTouchControls,
  onToggleMute,
  onToggleTouchControls,
  onPause,
  onTouchDir,
  onTouchAction,
}: GameHudProps) {
  const oilPct = Math.max(0, Math.min(100, Math.round((hud.oil / hud.maxOil) * 100)));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-5 z-10">
      {/* Top Perimeter Status Clusters (Zero backdrop-filter over canvas, >= 85% unobstructed playfield) */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Vitality Diamonds, Lantern Oil & Diary Pages */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {/* Custom SVG Diamond Hearts */}
            <div className="flex items-center gap-1.5" aria-label={`Vitalidade ${hud.hp} de ${hud.maxHp}`}>
              {Array.from({ length: hud.maxHp }).map((_, idx) => {
                const filled = idx < hud.hp;
                return (
                  <svg key={idx} width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
                    <path
                      d="M9 1L16.5 10L9 19L1.5 10L9 1Z"
                      fill={filled ? (hud.hp <= 1 ? '#ef4444' : '#dc2626') : '#11151d'}
                      stroke={filled ? '#fca5a5' : '#475569'}
                      strokeWidth="1.4"
                    />
                  </svg>
                );
              })}
            </div>

            <span className="font-mono-hud text-xs text-slate-300">
              {hud.hp}/{hud.maxHp}
            </span>
          </div>

          {/* Lantern Oil Bar + Diary Pages */}
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-amber-400/90 font-medium">Lanterna</span>
              <div className="w-24 h-2 bg-[#0b0e14]/90 border border-slate-700/80 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-transform duration-100 origin-left"
                  style={{ transform: `scaleX(${oilPct / 100})` }}
                />
              </div>
              <span className="font-mono-hud text-[11px] text-amber-300/90">∞ Infinita</span>
            </div>

            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Páginas</span>
              <span className="font-mono-hud text-slate-100">
                {hud.pages}/{hud.totalPages}
              </span>
            </div>

            {hud.canHealPrompt && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-amber-300 font-medium">[E] Curar</span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right: Chapter Title + Interactive Utility Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex flex-col items-end text-right mr-1">
            <span className="text-xs font-medium text-slate-200 tracking-wide">
              {hud.chapterTitle}
            </span>
            <span className="font-mono-hud text-[11px] text-slate-400">
              {Math.floor(hud.elapsedSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :
              {(hud.elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTouchControls}
            aria-label={showTouchControls ? 'Ocultar controles na tela' : 'Mostrar controles na tela'}
            title="Controles na Tela"
            className={`pointer-events-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              showTouchControls
                ? 'border-amber-500/70 bg-amber-950/60 text-amber-300'
                : 'border-slate-700/70 bg-[#0b0e14]/85 text-slate-300 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Ativar som' : 'Silenciar som'}
            className="pointer-events-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-700/70 bg-[#0b0e14]/85 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pausar jogo"
            className="pointer-events-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-700/70 bg-[#0b0e14]/85 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Notices: Boss Bar / Chapter Intro / Checkpoint */}
      <div className="flex flex-col items-center justify-center gap-3 my-auto">
        {hud.bossActive && (
          <div className="w-full max-w-md px-4 flex flex-col items-center gap-1.5 -mt-44 sm:-mt-56">
            <div className="w-full flex items-center justify-between text-xs">
              <span className="font-display text-red-300 tracking-wider uppercase">
                {hud.bossName}
              </span>
              <span className="font-mono-hud text-red-200">
                {hud.bossHp}/{hud.bossMaxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#090507]/90 border border-red-900/80 rounded-sm overflow-hidden">
              <div
                className="h-full bg-red-600 transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${Math.max(0, hud.bossHp / hud.bossMaxHp)})` }}
              />
            </div>
          </div>
        )}

        {hud.chapterBannerTimer > 0 && (
          <div className="text-center px-6 py-3 bg-[#05070b]/80 border-y border-slate-700/60 transition-opacity duration-200">
            <p className="font-display text-xl sm:text-2xl text-amber-200 tracking-wide">
              {hud.chapterTitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">{hud.chapterSubtitle}</p>
          </div>
        )}

        {hud.checkpointNotice && (
          <div className="px-4 py-1.5 bg-[#0b0e14]/85 border border-amber-500/40 text-amber-300 text-xs font-medium tracking-wide">
            {hud.checkpointNotice}
          </div>
        )}

        {hud.exitPrompt && !hud.subtitleText && (
          <div className="px-4 py-1.5 bg-[#0b0e14]/85 border border-amber-400/50 text-amber-200 text-xs font-medium">
            {hud.stageIndex < hud.totalStages - 1
              ? 'Portão para a próxima fase à frente'
              : 'Portão da Alvorada destrancado à frente'}
          </div>
        )}
      </div>

      {/* Bottom Area: Cinematic Subtitles & Play Store Virtual Touch Controls */}
      <div className="flex flex-col gap-3">
        {hud.subtitleText && (
          <div className="mx-auto max-w-2xl text-center px-5 py-2.5 bg-[#050609]/90 border border-slate-800/80 rounded-md">
            {hud.subtitleTitle && (
              <div className="text-[11px] uppercase tracking-[0.14em] text-amber-400 font-semibold mb-0.5">
                {hud.subtitleTitle}
              </div>
            )}
            <p className="text-sm text-slate-100 leading-snug">{hud.subtitleText}</p>
          </div>
        )}

        {showTouchControls ? (
          <div className="flex items-end justify-between gap-4 pt-1">
            {/* Left / Right Virtual D-Pad with Key Indicators */}
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                aria-label="Mover para esquerda (Tecla A ou Seta Esquerda)"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onTouchDir('left', true);
                }}
                onPointerUp={() => onTouchDir('left', false)}
                onPointerCancel={() => onTouchDir('left', false)}
                className="w-14 h-14 rounded-full border border-slate-600/75 bg-[#0b0e14]/80 active:bg-slate-700/75 text-slate-100 flex flex-col items-center justify-center leading-none touch-none"
              >
                <span className="text-base font-bold">◀</span>
                <span className="font-mono-hud text-[10px] text-slate-400 mt-0.5">A / ◄</span>
              </button>
              <button
                type="button"
                aria-label="Mover para direita (Tecla D ou Seta Direita)"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onTouchDir('right', true);
                }}
                onPointerUp={() => onTouchDir('right', false)}
                onPointerCancel={() => onTouchDir('right', false)}
                className="w-14 h-14 rounded-full border border-slate-600/75 bg-[#0b0e14]/80 active:bg-slate-700/75 text-slate-100 flex flex-col items-center justify-center leading-none touch-none"
              >
                <span className="text-base font-bold">▶</span>
                <span className="font-mono-hud text-[10px] text-slate-400 mt-0.5">D / ►</span>
              </button>
            </div>

            {/* Right Action Cluster with Key Indicators */}
            <div className="pointer-events-auto flex items-end gap-2 sm:gap-2.5">
              {hud.canHealPrompt && (
                <button
                  type="button"
                  aria-label="Curar com óleo (Tecla E)"
                  onPointerDown={() => onTouchAction('heal', true)}
                  className="w-13 h-13 rounded-full border border-emerald-500/70 bg-emerald-950/80 active:bg-emerald-800/80 text-emerald-100 flex flex-col items-center justify-center leading-tight touch-none"
                >
                  <span className="text-[11px] font-semibold">Curar</span>
                  <span className="font-mono-hud text-[10px] text-emerald-300">E</span>
                </button>
              )}
              <button
                type="button"
                aria-label="Esquivar (Tecla Shift)"
                onPointerDown={() => onTouchAction('dash', true)}
                className="w-13 h-13 rounded-full border border-slate-500/70 bg-[#0b0e14]/80 active:bg-slate-700/80 text-slate-100 flex flex-col items-center justify-center leading-tight touch-none"
              >
                <span className="text-[11px] font-semibold">Esquiva</span>
                <span className="font-mono-hud text-[10px] text-slate-400">Shift</span>
              </button>
              <button
                type="button"
                aria-label="Clarão da Lanterna (Tecla K)"
                onPointerDown={() => onTouchAction('flare', true)}
                className="w-14 h-14 rounded-full border border-amber-500/70 bg-amber-950/80 active:bg-amber-800/80 text-amber-100 flex flex-col items-center justify-center leading-tight touch-none"
              >
                <span className="text-[11px] font-semibold">Clarão</span>
                <span className="font-mono-hud text-[10px] text-amber-300">K</span>
              </button>
              <button
                type="button"
                aria-label="Golpear (Tecla J)"
                onPointerDown={() => onTouchAction('attack', true)}
                className="w-14 h-14 rounded-full border border-red-500/70 bg-red-950/80 active:bg-red-800/80 text-red-100 flex flex-col items-center justify-center leading-tight touch-none"
              >
                <span className="text-[11px] font-semibold">Golpe</span>
                <span className="font-mono-hud text-[10px] text-red-300">J</span>
              </button>
              <button
                type="button"
                aria-label="Pular (Tecla Espaço)"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onTouchAction('jump', true);
                }}
                onPointerUp={() => onTouchAction('jump', false)}
                onPointerCancel={() => onTouchAction('jump', false)}
                className="w-16 h-16 rounded-full border border-slate-400/80 bg-slate-800/85 active:bg-slate-600/85 text-white flex flex-col items-center justify-center leading-tight touch-none"
              >
                <span className="text-xs font-bold">Pular</span>
                <span className="font-mono-hud text-[10px] text-slate-300">Espaço</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-1.5 bg-[#050609]/75 border border-slate-800/70 rounded-md text-[11px] text-slate-300">
            <span>
              <strong className="font-mono-hud text-amber-300">A / D</strong> ou{' '}
              <strong className="font-mono-hud text-amber-300">◄ / ►</strong> Mover
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-hud text-amber-300">Espaço / W</strong> Pular
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-hud text-amber-300">J / Z</strong> Golpear
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-hud text-amber-300">K / X</strong> Clarão
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-hud text-amber-300">Shift</strong> Esquivar
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-hud text-amber-300">E</strong> Curar
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              <strong className="font-mono-hud text-amber-300">Esc</strong> Pausar
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
