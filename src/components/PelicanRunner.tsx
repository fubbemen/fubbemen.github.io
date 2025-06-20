
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface Obstacle {
  id: number;
  x: number;
  type: 'driftwood' | 'rock';
}

const PelicanRunner = () => {
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'ready'>('ready');
  const [score, setScore] = useState(0);
  const [pelicanY, setPelicanY] = useState(150);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameSpeed, setGameSpeed] = useState(4);
  
  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const lastObstacleRef = useRef(0);
  const velocityRef = useRef(0);
  const groundY = 200;
  const pelicanSize = 40;
  const obstacleWidth = 30;
  const obstacleHeight = 40;

  const jump = useCallback(() => {
    if (gameState !== 'playing') return;
    if (!isJumping) {
      setIsJumping(true);
      velocityRef.current = -15; // Increased from -12 to -15 for higher jumps
    }
  }, [gameState, isJumping]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setPelicanY(150);
    setObstacles([]);
    setIsJumping(false);
    setGameSpeed(4);
    velocityRef.current = 0;
    lastObstacleRef.current = 0;
  };

  const gameOver = () => {
    setGameState('gameOver');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  };

  // Game physics and collision detection
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Update pelican physics
    if (isJumping) {
      velocityRef.current += 0.8; // gravity
      setPelicanY(prev => {
        const newY = prev + velocityRef.current;
        if (newY >= 150) { // ground level
          setIsJumping(false);
          velocityRef.current = 0;
          return 150;
        }
        return newY;
      });
    }

    // Update obstacles
    setObstacles(prev => {
      const updated = prev
        .map(obstacle => ({ ...obstacle, x: obstacle.x - gameSpeed }))
        .filter(obstacle => obstacle.x > -obstacleWidth);
      
      // Spawn new obstacles
      const now = Date.now();
      if (now - lastObstacleRef.current > 1500 + Math.random() * 1000) {
        const newObstacle: Obstacle = {
          id: obstacleIdRef.current++,
          x: 800,
          type: Math.random() > 0.5 ? 'driftwood' : 'rock'
        };
        updated.push(newObstacle);
        lastObstacleRef.current = now;
      }

      // Check collisions
      const pelicanLeft = 100;
      const pelicanRight = pelicanLeft + pelicanSize;
      const pelicanTop = pelicanY;
      const pelicanBottom = pelicanY + pelicanSize;

      for (const obstacle of updated) {
        if (
          obstacle.x < pelicanRight &&
          obstacle.x + obstacleWidth > pelicanLeft &&
          groundY - obstacleHeight < pelicanBottom &&
          groundY > pelicanTop
        ) {
          gameOver();
          return prev;
        }
      }

      return updated;
    });

    // Update score and speed
    setScore(prev => prev + 1);
    setGameSpeed(prev => Math.min(prev + 0.005, 8));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isJumping, pelicanY, gameSpeed]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'ready') {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump, gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-200 to-amber-100 p-4">
      <div className="relative w-full max-w-4xl">
        {/* Score Display */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 font-mono text-xl font-bold">
            Score: {Math.floor(score / 10)}
          </div>
        </div>

        {/* Game Canvas */}
        <div 
          className="relative w-full h-96 bg-gradient-to-b from-sky-300 to-amber-200 border-4 border-slate-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => gameState === 'ready' ? startGame() : jump()}
        >
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-24 bg-amber-300 border-t-4 border-amber-600">
            {/* Ground pattern */}
            <div className="w-full h-full opacity-20 bg-repeat-x" 
                 style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #d97706 20px, #d97706 22px)'}}>
            </div>
          </div>

          {/* Pelican */}
          <div
            className="absolute transition-none duration-0"
            style={{
              left: '100px',
              bottom: `${240 - pelicanY}px`,
              transform: isJumping ? 'rotate(-10deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="relative">
              {/* Pelican body */}
              <div className="w-10 h-8 bg-white border-2 border-slate-800 rounded-full relative">
                {/* Wing */}
                <div className="absolute -top-1 right-1 w-6 h-4 bg-gray-300 border border-slate-800 rounded-full"></div>
                {/* Eye */}
                <div className="absolute top-1 right-2 w-2 h-2 bg-black rounded-full"></div>
              </div>
              {/* Beak */}
              <div className="absolute top-2 -right-3 w-6 h-3 bg-orange-400 border border-slate-800 rounded-r-full"></div>
              {/* Legs */}
              <div className="absolute -bottom-2 left-2 w-1 h-3 bg-orange-400"></div>
              <div className="absolute -bottom-2 left-4 w-1 h-3 bg-orange-400"></div>
            </div>
          </div>

          {/* Obstacles */}
          {obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className="absolute bottom-24"
              style={{ left: `${obstacle.x}px` }}
            >
              {obstacle.type === 'driftwood' ? (
                <div className="w-8 h-10 bg-amber-800 border-2 border-amber-900 rounded-sm">
                  <div className="w-full h-2 bg-amber-700 mt-2"></div>
                  <div className="w-full h-2 bg-amber-700 mt-2"></div>
                </div>
              ) : (
                <div className="w-7 h-10 bg-gray-600 border-2 border-gray-800 rounded-t-full rounded-b-sm">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mt-1 ml-1"></div>
                </div>
              )}
            </div>
          ))}

          {/* Game States Overlay */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-8">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">🦅 Pelican Run</h1>
                <p className="text-lg text-slate-600 mb-6">Press SPACEBAR or CLICK to jump!</p>
                <Button onClick={startGame} size="lg" className="text-xl px-8 py-4">
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Game Over!</h2>
                <p className="text-xl text-slate-600 mb-2">Final Score: {Math.floor(score / 10)}</p>
                <p className="text-lg text-slate-500 mb-6">The pelican hit an obstacle!</p>
                <Button onClick={startGame} size="lg" className="text-xl px-8 py-4">
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-slate-600">
          <p className="text-lg">Use <span className="font-mono bg-slate-200 px-2 py-1 rounded">SPACEBAR</span> or <span className="font-mono bg-slate-200 px-2 py-1 rounded">CLICK</span> to make the pelican jump!</p>
          <p className="text-sm mt-2">Avoid the driftwood and rocks to keep running!</p>
        </div>
      </div>
    </div>
  );
};

export default PelicanRunner;
