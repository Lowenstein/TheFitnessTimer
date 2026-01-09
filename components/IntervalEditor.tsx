import React, { useState } from 'react';
import { IntervalItem, IntervalType, COLORS } from '../types';
import { Plus, Trash2, GripVertical, Sparkles, Clock, X } from 'lucide-react';

interface IntervalEditorProps {
  intervals: IntervalItem[];
  setIntervals: (intervals: IntervalItem[]) => void;
  loops: number;
  setLoops: (n: number) => void;
  onGenerateAI: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const IntervalEditor: React.FC<IntervalEditorProps> = ({ intervals, setIntervals, loops, setLoops, onGenerateAI }) => {
  const [isAdding, setIsAdding] = useState(false);

  // New item state
  const [newDuration, setNewDuration] = useState(30);
  const [newType, setNewType] = useState<IntervalType>(IntervalType.WORK);
  const [newName, setNewName] = useState('Work');

  const handleAdd = () => {
    const newItem: IntervalItem = {
      id: generateId(),
      duration: newDuration,
      type: newType,
      name: newName,
      color: COLORS[newType]
    };
    setIntervals([...intervals, newItem]);
    setIsAdding(false);
    // Reset defaults
    setNewDuration(30);
    setNewType(IntervalType.WORK);
    setNewName('Work');
  };

  const handleRemove = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Sequence</h2>
          <button 
            onClick={onGenerateAI}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <Sparkles size={16} />
            Ask AI
          </button>
        </div>

        {/* Global Settings */}
        <div className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
           <div className="flex justify-between items-center">
             <span className="text-zinc-300 font-medium">Loops</span>
             <div className="flex items-center gap-3 bg-zinc-950 rounded-lg p-1">
                <button 
                  onClick={() => setLoops(Math.max(0, loops - 1))}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 rounded"
                >-</button>
                <span className="text-white font-mono w-4 text-center">{loops === 0 ? '∞' : loops}</span>
                <button 
                   onClick={() => setLoops(loops + 1)}
                   className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 rounded"
                >+</button>
             </div>
           </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {intervals.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <div className="text-zinc-600"><GripVertical size={16} /></div>
              <div className="h-10 w-1 rounded-full" style={{ backgroundColor: item.color }}></div>
              <div className="flex-1">
                <div className="text-white font-medium">{item.name}</div>
                <div className="text-xs text-zinc-500 font-mono">{item.duration}s • {item.type}</div>
              </div>
              <button 
                onClick={() => handleRemove(item.id)}
                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {intervals.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p>No intervals yet.</p>
              <p className="text-sm mt-2">Add one manually or ask AI.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button area for Manual Add */}
      {!isAdding && (
         <div className="absolute bottom-24 right-6">
            <button 
              onClick={() => setIsAdding(true)}
              className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-emerald-400 transition-colors"
            >
              <Plus size={28} />
            </button>
         </div>
      )}

      {/* Add Modal / Drawer */}
      {isAdding && (
        <div className="absolute inset-x-0 bottom-0 bg-zinc-900 border-t border-zinc-800 p-6 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 z-20 pb-24">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Add Interval</h3>
            <button onClick={() => setIsAdding(false)} className="text-zinc-500"><X size={24}/></button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Type</label>
              <div className="flex gap-2">
                {Object.values(IntervalType).map(t => (
                  <button
                    key={t}
                    onClick={() => { setNewType(t); setNewName(t.charAt(0) + t.slice(1).toLowerCase()); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${newType === t ? 'border-transparent text-black' : 'bg-transparent border-zinc-700 text-zinc-400'}`}
                    style={{ backgroundColor: newType === t ? COLORS[t] : undefined }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
               <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-600"
                  />
               </div>
               <div className="w-1/3">
                  <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Seconds</label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                     <input 
                      type="number" 
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full bg-transparent p-3 text-white focus:outline-none text-center"
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleAdd}
              className="w-full py-4 bg-white text-black font-bold rounded-xl mt-4 active:scale-95 transition-transform"
            >
              Add to Sequence
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntervalEditor;