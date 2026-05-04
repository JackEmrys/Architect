import React, { useState, Suspense } from 'react';
import { Box, FileJson } from 'lucide-react';
import { useHouse } from '../context/HouseContext';
import JsonViewer from './JsonViewer';

const Viewer3D = React.lazy(() => import('./Viewer3D'));

type Tab = '3d' | 'json';

export default function RightPanel() {
  const { house, stagedEdit } = useHouse();
  const [activeTab, setActiveTab] = useState<Tab>('3d');

  const proposedRooms = stagedEdit?.proposedRooms;
  const changedRoomIds = stagedEdit?.changedRoomIds ?? [];

  return (
    <aside className="flex flex-col h-full bg-white border-l border-slate-200 w-96 min-w-[320px]">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === '3d'
              ? 'border-sky-500 text-sky-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Box size={13} />
          3D View
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'json'
              ? 'border-sky-500 text-sky-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileJson size={13} />
          JSON
        </button>

        {activeTab === '3d' && stagedEdit && (
          <div className="ml-auto flex items-center pr-3">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Preview
            </span>
          </div>
        )}
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === '3d' ? (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <div className="text-xs text-slate-400">Loading 3D viewer...</div>
            </div>
          }>
            <Viewer3D
              rooms={house.rooms}
              proposedRooms={proposedRooms}
              changedRoomIds={changedRoomIds}
              roofType={house.roofType}
              roofPitch={house.roofPitch}
            />
          </Suspense>
        ) : (
          <JsonViewer house={house} />
        )}
      </div>
    </aside>
  );
}
