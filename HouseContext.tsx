import React, { createContext, useContext, useState, useCallback } from 'react';
import { HouseModel, Room, StagedEdit } from '../types/house';
import sampleHouse from '../data/sampleHouse';

interface HouseContextValue {
  house: HouseModel;
  stagedEdit: StagedEdit | null;
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
  proposeEdit: (prompt: string) => void;
  confirmEdit: () => void;
  rejectEdit: () => void;
}

const HouseContext = createContext<HouseContextValue | null>(null);

// Mock edit generator: enlarges one room to demonstrate preview
function generateMockEdit(prompt: string, house: HouseModel): StagedEdit {
  const lower = prompt.toLowerCase();

  // Try to match a room name in the prompt
  const matchedRoom = house.rooms.find(r =>
    lower.includes(r.name.toLowerCase().split(' ')[0].toLowerCase())
  );

  const targetRoom: Room = matchedRoom ?? house.rooms[0];

  let proposedRooms: Room[];
  let description = '';

  if (lower.includes('enlarge') || lower.includes('expand') || lower.includes('bigger') || lower.includes('larger')) {
    proposedRooms = house.rooms.map(r =>
      r.id === targetRoom.id
        ? { ...r, width: r.width + 1.5, depth: r.depth + 1 }
        : r
    );
    description = `Enlarged ${targetRoom.name}`;
  } else if (lower.includes('shrink') || lower.includes('smaller') || lower.includes('reduce')) {
    proposedRooms = house.rooms.map(r =>
      r.id === targetRoom.id
        ? { ...r, width: Math.max(2, r.width - 1), depth: Math.max(2, r.depth - 0.5) }
        : r
    );
    description = `Shrunk ${targetRoom.name}`;
  } else if (lower.includes('window')) {
    proposedRooms = house.rooms.map(r =>
      r.id === targetRoom.id
        ? {
            ...r,
            windows: [
              ...r.windows,
              {
                id: `win-new-${Date.now()}`,
                wallSide: 'east' as const,
                offset: 1.0,
                width: 1.2,
                height: 1.2,
                sillHeight: 0.9,
              },
            ],
          }
        : r
    );
    description = `Added window to ${targetRoom.name}`;
  } else {
    // Default: widen the living room
    const living = house.rooms.find(r => r.id === 'room-living') ?? house.rooms[0];
    proposedRooms = house.rooms.map(r =>
      r.id === living.id ? { ...r, width: r.width + 2, depth: r.depth + 1.5 } : r
    );
    description = `Enlarged ${living.name} (default mock)`;
  }

  return {
    prompt: description,
    proposedRooms,
    changedRoomIds: [targetRoom.id],
  };
}

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const [house, setHouse] = useState<HouseModel>(sampleHouse);
  const [stagedEdit, setStagedEdit] = useState<StagedEdit | null>(null);
  const [activeFloor, setActiveFloor] = useState(0);

  const proposeEdit = useCallback((prompt: string) => {
    const edit = generateMockEdit(prompt, house);
    setStagedEdit(edit);
  }, [house]);

  const confirmEdit = useCallback(() => {
    if (!stagedEdit) return;
    setHouse(prev => ({
      ...prev,
      rooms: stagedEdit.proposedRooms,
      updatedAt: new Date().toISOString(),
    }));
    setStagedEdit(null);
  }, [stagedEdit]);

  const rejectEdit = useCallback(() => {
    setStagedEdit(null);
  }, []);

  return (
    <HouseContext.Provider value={{ house, stagedEdit, activeFloor, setActiveFloor, proposeEdit, confirmEdit, rejectEdit }}>
      {children}
    </HouseContext.Provider>
  );
}

export function useHouse() {
  const ctx = useContext(HouseContext);
  if (!ctx) throw new Error('useHouse must be used within HouseProvider');
  return ctx;
}
