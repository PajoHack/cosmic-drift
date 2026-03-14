import React, { useState, useEffect } from 'react';

const StageClearOverlayDemo: React.FC = () => {
  const [gameStage, setGameStage] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'stageClear' | 'playing'>('stageClear');

  useEffect(() => {
    if (phase !== 'stageClear') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStage(stage => stage + 1);
          setPhase('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
      {phase === 'stageClear' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0 10px black',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          STAGE {gameStage} CLEARED
          <div style={{ fontSize: '20px', marginTop: 10 }}>
            Next wave in {countdown}...
          </div>
        </div>
      )}
      {phase === 'playing' && (
        <div
          style={{
            color: 'lime',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          Phase transitioned to <strong>playing</strong>
        </div>
      )}
    </div>
  );
};

export default StageClearOverlayDemo;
