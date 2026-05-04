export interface Door {
  id: string;
  wallSide: 'north' | 'south' | 'east' | 'west';
  offset: number; // distance from left/bottom corner of wall
  width: number;
  swingInward: boolean;
}

export interface Window {
  id: string;
  wallSide: 'north' | 'south' | 'east' | 'west';
  offset: number;
  width: number;
  height: number;
  sillHeight: number;
}

export interface Room {
  id: string;
  name: string;
  floor: number; // 0 = ground, 1 = upper
  x: number; // meters from origin
  y: number;
  width: number; // meters
  depth: number; // meters
  ceilingHeight: number; // meters
  doors: Door[];
  windows: Window[];
  color?: string; // optional room tint
}

export type RoofType = 'flat' | 'gable' | 'hip' | 'shed';

export interface HouseModel {
  id: string;
  name: string;
  storeys: 1 | 2;
  roofType: RoofType;
  roofPitch: number; // degrees
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export interface StagedEdit {
  prompt: string;
  proposedRooms: Room[]; // full room list after proposed change
  changedRoomIds: string[]; // which rooms are highlighted as changed
}
