import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { OverlayModals } from './components/OverlayModals';
import { TitleScreen } from './components/TitleScreen';
import { HorrorAdventureEngine } from './game/engine';
import { STAGES } from './game/level';
import { GamePhase, HudSnapshot } from './game/types';

const STORAGE_KEY = 'blackwood_completed_stages_v1';

const INITIAL_HUD: HudSnapshot = {
  hp: 5,
  maxHp: 5,
  oil: 100,
  maxOil: 100,
  pages: 0,
  totalPages: 4,
  enemiesBanished: 0,
  deaths: 0,
  elapsedSeconds: 0,
  stageIndex: 0,
  totalStages: STAGES.length,
  biome: STAGES[0].biome,
  chapterTitle: STAGES[0].title,
  chapterSubtitle: STAGES[0].subtitle,
  bossActive: false,
  bossName: 'O Carcereiro de Blackwood',
  bossHp: 24,
  bossMaxHp: 24,
  subtitleText: null,
  subtitleTitle: null,
  chapterBannerTimer: 0,
  checkpointNotice: null,
  exitPrompt: false,
  canHealPrompt: false,
  heartbeatDanger: false,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<HorrorAdventureEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [completedStages, setCompletedStages] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
    } catch {
      return [];
    }
  });
  const [showTouchControls, setShowTouchControls] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new HorrorAdventureEngine(
      canvas,
      (snapshot) => setHud(snapshot),
      (nextPhase) => setPhase(nextPhase),
      (clearedStageIndex) => {
        setCompletedStages((prev) => {
          if (prev.includes(clearedStageIndex)) return prev;
          const updated = [...prev, clearedStageIndex].sort((a, b) => a - b);
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage quota errors
          }
          return updated;
        });
      }
    );
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStart = useCallback(() => {
    engineRef.current?.startNewGame();
  }, []);

  const handleSelectStage = useCallback((stageIndex: number) => {
    engineRef.current?.startStage(stageIndex);
  }, []);

  const handleRestartStage = useCallback(() => {
    engineRef.current?.restartStage();
  }, []);

  const handleNextStage = useCallback(() => {
    engineRef.current?.nextStage();
  }, []);

  const handleToggleMute = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.sound.unlock();
    setMuted(engine.sound.toggleMute());
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handleRespawn = useCallback(() => {
    engineRef.current?.respawnAtLastCheckpoint();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handleTouchDir = useCallback((dir: 'left' | 'right', active: boolean) => {
    engineRef.current?.setTouchDirection(dir, active);
  }, []);

  const handleTouchAction = useCallback(
    (action: 'jump' | 'attack' | 'dash' | 'flare' | 'heal', pressed: boolean) => {
      engineRef.current?.triggerTouchAction(action, pressed);
    },
    []
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050608]">
      {/* Isolated 60fps Canvas Container — React HUD updates never re-render the canvas */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {phase === 'TITLE' && (
        <TitleScreen
          onStart={handleStart}
          onSelectStage={handleSelectStage}
          completedStages={completedStages}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {phase !== 'TITLE' && (
        <GameHud
          hud={hud}
          muted={muted}
          showTouchControls={showTouchControls}
          onToggleMute={handleToggleMute}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onPause={handlePause}
          onTouchDir={handleTouchDir}
          onTouchAction={handleTouchAction}
        />
      )}

      <OverlayModals
        phase={phase}
        hud={hud}
        onResume={handleResume}
        onRespawnCheckpoint={handleRespawn}
        onRestartStage={handleRestartStage}
        onRestartFromBeginning={handleStart}
        onNextStage={handleNextStage}
        onReturnToTitle={handleReturnToTitle}
      />
    </main>
  );
}
