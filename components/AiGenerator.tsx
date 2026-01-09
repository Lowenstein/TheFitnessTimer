import React, { useState } from 'react';
import { generateWorkoutRoutine } from '../services/geminiService';
import { IntervalItem } from '../types';
import { Loader2, X, Sparkles } from 'lucide-react';

interface AiGeneratorProps {
  onClose: () => void;
  onSuccess: (intervals: IntervalItem[]) => void;
}

const AiGenerator: React.FC<AiGeneratorProps> = ({ onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const intervals = await generateWorkoutRoutine(prompt);
      onSuccess(intervals);
      onClose();
    } catch (err) {
      setError("Failed to generate workout. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Tabata: 20s work 10s rest, 8 rounds",
    "30 min leg day HIIT",
    "Boxer's interval training",
    "Stretching routine 5 min"
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-start mb-6">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Sparkles className="text-purple-500" size={20} />
               AI Workout Generator
             </h2>
             <p className="text-zinc-500 text-sm mt-1">Describe your goal, we build the timer.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Core crusher: 45s work, 15s rest, alternating plank and crunches'"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white h-32 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none mb-4 placeholder:text-zinc-600"
        />

        {/* Suggestions chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {suggestions.map((s, i) => (
            <button 
              key={i}
              onClick={() => setPrompt(s)}
              className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-full hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Generate Workout'}
        </button>

      </div>
    </div>
  );
};

export default AiGenerator;