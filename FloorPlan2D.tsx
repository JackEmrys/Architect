import React, { useMemo, useRef, useState } from 'react';
import { Room, Door, Window } from '../types/house';

const SCALE = 40; // pixels per meter
const WALL_THICKNESS = 6; // px
const PADDING = 40; // px

interface Props {
  rooms: Room[];
  proposedRooms?: Room[];
  changedRoomIds?: string[];
  activeFloor: number;
}

function computeBounds(rooms: Room[]) {
  if (!rooms.length) return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rooms) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.depth);
  }
  return { minX, minY, maxX, maxY };
}

function toSvg(val: number) { return val * SCALE; }

interface DoorSymbolProps {
  door: Door;
  roomX: number;
  roomY: number;
  roomW: number;
  roomD: number;
}

function DoorSymbol({ door, roomX, roomY, roomW, roomD }: DoorSymbolProps) {
  const w = toSvg(door.width);
  const off = toSvg(door.offset);
  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  let arcX = 0, arcY = 0, arcRx = w, arcRy = w, sweepFlag = 0;

  const rx = toSvg(roomX);
  const ry = toSvg(roomY);
  const rw = toSvg(roomW);
  const rd = toSvg(roomD);

  switch (door.wallSide) {
    case 'south':
      x1 = rx + off; y1 = ry + rd;
      x2 = rx + off + w; y2 = ry + rd;
      arcX = x1; arcY = y1 - w; sweepFlag = 0;
      break;
    case 'north':
      x1 = rx + off; y1 = ry;
      x2 = rx + off + w; y2 = ry;
      arcX = x1; arcY = y1 + w; sweepFlag = 1;
      break;
    case 'west':
      x1 = rx; y1 = ry + off;
      x2 = rx; y2 = ry + off + w;
      arcX = x1 + w; arcY = y1; sweepFlag = 0;
      break;
    case 'east':
      x1 = rx + rw; y1 = ry + off;
      x2 = rx + rw; y2 = ry + off + w;
      arcX = x1 - w; arcY = y1; sweepFlag = 1;
      break;
  }

  return (
    <g>
      {/* door gap: white rect to erase wall */}
      {door.wallSide === 'south' || door.wallSide === 'north' ? (
        <rect x={x1} y={Math.min(y1, y2) - WALL_THICKNESS / 2} width={w} height={WALL_THICKNESS} fill="white" />
      ) : (
        <rect x={Math.min(x1, x2) - WALL_THICKNESS / 2} y={y1} width={WALL_THICKNESS} height={w} fill="white" />
      )}
      {/* swing arc */}
      <path
        d={`M ${x1} ${y1} L ${arcX} ${arcY} A ${arcRx} ${arcRy} 0 0 ${sweepFlag} ${x2} ${y2}`}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      {/* door leaf */}
      <line x1={x1} y1={y1} x2={arcX} y2={arcY} stroke="#475569" strokeWidth="1.5" />
    </g>
  );
}

interface WindowSymbolProps {
  win: Window;
  roomX: number;
  roomY: number;
  roomW: number;
  roomD: number;
}

function WindowSymbol({ win, roomX, roomY, roomW, roomD }: WindowSymbolProps) {
  const w = toSvg(win.width);
  const off = toSvg(win.offset);
  const rx = toSvg(roomX);
  const ry = toSvg(roomY);
  const rw = toSvg(roomW);
  const rd = toSvg(roomD);
  const half = WALL_THICKNESS / 2;

  let x = 0, y = 0, lineW = 0, lineH = 0;
  switch (win.wallSide) {
    case 'south': x = rx + off; y = ry + rd - half; lineW = w; lineH = WALL_THICKNESS; break;
    case 'north': x = rx + off; y = ry - half; lineW = w; lineH = WALL_THICKNESS; break;
    case 'west':  x = rx - half; y = ry + off; lineW = WALL_THICKNESS; lineH = w; break;
    case 'east':  x = rx + rw - half; y = ry + off; lineW = WALL_THICKNESS; lineH = w; break;
  }

  return (
    <g>
      <rect x={x} y={y} width={lineW} height={lineH} fill="white" />
      {win.wallSide === 'south' || win.wallSide === 'north' ? (
        <>
          <line x1={x} y1={ry + rd} x2={x + lineW} y2={ry + rd} stroke="#60a5fa" strokeWidth="2" />
          <line x1={x} y1={ry + rd - 2} x2={x + lineW} y2={ry + rd - 2} stroke="#93c5fd" strokeWidth="1" />
        </>
      ) : (
        <>
          <line x1={win.wallSide === 'east' ? rx + rw : rx} y1={y} x2={win.wallSide === 'east' ? rx + rw : rx} y2={y + lineH} stroke="#60a5fa" strokeWidth="2" />
          <line x1={(win.wallSide === 'east' ? rx + rw : rx) + 2} y1={y} x2={(win.wallSide === 'east' ? rx + rw : rx) + 2} y2={y + lineH} stroke="#93c5fd" strokeWidth="1" />
        </>
      )}
    </g>
  );
}

interface RoomShapeProps {
  room: Room;
  isProposed: boolean;
  isChanged: boolean;
  offsetX: number;
  offsetY: number;
  totalH: number;
}

function RoomShape({ room, isProposed, isChanged, offsetX, offsetY, totalH }: RoomShapeProps) {
  // SVG Y is flipped (origin top-left, but floor plan origin bottom-left)
  const rx = toSvg(room.x) + offsetX;
  const ry = totalH - toSvg(room.y + room.depth) + offsetY;
  const rw = toSvg(room.width);
  const rd = toSvg(room.depth);

  const fillColor = isChanged
    ? (isProposed ? 'rgba(59,130,246,0.18)' : 'rgba(239,68,68,0.08)')
    : (room.color ?? '#f8fafc');

  const strokeColor = isChanged ? (isProposed ? '#3b82f6' : '#ef4444') : '#64748b';
  const strokeW = isChanged ? 2 : 1.5;
  const strokeDash = isProposed && isChanged ? '6 3' : undefined;

  return (
    <g>
      <rect
        x={rx}
        y={ry}
        width={rw}
        height={rd}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeDasharray={strokeDash}
      />
      {/* Room label */}
      <text
        x={rx + rw / 2}
        y={ry + rd / 2 - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={isChanged && isProposed ? '#1d4ed8' : '#374151'}
        fontFamily="system-ui, sans-serif"
        fontWeight={isChanged ? '600' : '400'}
      >
        {room.name}
      </text>
      <text
        x={rx + rw / 2}
        y={ry + rd / 2 + 7}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8.5"
        fill={isChanged && isProposed ? '#3b82f6' : '#94a3b8'}
        fontFamily="system-ui, sans-serif"
      >
        {room.width.toFixed(1)}m x {room.depth.toFixed(1)}m
      </text>
      {/* Doors */}
      {room.doors.map(door => (
        <DoorSymbol
          key={door.id}
          door={door}
          roomX={room.x * SCALE / SCALE + (rx - offsetX) / SCALE}
          roomY={room.y}
          roomW={room.width}
          roomD={room.depth}
        />
      ))}
      {/* Windows */}
      {room.windows.map(win => (
        <WindowSymbol
          key={win.id}
          win={win}
          roomX={room.x * SCALE / SCALE + (rx - offsetX) / SCALE}
          roomY={room.y}
          roomW={room.width}
          roomD={room.depth}
        />
      ))}
    </g>
  );
}

export default function FloorPlan2D({ rooms, proposedRooms, changedRoomIds = [], activeFloor }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const floorRooms = useMemo(() => rooms.filter(r => r.floor === activeFloor), [rooms, activeFloor]);
  const floorProposed = useMemo(
    () => (proposedRooms ?? rooms).filter(r => r.floor === activeFloor),
    [proposedRooms, rooms, activeFloor]
  );

  // Use proposed rooms for bounds if available (they may be larger)
  const allRoomsForBounds = useMemo(() => {
    const base = proposedRooms ?? rooms;
    return base.filter(r => r.floor === activeFloor);
  }, [proposedRooms, rooms, activeFloor]);

  const bounds = useMemo(() => computeBounds(allRoomsForBounds), [allRoomsForBounds]);
  const totalW = toSvg(bounds.maxX - bounds.minX);
  const totalH = toSvg(bounds.maxY - bounds.minY);
  const svgW = totalW + PADDING * 2;
  const svgH = totalH + PADDING * 2;
  const offsetX = PADDING - toSvg(bounds.minX);
  const offsetY = PADDING;

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setPan(p => ({ x: p.x + e.clientX - lastPos.x, y: p.y + e.clientY - lastPos.y }));
    setLastPos({ x: e.clientX, y: e.clientY });
  }
  function onMouseUp() { setDragging(false); }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
  }

  const hasProposed = !!proposedRooms && changedRoomIds.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white z-10">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Floor Plan</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.2))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-sm font-bold"
          >+</button>
          <button
            onClick={() => setZoom(1)}
            className="px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
          >{Math.round(zoom * 100)}%</button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-sm font-bold"
          >-</button>
        </div>
        {hasProposed && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-medium">
            <span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />
            Preview
          </span>
        )}
      </div>

      {/* SVG canvas */}
      <div
        className="flex-1 overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            display: 'block',
            margin: 'auto',
          }}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse" x={offsetX % SCALE} y={offsetY % SCALE}>
              <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={svgW} height={svgH} fill="url(#grid)" />

          {/* Compass rose */}
          <g transform={`translate(${svgW - 30}, 30)`}>
            <circle r="14" fill="white" stroke="#cbd5e1" strokeWidth="1" />
            <polygon points="0,-11 3,0 0,-4 -3,0" fill="#1e40af" />
            <polygon points="0,11 3,0 0,4 -3,0" fill="#94a3b8" />
            <text y="-13" textAnchor="middle" fontSize="7" fill="#1e40af" fontWeight="700">N</text>
          </g>

          {/* Scale bar */}
          <g transform={`translate(${offsetX}, ${svgH - 20})`}>
            <line x1="0" y1="0" x2={SCALE * 5} y2="0" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={SCALE * 5} y1="-3" x2={SCALE * 5} y2="3" stroke="#94a3b8" strokeWidth="1.5" />
            <text x={SCALE * 2.5} y="-5" textAnchor="middle" fontSize="8" fill="#94a3b8">5m</text>
          </g>

          {/* Base rooms (existing) */}
          {floorRooms.map(room => (
            <RoomShape
              key={room.id}
              room={room}
              isProposed={false}
              isChanged={hasProposed && changedRoomIds.includes(room.id)}
              offsetX={offsetX}
              offsetY={offsetY}
              totalH={totalH}
            />
          ))}

          {/* Proposed overlay */}
          {hasProposed && floorProposed
            .filter(r => changedRoomIds.includes(r.id))
            .map(room => (
              <RoomShape
                key={`proposed-${room.id}`}
                room={room}
                isProposed={true}
                isChanged={true}
                offsetX={offsetX}
                offsetY={offsetY}
                totalH={totalH}
              />
            ))}
        </svg>
      </div>
    </div>
  );
}
