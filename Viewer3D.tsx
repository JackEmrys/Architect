import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Room } from '../types/house';

const FLOOR_GAP = 0.15; // gap between floors

interface RoomMeshProps {
  room: Room;
  isChanged: boolean;
  isProposed: boolean;
  floorOffset: number;
}

function RoomMesh({ room, isChanged, isProposed, floorOffset }: RoomMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !isChanged || !isProposed) return;
    const t = Math.sin(clock.getElapsedTime() * 2) * 0.5 + 0.5;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.35 + t * 0.3;
  });

  const wallThickness = 0.15;
  const h = room.ceilingHeight;
  const w = room.width;
  const d = room.depth;
  const baseY = floorOffset + h / 2;

  let wallColor = '#e2e8f0';
  let floorColor = room.color ? room.color : '#f1f5f9';

  if (isChanged && isProposed) {
    wallColor = '#93c5fd';
    floorColor = '#dbeafe';
  } else if (isChanged && !isProposed) {
    wallColor = '#fca5a5';
    floorColor = '#fee2e2';
  }

  const cx = room.x + w / 2;
  const cz = room.y + d / 2;

  return (
    <group position={[cx, 0, cz]}>
      {/* Floor slab */}
      <mesh position={[0, floorOffset, 0]} receiveShadow>
        <boxGeometry args={[w - wallThickness, 0.08, d - wallThickness]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* North wall */}
      <mesh position={[0, baseY, -(d / 2 - wallThickness / 2)]} castShadow>
        <boxGeometry args={[w, h, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          transparent={isProposed && isChanged}
          opacity={isProposed && isChanged ? 0.65 : 1}
          roughness={0.7}
        />
      </mesh>
      {/* South wall */}
      <mesh position={[0, baseY, d / 2 - wallThickness / 2]} castShadow>
        <boxGeometry args={[w, h, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          transparent={isProposed && isChanged}
          opacity={isProposed && isChanged ? 0.65 : 1}
          roughness={0.7}
        />
      </mesh>
      {/* West wall */}
      <mesh position={[-(w / 2 - wallThickness / 2), baseY, 0]} castShadow>
        <boxGeometry args={[wallThickness, h, d]} />
        <meshStandardMaterial
          color={wallColor}
          transparent={isProposed && isChanged}
          opacity={isProposed && isChanged ? 0.65 : 1}
          roughness={0.7}
        />
      </mesh>
      {/* East wall */}
      <mesh position={[w / 2 - wallThickness / 2, baseY, 0]} castShadow>
        <boxGeometry args={[wallThickness, h, d]} />
        <meshStandardMaterial
          color={wallColor}
          transparent={isProposed && isChanged}
          opacity={isProposed && isChanged ? 0.65 : 1}
          roughness={0.7}
        />
      </mesh>

      {/* Window openings (just light blue planes on walls) */}
      {room.windows.map(win => {
        const ww = win.width;
        const wh = win.height;
        const wo = win.offset + ww / 2;
        const wy = floorOffset + win.sillHeight + wh / 2;
        let wx = 0, wz = 0, rotation: [number, number, number] = [0, 0, 0];
        switch (win.wallSide) {
          case 'north': wz = -(d / 2); wx = -w / 2 + wo; rotation = [0, 0, 0]; break;
          case 'south': wz = d / 2; wx = -w / 2 + wo; rotation = [0, Math.PI, 0]; break;
          case 'west': wx = -w / 2; wz = -d / 2 + wo; rotation = [0, Math.PI / 2, 0]; break;
          case 'east': wx = w / 2; wz = -d / 2 + wo; rotation = [0, -Math.PI / 2, 0]; break;
        }
        return (
          <mesh key={win.id} position={[wx, wy, wz]} rotation={rotation}>
            <planeGeometry args={[ww, wh]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* Proposed outline box */}
      {isProposed && isChanged && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}

function RoofMesh({ minX, maxX, minZ, maxZ, pitch, type }: {
  minX: number; maxX: number; minZ: number; maxZ: number;
  pitch: number; type: string;
}) {
  const ridgeH = (maxX - minX) / 2 * Math.tan((pitch * Math.PI) / 180);
  const midX = (minX + maxX) / 2;
  const roofY = 2.7; // approximate top of ground floor

  if (type === 'flat') {
    return (
      <mesh position={[midX, roofY + 0.1, (minZ + maxZ) / 2]}>
        <boxGeometry args={[maxX - minX + 0.5, 0.2, maxZ - minZ + 0.5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
    );
  }

  // Gable roof shape
  const shape = new THREE.Shape();
  shape.moveTo(minX - 0.4, 0);
  shape.lineTo(midX, ridgeH + 0.3);
  shape.lineTo(maxX + 0.4, 0);
  shape.closePath();

  const extrudeSettings = {
    depth: maxZ - minZ + 0.8,
    bevelEnabled: false,
  };

  return (
    <mesh position={[0, roofY, minZ - 0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#78716c" roughness={0.85} />
    </mesh>
  );
}

interface SceneProps {
  rooms: Room[];
  proposedRooms?: Room[];
  changedRoomIds?: string[];
  roofType: string;
  roofPitch: number;
}

function Scene({ rooms, proposedRooms, changedRoomIds = [], roofType, roofPitch }: SceneProps) {
  const floorHeights = useMemo(() => {
    const map: Record<number, number> = {};
    let acc = 0;
    const floors = [...new Set(rooms.map(r => r.floor))].sort();
    for (const f of floors) {
      map[f] = acc;
      const maxH = Math.max(...rooms.filter(r => r.floor === f).map(r => r.ceilingHeight));
      acc += maxH + FLOOR_GAP;
    }
    return map;
  }, [rooms]);

  const groundRooms = rooms.filter(r => r.floor === 0);
  const bounds = useMemo(() => {
    if (!groundRooms.length) return { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    return {
      minX: Math.min(...groundRooms.map(r => r.x)),
      maxX: Math.max(...groundRooms.map(r => r.x + r.width)),
      minZ: Math.min(...groundRooms.map(r => r.y)),
      maxZ: Math.max(...groundRooms.map(r => r.y + r.depth)),
    };
  }, [groundRooms]);

  const hasProposed = !!proposedRooms && changedRoomIds.length > 0;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 30, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-10, 20, -10]} intensity={0.4} />

      {/* Base ground */}
      <mesh position={[(bounds.minX + bounds.maxX) / 2, -0.05, (bounds.minZ + bounds.maxZ) / 2]} receiveShadow>
        <boxGeometry args={[(bounds.maxX - bounds.minX) + 6, 0.1, (bounds.maxZ - bounds.minZ) + 6]} />
        <meshStandardMaterial color="#d1fae5" roughness={1} />
      </mesh>

      {/* Existing rooms */}
      {rooms.map(room => (
        <RoomMesh
          key={room.id}
          room={room}
          isChanged={hasProposed && changedRoomIds.includes(room.id)}
          isProposed={false}
          floorOffset={floorHeights[room.floor] ?? 0}
        />
      ))}

      {/* Proposed overlay rooms */}
      {hasProposed && (proposedRooms ?? [])
        .filter(r => changedRoomIds.includes(r.id))
        .map(room => (
          <RoomMesh
            key={`proposed-${room.id}`}
            room={room}
            isChanged={true}
            isProposed={true}
            floorOffset={floorHeights[room.floor] ?? 0}
          />
        ))}

      {/* Roof */}
      <RoofMesh
        minX={bounds.minX}
        maxX={bounds.maxX}
        minZ={bounds.minZ}
        maxZ={bounds.maxZ}
        pitch={roofPitch}
        type={roofType}
      />

      <Grid
        args={[60, 60]}
        position={[bounds.minX + (bounds.maxX - bounds.minX) / 2, -0.1, bounds.minZ + (bounds.maxZ - bounds.minZ) / 2]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#94a3b8"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#64748b"
        fadeDistance={50}
        fadeStrength={1}
      />

      <Environment preset="city" />

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}

interface Props {
  rooms: Room[];
  proposedRooms?: Room[];
  changedRoomIds?: string[];
  roofType: string;
  roofPitch: number;
}

export default function Viewer3D({ rooms, proposedRooms, changedRoomIds = [], roofType, roofPitch }: Props) {
  const groundRooms = rooms.filter(r => r.floor === 0);
  const cx = groundRooms.length
    ? (Math.min(...groundRooms.map(r => r.x)) + Math.max(...groundRooms.map(r => r.x + r.width))) / 2
    : 9;
  const cz = groundRooms.length
    ? (Math.min(...groundRooms.map(r => r.y)) + Math.max(...groundRooms.map(r => r.y + r.depth))) / 2
    : 2.5;

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [cx + 20, 18, cz + 20], fov: 45, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#f8fafc' }}
      >
        <Scene
          rooms={rooms}
          proposedRooms={proposedRooms}
          changedRoomIds={changedRoomIds}
          roofType={roofType}
          roofPitch={roofPitch}
        />
      </Canvas>
      {!!proposedRooms && changedRoomIds.length > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 rounded-md shadow text-white text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Preview Mode
        </div>
      )}
    </div>
  );
}
