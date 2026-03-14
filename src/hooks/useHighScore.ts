
import { useState, useEffect, useCallback } from 'react';

const HIGH_SCORE_KEY = 'space_runner_high_score';
const FURTHEST_DISTANCE_KEY = 'space_runner_furthest_distance';

export const useHighScore = () => {
  const [highScore, setHighScore] = useState<number>(0);
  const [furthestDistance, setFurthestDistance] = useState<number>(0);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    
    const savedFurthestDistance = localStorage.getItem(FURTHEST_DISTANCE_KEY);
    if (savedFurthestDistance) {
      setFurthestDistance(parseFloat(savedFurthestDistance));
    }
  }, []);

  // Update high score if current score is higher
  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
      return true; // Indicates a new high score was set
    }
    return false;
  }, [highScore]);

  // Update furthest distance if current distance is higher
  const updateFurthestDistance = useCallback((newDistance: number) => {
    if (newDistance > furthestDistance) {
      setFurthestDistance(newDistance);
      localStorage.setItem(FURTHEST_DISTANCE_KEY, newDistance.toString());
      return true; // Indicates a new furthest distance was set
    }
    return false;
  }, [furthestDistance]);

  // Reset all saved data (for testing or settings)
  const resetAllData = useCallback(() => {
    setHighScore(0);
    setFurthestDistance(0);
    localStorage.removeItem(HIGH_SCORE_KEY);
    localStorage.removeItem(FURTHEST_DISTANCE_KEY);
  }, []);

  return {
    highScore,
    furthestDistance,
    updateHighScore,
    updateFurthestDistance,
    resetAllData,
  };
};
