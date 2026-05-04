import React, { useState } from 'react';
import { HouseModel } from '../types/house';

interface Props {
  house: HouseModel;
}

function JsonNode({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2);
  const indent = depth * 16;

  if (data === null) return <span className="text-slate-400">null</span>;
  if (typeof data === 'boolean') return <span className="text-amber-600">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-emerald-600">{data}</span>;
  if (typeof data === 'string') return <span className="text-rose-600">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400">[]</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(c => !c)} className="text-slate-400 hover:text-slate-600 font-mono text-xs">
          {collapsed ? `▶ [${data.length}]` : '▼'}
        </button>
        {!collapsed && (
          <>
            <span className="text-slate-400">[</span>
            {data.map((item, i) => (
              <div key={i} style={{ paddingLeft: indent + 16 }}>
                <JsonNode data={item} depth={depth + 1} />
                {i < data.length - 1 && <span className="text-slate-400">,</span>}
              </div>
            ))}
            <div style={{ paddingLeft: indent }}><span className="text-slate-400">]</span></div>
          </>
        )}
        {collapsed && <span className="text-slate-400"> ]</span>}
      </span>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(c => !c)} className="text-slate-400 hover:text-slate-600 font-mono text-xs">
          {collapsed ? `▶ {${entries.length}}` : '▼'}
        </button>
        {!collapsed && (
          <>
            <span className="text-slate-400">{'{'}</span>
            {entries.map(([key, val], i) => (
              <div key={key} style={{ paddingLeft: indent + 16 }}>
                <span className="text-sky-700 font-medium">"{key}"</span>
                <span className="text-slate-400">: </span>
                <JsonNode data={val} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-slate-400">,</span>}
              </div>
            ))}
            <div style={{ paddingLeft: indent }}><span className="text-slate-400">{'}'}</span></div>
          </>
        )}
        {collapsed && <span className="text-slate-400"> {'}'}</span>}
      </span>
    );
  }

  return <span className="text-slate-600">{String(data)}</span>;
}

export default function JsonViewer({ house }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(house, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">JSON Model</span>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-5 bg-slate-50 text-slate-700">
        <JsonNode data={house} depth={0} />
      </div>
    </div>
  );
}
