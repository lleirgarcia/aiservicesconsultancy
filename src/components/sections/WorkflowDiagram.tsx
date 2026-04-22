'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import rough from 'roughjs';
import type { PathInfo } from 'roughjs/bin/core';
import {
  ReactFlow,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';

/* ─── Utils ──────────────────────────────────────── */

const gen = rough.generator();

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/* ─── Data types ─────────────────────────────────── */

type IconKey = 'hourglass';
type BoxData = { lines: string[]; icon?: IconKey };
type ResultData = { title: string; items: string[] };
type BoxNode = Node<BoxData>;
type ResultNode = Node<ResultData>;

/* ─── Icons (hand-crafted SVG) ───────────────────── */

function HourglassIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 3h14" />
      <path d="M5 21h14" />
      <path d="M7 3 L12 12 L7 21" />
      <path d="M17 3 L12 12 L17 21" />
      <path d="M9 7h6" />
      <path d="M11 18h2" />
    </svg>
  );
}

const ICONS: Record<IconKey, ComponentType<{ size?: number }>> = {
  hourglass: HourglassIcon,
};

/* ─── Sketchy rectangle (SVG overlay) ────────────── */

function SketchyRect({
  seed,
  width,
  height,
  dashed = false,
  strokeWidth = 1.8,
  roughness = 2.2,
}: {
  seed: number;
  width: number;
  height: number;
  dashed?: boolean;
  strokeWidth?: number;
  roughness?: number;
}) {
  const paths: PathInfo[] = useMemo(() => {
    const drawable = gen.rectangle(4, 4, width - 8, height - 8, {
      seed,
      roughness,
      bowing: 2.2,
      stroke: 'currentColor',
      strokeWidth,
      strokeLineDash: dashed ? [8, 5] : undefined,
      preserveVertices: false,
      disableMultiStroke: false,
    });
    return gen.toPaths(drawable);
  }, [seed, width, height, dashed, strokeWidth, roughness]);

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/* ─── Node components ────────────────────────────── */

const CHAOS_W = 170;
const CHAOS_H = 54;
const RESULT_W = 230;
const RESULT_H = 184;

function SketchyChaosNode({ id, data }: NodeProps<BoxNode>) {
  const seed = hashSeed(id);
  const rotation = ((seed % 41) - 20) / 10;
  return (
    <div
      className="wf-sketchy-box"
      style={{
        width: CHAOS_W,
        height: CHAOS_H,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <SketchyRect seed={seed} width={CHAOS_W} height={CHAOS_H} />
      <div className="wf-sketchy-text">
        {data.lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function SketchyResultNode({ id, data }: NodeProps<ResultNode>) {
  return (
    <div
      className="wf-sketchy-result"
      style={{ width: RESULT_W, height: RESULT_H }}
    >
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="target" position={Position.Top} id="t" />
      <SketchyRect
        seed={hashSeed(id)}
        width={RESULT_W}
        height={RESULT_H}
        dashed
        strokeWidth={1.1}
      />
      <div className="wf-sketchy-result-content">
        <div className="wf-sketchy-result-title">{data.title}</div>
        <ul>
          {data.items.map((t, i) => (
            <li key={i}>— {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InputNode({ data }: NodeProps<BoxNode>) {
  return (
    <div className="wf-box">
      <Handle type="source" position={Position.Right} />
      {data.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

function CenterNode({ data }: NodeProps<BoxNode>) {
  return (
    <div className="wf-box wf-box-wide">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      {data.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

function OutputNode({ data }: NodeProps<BoxNode>) {
  const Icon = data.icon ? ICONS[data.icon] : null;
  return (
    <div className="wf-box wf-box-dark">
      <Handle type="target" position={Position.Left} />
      {Icon && (
        <span className="wf-box-icon" aria-hidden="true">
          <Icon size={26} />
        </span>
      )}
      {data.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

/* ─── Sketchy edge (custom) ──────────────────────── */

function SketchyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps) {
  const paths: PathInfo[] = useMemo(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const cp1x = sourceX + dx * 0.55;
    const cp1y = sourceY + dy * 0.12;
    const cp2x = sourceX + dx * 0.5;
    const cp2y = targetY - dy * 0.12;
    const d = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
    const drawable = gen.path(d, {
      seed: hashSeed(id),
      roughness: 2.8,
      bowing: 3,
      stroke: '#6B6B72',
      strokeWidth: 1.1,
      disableMultiStroke: false,
    });
    return gen.toPaths(drawable);
  }, [id, sourceX, sourceY, targetX, targetY]);

  return (
    <g className="wf-sketchy-edge">
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/* ─── Node & edge type maps ──────────────────────── */

const nodeTypes: NodeTypes = {
  chaos: SketchyChaosNode,
  result: SketchyResultNode,
  input: InputNode,
  center: CenterNode,
  output: OutputNode,
};

const edgeTypes: EdgeTypes = {
  sketchy: SketchyEdge,
};

/* ─── Chaos diagram data ─────────────────────────── */

const chaosNodes: Node[] = [
  { id: 'a', type: 'chaos', position: { x: 20,  y: 30 },  data: { lines: ['Pedidos', 'WhatsApp'] } },
  { id: 'b', type: 'chaos', position: { x: 260, y: 0 },   data: { lines: ['Facturas', 'a mano'] } },
  { id: 'c', type: 'chaos', position: { x: 500, y: 55 },  data: { lines: ['Excel', 'desactualizado'] } },
  { id: 'd', type: 'chaos', position: { x: 50,  y: 150 }, data: { lines: ['Emails', 'sin control'] } },
  { id: 'e', type: 'chaos', position: { x: 320, y: 128 }, data: { lines: ['Datos', 'dispersos'] } },
  { id: 'f', type: 'chaos', position: { x: 540, y: 172 }, data: { lines: ['Nadie', 'controla'] } },
  { id: 'g', type: 'chaos', position: { x: 190, y: 260 }, data: { lines: ['El dueño', 'lo sabe todo'] } },
  { id: 'h', type: 'chaos', position: { x: 430, y: 270 }, data: { lines: ['Sin', 'reporting'] } },
  {
    id: 'result',
    type: 'result',
    position: { x: 760, y: 80 },
    data: {
      title: 'Resultado',
      items: [
        'Tiempo perdido',
        'Dinero malgastado',
        'Sin visibilidad',
        'Sin control',
      ],
    },
  },
];

const chaosPairs: Array<[string, string, string, string]> = [
  ['a', 'e', 'r', 'l'],
  ['a', 'h', 'b', 't'],
  ['b', 'd', 'b', 't'],
  ['b', 'f', 'r', 't'],
  ['c', 'd', 'l', 't'],
  ['c', 'g', 'b', 't'],
  ['d', 'f', 'r', 'l'],
  ['e', 'b', 't', 'b'],
  ['e', 'h', 'b', 't'],
  ['f', 'g', 'l', 'r'],
  ['g', 'c', 't', 'b'],
  ['h', 'a', 't', 'b'],
  ['d', 'h', 'r', 'l'],
  ['f', 'e', 'l', 'r'],
];

const chaosEdges: Edge[] = [
  ...chaosPairs.map(([s, t, sh, th], i) => ({
    id: `c-${i}-${s}-${t}`,
    source: s,
    target: t,
    sourceHandle: sh,
    targetHandle: th,
    type: 'sketchy',
  })),
  ...(['c', 'e', 'f', 'h'] as const).map(s => ({
    id: `c-out-${s}`,
    source: s,
    target: 'result',
    sourceHandle: 'r',
    targetHandle: 'l',
    type: 'sketchy',
  })),
];

/* ─── Clean diagram data ─────────────────────────── */

const cleanNodes: Node[] = [
  { id: 'i1', type: 'input',  position: { x: 0,   y: 20 },  data: { lines: ['Tus procesos', 'actuales'] } },
  { id: 'i2', type: 'input',  position: { x: 0,   y: 130 }, data: { lines: ['Tus datos', 'existentes'] } },
  { id: 'i3', type: 'input',  position: { x: 0,   y: 240 }, data: { lines: ['Tu equipo', 'actual'] } },
  { id: 'cx', type: 'center', position: { x: 320, y: 130 }, data: { lines: ['Sistema', 'automatizado'] } },
  { id: 'o1', type: 'output', position: { x: 640, y: 20 },  data: { lines: ['Tiempo', 'recuperado'] } },
  { id: 'o2', type: 'output', position: { x: 640, y: 130 }, data: { lines: ['Claridad', 'total'] } },
  { id: 'o3', type: 'output', position: { x: 640, y: 240 }, data: { lines: ['Más', 'rentabilidad'] } },
];

const cleanArrow = {
  type: MarkerType.ArrowClosed,
  color: 'var(--fg)',
  width: 16,
  height: 16,
};

const cleanEdges: Edge[] = [
  { id: 'i1-cx', source: 'i1', target: 'cx', style: { stroke: 'var(--fg)', strokeWidth: 1.4 }, markerEnd: cleanArrow },
  { id: 'i2-cx', source: 'i2', target: 'cx', style: { stroke: 'var(--fg)', strokeWidth: 1.4 }, markerEnd: cleanArrow },
  { id: 'i3-cx', source: 'i3', target: 'cx', style: { stroke: 'var(--fg)', strokeWidth: 1.4 }, markerEnd: cleanArrow },
  { id: 'cx-o1', source: 'cx', target: 'o1', style: { stroke: 'var(--fg)', strokeWidth: 1.4 }, markerEnd: cleanArrow },
  { id: 'cx-o2', source: 'cx', target: 'o2', style: { stroke: 'var(--fg)', strokeWidth: 1.4 }, markerEnd: cleanArrow },
  { id: 'cx-o3', source: 'cx', target: 'o3', style: { stroke: 'var(--fg)', strokeWidth: 1.4 }, markerEnd: cleanArrow },
];

/* ─── Shared flow props (display-only) ───────────── */

const staticFlowProps = {
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: false,
  panOnDrag: false,
  panOnScroll: false,
  zoomOnScroll: false,
  zoomOnPinch: false,
  zoomOnDoubleClick: false,
  preventScrolling: false,
  fitView: true,
  proOptions: { hideAttribution: true },
} as const;

const chaosFitView = {
  padding: { top: 0.05, right: 0.12, bottom: 0.05, left: 0.05 },
};
const cleanFitView = { padding: 0.08 };

/* ─── Main component ─────────────────────────────── */

export default function WorkflowDiagram() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Chaotic — hand-drawn */}
      <div
        className="px-8 py-10"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase mb-2">
          Así funciona hoy.
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mb-8"
          style={{ color: 'var(--muted)' }}
        >
          Sin sistema o a medias — situación actual
        </p>
        <div className="wf-flow wf-flow-sketchy" style={{ height: 420 }}>
          {mounted && (
            <ReactFlow
              nodes={chaosNodes}
              edges={chaosEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              {...staticFlowProps}
              fitViewOptions={chaosFitView}
            />
          )}
        </div>
      </div>

      {/* Clean */}
      <div className="px-8 py-10">
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase mb-2">
          Así podría funcionar mañana.
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mb-8"
          style={{ color: 'var(--muted)' }}
        >
          Con sistema — flujo automatizado
        </p>
        <div className="wf-flow" style={{ height: 340 }}>
          {mounted && (
            <ReactFlow
              nodes={cleanNodes}
              edges={cleanEdges}
              nodeTypes={nodeTypes}
              {...staticFlowProps}
              fitViewOptions={cleanFitView}
            />
          )}
        </div>
      </div>
    </div>
  );
}
