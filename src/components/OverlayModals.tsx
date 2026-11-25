import { STAGES } from '../game/level';
import { GamePhase, HudSnapshot } from '../game/types';

interface OverlayModalsProps {
  phase: GamePhase;
  hud: HudSnapshot;
  onResume: () => void;
  onRespawnCheckpoint: () => void;
  onRestartStage: () => void;
  onRestartFromBeginning: () => void;
  onNextStage: () => void;
  onReturnToTitle: () => void;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function OverlayModals({
  phase,
  hud,
  onResume,
  onRespawnCheckpoint,
  onRestartStage,
  onRestartFromBeginning,
  onNextStage,
  onReturnToTitle,
}: OverlayModalsProps) {
  if (
    phase !== 'PAUSED' &&
    phase !== 'STAGE_CLEAR' &&
    phase !== 'GAME_OVER' &&
    phase !== 'VICTORY'
  ) {
    return null;
  }

  const nextStageMeta = STAGES[hud.stageIndex + 1];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040508]/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0b0e14] p-7 text-slate-100 shadow-2xl">
        {phase === 'PAUSED' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-amber-400/90 uppercase tracking-[0.14em] font-medium">
                {hud.chapterTitle}
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-50 mt-1">
                Jogo Pausado
              </h2>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Comandos do Teclado
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mover</span>
                  <span className="font-mono-hud text-amber-300">A / D · ◄ / ►</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pular (2x)</span>
                  <span className="font-mono-hud text-amber-300">Espaço / W</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Golpear</span>
                  <span className="font-mono-hud text-amber-300">J / Z</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clarão</span>
                  <span className="font-mono-hud text-amber-300">K / X</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Esquivar</span>
                  <span className="font-mono-hud text-amber-300">Shift</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Curar</span>
                  <span className="font-mono-hud text-amber-300">E</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={onRestartStage}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900/70 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Reiniciar Fase
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 px-4 rounded-lg text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Voltar à Tela Inicial
              </button>
            </div>
          </div>
        )}

        {phase === 'STAGE_CLEAR' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-[0.14em] font-medium">
                Fase {hud.stageIndex + 1} de {hud.totalStages} Concluída
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 mt-1">
                Deseja continuar?
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Você concluiu <strong className="text-slate-100">{hud.chapterTitle}</strong>.{' '}
                {nextStageMeta
                  ? `Deseja avançar agora para ${nextStageMeta.title}?`
                  : 'Deseja avançar para a próxima fase?'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-y border-slate-800 py-4 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Tempo</div>
                <div className="font-mono-hud text-base font-semibold text-slate-100 mt-0.5">
                  {formatDuration(hud.elapsedSeconds)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Páginas</div>
                <div className="font-mono-hud text-base font-semibold text-amber-300 mt-0.5">
                  {hud.pages}/{hud.totalPages}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Banidos</div>
                <div className="font-mono-hud text-base font-semibold text-slate-100 mt-0.5">
                  {hud.enemiesBanished}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onNextStage}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Sim, Continuar (Fase {hud.stageIndex + 2})
              </button>
              <button
                type="button"
                onClick={onRestartStage}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900/70 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Repetir Esta Fase
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 px-4 rounded-lg text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Não, Voltar à Tela Inicial
              </button>
            </div>
          </div>
        )}

        {phase === 'GAME_OVER' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-red-400 uppercase tracking-[0.14em] font-medium">
                Sua lanterna se apagou
              </p>
              <h2 className="font-display text-3xl font-bold text-slate-50 mt-1">
                Fim da Vigília
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                As sombras de Blackwood reclamaram mais um investigador. Reacenda sua chama no último santuário.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-y border-slate-800 py-4 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Tempo</div>
                <div className="font-mono-hud text-base font-semibold text-slate-100 mt-0.5">
                  {formatDuration(hud.elapsedSeconds)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Páginas</div>
                <div className="font-mono-hud text-base font-semibold text-slate-100 mt-0.5">
                  {hud.pages}/{hud.totalPages}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Banidos</div>
                <div className="font-mono-hud text-base font-semibold text-slate-100 mt-0.5">
                  {hud.enemiesBanished}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRespawnCheckpoint}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Retornar à Última Vela
              </button>
              <button
                type="button"
                onClick={onRestartStage}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900/70 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Reiniciar Fase
              </button>
            </div>
          </div>
        )}

        {phase === 'VICTORY' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-[0.14em] font-medium">
                Última Fase Concluída · Alvorada Alcançada
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 mt-1">
                Deseja voltar do início do jogo?
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                O Carcereiro foi banido e você concluiu todas as {hud.totalStages} fases de
                Blackwood. Deseja recomeçar a aventura desde a Fase 1?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-slate-800 py-4">
              <div>
                <div className="text-xs text-slate-400">Tempo na Fase</div>
                <div className="font-mono-hud text-lg font-semibold text-slate-100 mt-0.5">
                  {formatDuration(hud.elapsedSeconds)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Páginas do Diário</div>
                <div className="font-mono-hud text-lg font-semibold text-amber-300 mt-0.5">
                  {hud.pages}/{hud.totalPages}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Aparições Banidas</div>
                <div className="font-mono-hud text-lg font-semibold text-slate-100 mt-0.5">
                  {hud.enemiesBanished}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Quedas</div>
                <div className="font-mono-hud text-lg font-semibold text-slate-100 mt-0.5">
                  {hud.deaths}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRestartFromBeginning}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Sim, Voltar do Início (Fase 1)
              </button>
              <button
                type="button"
                onClick={onRestartStage}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900/70 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Repetir Última Fase
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 px-4 rounded-lg text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Não, Voltar à Tela Inicial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
