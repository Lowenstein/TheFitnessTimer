import React, { useEffect, useState } from 'react';
import { IntervalItem, IntervalType } from '../types';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

interface TimerDisplayProps {
  currentInterval: IntervalItem;
  nextInterval: IntervalItem | null;
  timeLeft: number;
  totalTimeElapsed: number;
  isRunning: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
  progress: number; // 0 to 1
  currentLoop: number;
  totalLoops: number;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  currentInterval,
  nextInterval,
  timeLeft,
  isRunning,
  onToggle,
  onSkip,
  onReset,
  progress,
  currentLoop,
  totalLoops
}) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  // Pulse effect logic when resting or working
  const isRest = currentInterval.type === IntervalType.REST;
  const pulseClass = isRunning && !isRest ? 'animate-pulse-slow' : '';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      
      {/* Top Info */}
      <div className="absolute top-4 w-full px-6 flex justify-between text-zinc-400 text-sm font-medium">
        <span>Loop {currentLoop} / {totalLoops === 0 ? '∞' : totalLoops}</span>
        <span>{currentInterval.type}</span>
      </div>

      {/* Main Circle */}
      <div className="relative flex items-center justify-center my-8">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 transition-all duration-300"
        >
          <circle
            stroke="#27272a" // zinc-800
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={currentInterval.color}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={`transition-all duration-500 ease-linear ${pulseClass}`}
          />
        </svg>

        {/* Time Center */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-6xl font-black tracking-tighter tabular-nums text-white">
            {formatTime(timeLeft)}
          </span>
          <span className="text-zinc-400 text-lg mt-1 font-medium max-w-[150px] text-center truncate">
            {currentInterval.name}
          </span>
        </div>
      </div>

      {/* Next Up */}
      <div className="h-16 flex flex-col items-center justify-center mb-8">
        {nextInterval ? (
          <>
            <span className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Up Next</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: nextInterval.color }} 
              />
              <span className="text-zinc-200 font-semibold">{nextInterval.name}</span>
              <span className="text-zinc-500 text-sm">({formatTime(nextInterval.duration)})</span>
            </div>
          </>
        ) : (
          <span className="text-zinc-500 font-medium">Finishing Workout</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8">
        <button 
          onClick={onReset}
          className="p-4 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <RotateCcw size={24} />
        </button>

        <button 
          onClick={onToggle}
          className={`p-6 rounded-full text-white shadow-lg active:scale-95 transition-all ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
        >
          {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>

        <button 
          onClick={onSkip}
          className="p-4 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <SkipForward size={24} />
        </button>
      </div>
    </div>
  );
};

export default TimerDisplay;