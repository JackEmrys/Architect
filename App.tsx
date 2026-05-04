import React from 'react';
import { HouseProvider, useHouse } from './context/HouseContext';
import LeftPanel from './components/LeftPanel';
import FloorPlan2D from './components/FloorPlan2D';
import RightPanel from './components/RightPanel';

function MainLayout() {
  const { house, stagedEdit, activeFloor } = useHouse();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <LeftPanel />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FloorPlan2D
          rooms={house.rooms}
          proposedRooms={stagedEdit?.proposedRooms}
          changedRoomIds={stagedEdit?.changedRoomIds}
          activeFloor={activeFloor}
        />
      </main>
      <RightPanel />
    </div>
  );
}

export default function App() {
  return (
    <HouseProvider>
      <MainLayout />
    </HouseProvider>
  );
}
