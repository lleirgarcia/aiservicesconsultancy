'use client';

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import rough from 'roughjs';
import type { PathInfo } from 'roughjs/bin/core';
import {
  ReactFlow,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
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
type BoxData = { lines: string[]; icon?: IconKey; animDelay?: number; triggered?: boolean };
type ResultData = { title: string; items: string[]; animDelay?: number; triggered?: boolean };
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
        opacity: 0,
        animation: data.triggered ? 'wf-node-appear 0.45s ease forwards' : 'none',
        animationDelay: `${data.animDelay ?? 0}ms`,
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
      style={{
        width: RESULT_W,
        height: RESULT_H,
        opacity: 0,
        animation: data.triggered ? 'wf-node-appear 0.55s ease forwards' : 'none',
        animationDelay: `${data.animDelay ?? 0}ms`,
      }}
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
  data,
}: EdgeProps) {
  const edgeData = data as { animDelay?: number; triggered?: boolean } | null;
  const triggered = edgeData?.triggered ?? false;
  const animDelay = edgeData?.animDelay ?? 0;

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
          strokeDasharray={triggered ? '3000' : undefined}
          strokeDashoffset={triggered ? '3000' : undefined}
          style={
            triggered
              ? {
                  animation: 'wf-edge-draw 0.8s ease forwards',
                  animationDelay: `${animDelay}ms`,
                }
              : { opacity: 0 }
          }
        />
      ))}
    </g>
  );
}

/* ─── Clean edge with left-to-right draw-in animation ──── */

function CleanEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const edgeData = data as
    | { animDelay?: number; duration?: number; triggered?: boolean }
    | null;
  const triggered = edgeData?.triggered ?? false;
  const animDelay = edgeData?.animDelay ?? 0;
  const duration = edgeData?.duration ?? 1000;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (!triggered) {
    return (
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={1.4}
        strokeLinecap="round"
        style={{ opacity: 0 }}
      />
    );
  }

  return (
    <path
      key={`${id}-trig`}
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      fill="none"
      stroke="var(--fg)"
      strokeWidth={1.4}
      strokeLinecap="round"
      markerEnd={markerEnd}
      pathLength={1}
      strokeDasharray="1"
      strokeDashoffset="1"
      style={{
        animation: `wf-edge-draw ${duration}ms ease both`,
        animationDelay: `${animDelay}ms`,
      }}
    />
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
  clean: CleanEdge,
};

/* ─── Chaos diagram data (base — sin triggered) ──── */

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

const chaosNodesBase: Node[] = [
  { id: 'a', type: 'chaos', position: { x: 20,  y: 30 },  data: { lines: ['Pedidos', 'WhatsApp'],       animDelay: 150  } },
  { id: 'b', type: 'chaos', position: { x: 260, y: 0 },   data: { lines: ['Facturas', 'a mano'],         animDelay: 400  } },
  { id: 'c', type: 'chaos', position: { x: 500, y: 55 },  data: { lines: ['Excel', 'desactualizado'],    animDelay: 850  } },
  { id: 'd', type: 'chaos', position: { x: 50,  y: 150 }, data: { lines: ['Emails', 'sin control'],      animDelay: 0    } },
  { id: 'e', type: 'chaos', position: { x: 320, y: 128 }, data: { lines: ['Datos', 'dispersos'],         animDelay: 550  } },
  { id: 'f', type: 'chaos', position: { x: 540, y: 172 }, data: { lines: ['Nadie', 'controla'],          animDelay: 1000 } },
  { id: 'g', type: 'chaos', position: { x: 190, y: 260 }, data: { lines: ['El dueño', 'lo sabe todo'],  animDelay: 280  } },
  { id: 'h', type: 'chaos', position: { x: 430, y: 270 }, data: { lines: ['Sin', 'reporting'],           animDelay: 700  } },
  {
    id: 'result',
    type: 'result',
    position: { x: 760, y: 80 },
    data: {
      title: 'Resultado',
      items: ['Tiempo perdido', 'Dinero malgastado', 'Sin visibilidad', 'Sin control'],
      animDelay: 1350,
    },
  },
];

const chaosEdgesBase: Edge[] = [
  ...chaosPairs.map(([s, t, sh, th], i) => ({
    id: `c-${i}-${s}-${t}`,
    source: s,
    target: t,
    sourceHandle: sh,
    targetHandle: th,
    type: 'sketchy',
    data: { animDelay: 250 + i * 45 },
  })),
  ...(['c', 'e', 'f', 'h'] as const).map((s, i) => ({
    id: `c-out-${s}`,
    source: s,
    target: 'result',
    sourceHandle: 'r',
    targetHandle: 'l',
    type: 'sketchy',
    data: { animDelay: 1100 + i * 60 },
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

// Left group (inputs → center): staggered 0–1150ms
// Right group (center → outputs): staggered 1300–2450ms
// Each edge takes 850ms to fully draw → total sequence ≈ 2.4s.
const EDGE_DRAW_MS = 850;
const LEFT_START_MS = 0;
const LEFT_STAGGER_MS = 150;
const RIGHT_START_MS = LEFT_START_MS + EDGE_DRAW_MS + 300;
const RIGHT_STAGGER_MS = 150;

const cleanEdgesBase: Edge[] = [
  { id: 'i1-cx', source: 'i1', target: 'cx', type: 'clean', markerEnd: cleanArrow, data: { animDelay: LEFT_START_MS + LEFT_STAGGER_MS * 0, duration: EDGE_DRAW_MS } },
  { id: 'i2-cx', source: 'i2', target: 'cx', type: 'clean', markerEnd: cleanArrow, data: { animDelay: LEFT_START_MS + LEFT_STAGGER_MS * 1, duration: EDGE_DRAW_MS } },
  { id: 'i3-cx', source: 'i3', target: 'cx', type: 'clean', markerEnd: cleanArrow, data: { animDelay: LEFT_START_MS + LEFT_STAGGER_MS * 2, duration: EDGE_DRAW_MS } },
  { id: 'cx-o1', source: 'cx', target: 'o1', type: 'clean', markerEnd: cleanArrow, data: { animDelay: RIGHT_START_MS + RIGHT_STAGGER_MS * 0, duration: EDGE_DRAW_MS } },
  { id: 'cx-o2', source: 'cx', target: 'o2', type: 'clean', markerEnd: cleanArrow, data: { animDelay: RIGHT_START_MS + RIGHT_STAGGER_MS * 1, duration: EDGE_DRAW_MS } },
  { id: 'cx-o3', source: 'cx', target: 'o3', type: 'clean', markerEnd: cleanArrow, data: { animDelay: RIGHT_START_MS + RIGHT_STAGGER_MS * 2, duration: EDGE_DRAW_MS } },
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
  minZoom: 0.1,
  maxZoom: 1.5,
  proOptions: { hideAttribution: true },
} as const;

const chaosFitView = {
  padding: { top: 0.05, right: 0.12, bottom: 0.05, left: 0.05 },
  minZoom: 0.1,
  maxZoom: 1.5,
};
const cleanFitView = { padding: 0.08, minZoom: 0.1, maxZoom: 1.5 };

/* ─── Main component ─────────────────────────────── */

function useViewportWidth() {
  const [w, setW] = useState<number>(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  );
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return w;
}

function useDiagramHeights() {
  const w = useViewportWidth();
  if (w <= 480) return { chaos: 200, clean: 180 };
  if (w <= 768) return { chaos: 260, clean: 220 };
  return { chaos: 420, clean: 340 };
}

export default function WorkflowDiagram() {
  const [mounted, setMounted] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [cleanTriggered, setCleanTriggered] = useState(false);
  const chaosRef = useRef<HTMLDivElement>(null);
  const cleanRef = useRef<HTMLDivElement>(null);
  const chaosInstanceRef = useRef<ReactFlowInstance | null>(null);
  const cleanInstanceRef = useRef<ReactFlowInstance | null>(null);
  const heights = useDiagramHeights();

  // Retrasamos el montaje de ReactFlow hasta que las secciones se despliegan
  // (clase `sections-expanded` en <html>). Si esperamos, el contenedor ya
  // tendrá su altura final cuando `fitView` se ejecute — de lo contrario
  // mediría 0 px mientras la animación de despliegue está en curso.
  useEffect(() => {
    const root = document.documentElement;

    const shouldMount = () =>
      !root.classList.contains("collapse-intro-armed") ||
      root.classList.contains("sections-expanded");

    if (shouldMount()) {
      setMounted(true);
      return;
    }

    const obs = new MutationObserver(() => {
      if (shouldMount()) {
        setMounted(true);
        obs.disconnect();
      }
    });

    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = chaosRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = cleanRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCleanTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const chaosNodes = useMemo(
    () => chaosNodesBase.map(n => ({ ...n, data: { ...n.data, triggered } })),
    [triggered],
  );

  const chaosEdges = useMemo(
    () => chaosEdgesBase.map(e => ({ ...e, data: { ...e.data, triggered } })),
    [triggered],
  );

  const cleanEdges = useMemo(
    () =>
      cleanEdgesBase.map(e => ({
        ...e,
        data: { ...e.data, triggered: cleanTriggered },
      })),
    [cleanTriggered],
  );

  // Re-fit the diagrams whenever the container height changes (viewport
  // breakpoint crossed) so the graph shrinks to stay fully visible.
  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => {
      chaosInstanceRef.current?.fitView(chaosFitView);
      cleanInstanceRef.current?.fitView(cleanFitView);
    });
    return () => cancelAnimationFrame(raf);
  }, [mounted, heights.chaos, heights.clean]);

  return (
    <div
      data-collapsible
      style={{ ['--collapse-delay' as string]: '250ms' }}
    >
      <div>
        {/* Chaotic — hand-drawn */}
        <div
          ref={chaosRef}
          className="px-4 sm:px-8 py-8 sm:py-10"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h3
            className="text-xl md:text-2xl font-bold leading-tight tracking-tight uppercase mb-2"
            style={{ marginLeft: 5 }}
          >
            Así funciona hoy
          </h3>
          <p
            className="text-xs font-medium uppercase tracking-widest mb-8"
            style={{ color: 'var(--muted)', marginLeft: 5 }}
          >
            Sin sistema o sistemas a medias — situación actual
          </p>
          <div
            className="wf-flow wf-flow-sketchy"
            style={{ height: heights.chaos }}
          >
            {mounted && (
              <ReactFlow
                nodes={chaosNodes}
                edges={chaosEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                {...staticFlowProps}
                fitViewOptions={chaosFitView}
                onInit={(inst) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  chaosInstanceRef.current = inst as any;
                }}
              />
            )}
          </div>
        </div>

        {/* Clean */}
        <div ref={cleanRef} className="px-4 sm:px-8 py-8 sm:py-10">
          <h3
            className="text-xl md:text-2xl font-bold leading-tight tracking-tight uppercase mb-2"
            style={{ marginLeft: 5 }}
          >
            Así podría funcionar mañana
          </h3>
          <p
            className="text-xs font-medium uppercase tracking-widest mb-8"
            style={{ color: 'var(--muted)', marginLeft: 5 }}
          >
            Con sistema — flujo automatizado
          </p>
          <div className="wf-flow" style={{ height: heights.clean }}>
            {mounted && (
              <ReactFlow
                nodes={cleanNodes}
                edges={cleanEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                {...staticFlowProps}
                fitViewOptions={cleanFitView}
                onInit={(inst) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  cleanInstanceRef.current = inst as any;
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
