export enum IntervalType {
  WORK = 'WORK',
  REST = 'REST',
  PREP = 'PREP',
  COOLDOWN = 'COOLDOWN'
}

export interface IntervalItem {
  id: string;
  duration: number; // in seconds
  type: IntervalType;
  name: string;
  color: string; // Hex code or Tailwind class fragment
}

export interface WorkoutSequence {
  id: string;
  name: string;
  intervals: IntervalItem[];
  loops: number; // 0 means infinite, 1 means once through, etc.
}

export enum AppMode {
  EDITOR = 'EDITOR',
  TIMER = 'TIMER',
  GENERATOR = 'GENERATOR'
}

export const COLORS = {
  [IntervalType.WORK]: '#22c55e', // Green 500
  [IntervalType.REST]: '#ef4444', // Red 500
  [IntervalType.PREP]: '#eab308', // Yellow 500
  [IntervalType.COOLDOWN]: '#3b82f6', // Blue 500
};