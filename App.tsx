import React, { useState, useEffect, useRef } from 'react';
import { IntervalItem, IntervalType, AppMode, COLORS } from './types';
import TimerDisplay from './components/TimerDisplay';
import IntervalEditor from './components/IntervalEditor';
import AiGenerator from './components/AiGenerator';
import { Timer, List } from 'lucide-react';
import { playCountdown, playTransition, ensureAudioContext } from './services/audioService';

// Default initial state
const DEFAULT_INTERVALS: IntervalItem[] = [
  { id: '1', duration: 30, type: IntervalType.WORK, name: 'Work', color: COLORS[IntervalType.WORK] },
  { id: '2', duration: 10, type: IntervalType.REST, name: 'Rest', color: COLORS[IntervalType.REST] },
  { id: '3', duration: 10, type: IntervalType.WORK, name: 'Work', color: COLORS[IntervalType.WORK] },
  { id: '4', duration: 20, type: IntervalType.COOLDOWN, name: 'Cool', color: COLORS[IntervalType.COOLDOWN] },
];

const App: React.FC = () => {
  // App Mode State
  const [mode, setMode] = useState<AppMode>(AppMode.TIMER);
  const [showAiModal, setShowAiModal] = useState(false);

  // Workout Configuration
  const [intervals, setIntervals] = useState<IntervalItem[]>(DEFAULT_INTERVALS);
  const [loops, setLoops] = useState(0); // 0 = infinite

  // Timer Runtime State
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimeLeft, setCurrentTimeLeft] = useState(DEFAULT_INTERVALS[0]?.duration || 30);
  const [currentLoopCount, setCurrentLoopCount] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Refs for logic loop to avoid stale closures without restarting interval
  const stateRef = useRef({
    intervals,
    loops,
    currentIndex,
    currentLoopCount,
    currentTimeLeft,
    isRunning
  });

  // Sync refs with state
  useEffect(() => {
    stateRef.current = {
      intervals,
      loops,
      currentIndex,
      currentLoopCount,
      currentTimeLeft,
      isRunning
    };
  }, [intervals, loops, currentIndex, currentLoopCount, currentTimeLeft, isRunning]);

  // Derived state for render
  const currentInterval = intervals[currentIndex];
  const isLooping = loops === 0 || currentLoopCount < loops;
  
  // Calculate next type for display
  let nextTypeDisplay: IntervalItem | null = null;
  if (currentIndex < intervals.length - 1) {
    nextTypeDisplay = intervals[currentIndex + 1];
  } else if (isLooping) {
    nextTypeDisplay = intervals[0];
  }

  // Wake Lock Ref
  const wakeLockRef = useRef<any>(null);

  const toggleTimer = () => {
    if (!isRunning) {
        ensureAudioContext(); 
    }
    setIsRunning(!isRunning);
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.warn('Release Wake Lock error:', err);
      }
    }
  };

  // Logic to calculate next type for sound (stateless helper)
  const getNextType = (idx: number, currentIntervals: IntervalItem[], loopVal: number, currentLoop: number) => {
      if (idx < currentIntervals.length - 1) {
          return currentIntervals[idx + 1].type;
      } else if (loopVal === 0 || currentLoop < loopVal) {
          return currentIntervals[0].type;
      }
      return 'FINISHED';
  };

  // Main Timer Loop
  useEffect(() => {
    let intervalId: number;

    if (isRunning) {
      requestWakeLock();
      let lastTime = Date.now();

      intervalId = window.setInterval(() => {
        const now = Date.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        // Read latest state from Ref
        const s = stateRef.current;
        
        // If paused (shouldn't happen due to useEffect dep, but safe check)
        if (!s.isRunning) return;

        // Temporary vars for calculation
        let newTimeLeft = s.currentTimeLeft - delta;
        let newIndex = s.currentIndex;
        let newLoopCount = s.currentLoopCount;
        let finished = false;
        let hasChangedInterval = false;
        
        // Update total elapsed purely for display
        setElapsedTime(prev => prev + delta);

        // Sound triggers for Countdown (only if we are running in real-time, ignore during catch-up jumps)
        // We check against the *previous* timeLeft (s.currentTimeLeft) to avoid multiple triggers if delta is small
        if (delta < 1.5) {
            const nextType = getNextType(newIndex, s.intervals, s.loops, newLoopCount);
            // Trigger at 5, 4, 3, 2, 1
            // We use Math.ceil to integers.
            // If we crossed an integer boundary downwards
            const prevCeil = Math.ceil(s.currentTimeLeft);
            const currCeil = Math.ceil(newTimeLeft);
            
            if (currCeil < prevCeil && currCeil <= 5 && currCeil > 0) {
               playCountdown(nextType);
            }
        }

        // Process time consumption (Catch-up loop)
        while (newTimeLeft <= 0 && !finished) {
           hasChangedInterval = true;
           const absOvershoot = Math.abs(newTimeLeft);

           // Logic to move next
           if (newIndex >= s.intervals.length - 1) {
              // End of sequence
              if (s.loops === 0 || newLoopCount < s.loops) {
                 // Loop
                 newLoopCount++;
                 newIndex = 0;
                 newTimeLeft = s.intervals[0].duration - absOvershoot;
              } else {
                 // Finish
                 finished = true;
                 newTimeLeft = 0;
              }
           } else {
              // Next step
              newIndex++;
              newTimeLeft = s.intervals[newIndex].duration - absOvershoot;
           }
        }

        // Apply changes
        if (finished) {
            playTransition('FINISHED');
            setIsRunning(false);
            setCurrentIndex(0);
            setCurrentLoopCount(1);
            setCurrentTimeLeft(s.intervals[0].duration);
        } else {
            // If we changed interval, play transition sound
            if (hasChangedInterval) {
                 // Play transition for the NEW current interval
                 const currentType = s.intervals[newIndex].type;
                 // Only play if delta is reasonable, otherwise we might spam if user was gone for hours
                 // But for "finished" interval, we usually want the sound.
                 if (delta < 5) {
                     playTransition(currentType);
                 }
            }

            // Batch updates
            // We only update if changed to avoid unnecessary renders, though React handles this well
            if (newIndex !== s.currentIndex) setCurrentIndex(newIndex);
            if (newLoopCount !== s.currentLoopCount) setCurrentLoopCount(newLoopCount);
            setCurrentTimeLeft(newTimeLeft);
        }

      }, 100); // Run at 10Hz for responsiveness, though delta handles accuracy
    } else {
      releaseWakeLock();
    }

    return () => {
      clearInterval(intervalId);
      releaseWakeLock();
    };
  }, [isRunning]); // Only restart loop on Running toggle

  const skipForward = () => {
    // Manual skip triggers the logic of "0 time left" effectively
    // But easier to just manipulate state directly
    const s = stateRef.current;
    let newIndex = s.currentIndex;
    let newLoop = s.currentLoopCount;

    if (newIndex >= s.intervals.length - 1) {
        if (s.loops === 0 || newLoop < s.loops) {
            newLoop++;
            newIndex = 0;
            const nextInt = s.intervals[0];
            playTransition(nextInt.type);
            setCurrentIndex(newIndex);
            setCurrentLoopCount(newLoop);
            setCurrentTimeLeft(nextInt.duration);
        } else {
            playTransition('FINISHED');
            setIsRunning(false);
            setCurrentIndex(0);
            setCurrentLoopCount(1);
            setCurrentTimeLeft(s.intervals[0].duration);
        }
    } else {
        newIndex++;
        const nextInt = s.intervals[newIndex];
        playTransition(nextInt.type);
        setCurrentIndex(newIndex);
        setCurrentTimeLeft(nextInt.duration);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    setCurrentLoopCount(1);
    setCurrentTimeLeft(intervals[0]?.duration || 0);
    setElapsedTime(0);
  };

  // Safe check if list is empty
  useEffect(() => {
    if (intervals.length === 0) {
      setIsRunning(false);
    } else if (intervals.length > 0 && !currentInterval) {
      resetTimer();
    }
  }, [intervals]);


  return (
    <div className="bg-black text-white h-screen w-full flex flex-col font-sans overflow-hidden">
      
      {/* Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {mode === AppMode.TIMER && intervals.length > 0 && currentInterval ? (
          <TimerDisplay
            currentInterval={currentInterval}
            nextInterval={nextTypeDisplay}
            timeLeft={currentTimeLeft}
            totalTimeElapsed={elapsedTime}
            isRunning={isRunning}
            onToggle={toggleTimer}
            onSkip={skipForward}
            onReset={resetTimer}
            progress={1 - (currentTimeLeft / currentInterval.duration)}
            currentLoop={currentLoopCount}
            totalLoops={loops}
          />
        ) : mode === AppMode.EDITOR || intervals.length === 0 ? (
          <IntervalEditor
            intervals={intervals}
            setIntervals={(newIntervals) => {
              setIntervals(newIntervals);
              resetTimer();
            }}
            loops={loops}
            setLoops={setLoops}
            onGenerateAI={() => setShowAiModal(true)}
          />
        ) : null}
      </main>

      {/* Navigation Bar (Mobile Style) */}
      <nav className="h-20 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center px-4 pb-2 z-10">
        <button
          onClick={() => setMode(AppMode.TIMER)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${mode === AppMode.TIMER ? 'text-emerald-500' : 'text-zinc-500'}`}
        >
          <Timer size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wide">Timer</span>
        </button>

        <button
          onClick={() => setMode(AppMode.EDITOR)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${mode === AppMode.EDITOR ? 'text-emerald-500' : 'text-zinc-500'}`}
        >
          <List size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wide">Edit</span>
        </button>
      </nav>

      {/* AI Modal Overlay */}
      {showAiModal && (
        <AiGenerator 
          onClose={() => setShowAiModal(false)}
          onSuccess={(newIntervals) => {
             setIntervals(newIntervals);
             resetTimer();
             setMode(AppMode.EDITOR); // Show them the result in editor
          }}
        />
      )}
    </div>
  );
};

export default App;