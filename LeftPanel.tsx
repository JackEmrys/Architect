import React, { useState } from 'react';
import { MessageSquare, Check, X, ChevronDown, Home } from 'lucide-react';
import { useHouse } from '../context/HouseContext';

const EXAMPLE_PROMPTS = [
  'Enlarge the living room',
  'Expand the master bedroom',
  'Make the kitchen bigger',
  'Add a window to bedroom 2',
  'Shrink the hallway',
];

export default function LeftPanel() {
  const { house, stagedEdit, activeFloor, setActiveFloor, proposeEdit, confirmEdit, rejectEdit } = useHouse();
  const [prompt, setPrompt] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    proposeEdit(prompt.trim());
    setPrompt('');
    setShowExamples(false);
  }

  function handleExample(ex: string) {
    setPrompt(ex);
    setShowExamples(false);
  }

  const floors = [...new Set(house.rooms.map(r => r.floor))].sort();

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-72 min-w-[240px] max-w-xs">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Home size={18} className="text-sky-600" />
          <h1 className="text-base font-bold text-slate-800 tracking-tight">{house.name}</h1>
        </div>
        <p className="text-xs text-slate-400">{house.storeys} storey · {house.roofType} roof · {house.rooms.length} rooms</p>
      </div>

      {/* Floor selector */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Floor</p>
        <div className="flex gap-1.5">
          {floors.map(f => (
            <button
              key={f}
              onClick={() => setActiveFloor(f)}
              className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                activeFloor === f
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f === 0 ? 'Ground' : `Floor ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="px-4 py-3 border-b border-slate-100 flex-1 overflow-auto min-h-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rooms</p>
        <div className="space-y-1">
          {house.rooms
            .filter(r => r.floor === activeFloor)
            .map(room => {
              const isChanged = stagedEdit?.changedRoomIds.includes(room.id) ?? false;
              return (
                <div
                  key={room.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                    isChanged
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="font-medium truncate">{room.name}</span>
                  <span className="ml-2 text-slate-400 whitespace-nowrap shrink-0">
                    {room.width.toFixed(1)}×{room.depth.toFixed(1)}m
                  </span>
                  {isChanged && (
                    <span className="ml-1.5 px-1 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold shrink-0">
                      EDIT
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Staged edit banner */}
      {stagedEdit && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-700">Proposed Edit</p>
              <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">{stagedEdit.prompt}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors shadow-sm"
            >
              <Check size={13} />
              Confirm
            </button>
            <button
              onClick={rejectEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 rounded text-xs font-semibold transition-colors"
            >
              <X size={13} />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Prompt input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verbal Edit</p>
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onFocus={() => setShowExamples(true)}
                placeholder="e.g. enlarge the living room..."
                disabled={!!stagedEdit}
                className="w-full px-2.5 py-2 pr-7 text-xs border border-slate-200 rounded bg-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <MessageSquare size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || !!stagedEdit}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>

          {/* Examples dropdown */}
          {showExamples && !stagedEdit && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded shadow-lg z-20">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Examples</span>
                <button type="button" onClick={() => setShowExamples(false)}>
                  <X size={10} className="text-slate-300" />
                </button>
              </div>
              {EXAMPLE_PROMPTS.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleExample(ex)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </form>
        {stagedEdit && (
          <p className="mt-1.5 text-[10px] text-amber-600">Confirm or reject the current edit first.</p>
        )}
      </div>
    </aside>
  );
}
