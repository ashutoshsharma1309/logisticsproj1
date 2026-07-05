"use client";

import * as React from "react";
import { Plane, Ship, Truck, Train, Warehouse as WarehouseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimNode, SimRoute, TransportMode } from "@/types";

/** Quadratic bezier point at parameter t (0..1). */
function bezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

const MODE_ICON: Record<TransportMode, typeof Truck> = {
  truck: Truck,
  ship: Ship,
  plane: Plane,
  rail: Train,
};

const MODE_COLOR: Record<TransportMode, string> = {
  truck: "hsl(var(--primary))",
  ship: "hsl(var(--secondary))",
  plane: "hsl(var(--accent))",
  rail: "hsl(var(--warning))",
};

// Abstract continent blobs (approx positions on a 100x60 equirect canvas).
const CONTINENTS = [
  "M14,17 Q10,11 18,10 Q26,9 27,15 Q29,22 24,26 Q18,30 14,24 Z", // N America
  "M30,33 Q28,28 33,29 Q38,30 37,38 Q36,48 31,47 Q28,42 30,33 Z", // S America
  "M48,14 Q46,9 52,10 Q57,10 56,15 Q55,19 51,19 Q48,18 48,14 Z", // Europe
  "M49,22 Q47,18 54,19 Q60,20 59,30 Q58,40 52,39 Q48,32 49,22 Z", // Africa
  "M62,14 Q66,9 76,11 Q86,13 84,22 Q82,30 72,28 Q64,24 62,14 Z", // Asia
  "M80,38 Q83,35 88,37 Q92,39 89,44 Q85,47 81,44 Q79,41 80,38 Z", // Oceania
];

interface WorldMapProps {
  nodes: SimNode[];
  routes: SimRoute[];
  className?: string;
  onNodeClick?: (node: SimNode) => void;
  activeRouteId?: string | null;
  onRouteClick?: (route: SimRoute) => void;
}

export function WorldMap({
  nodes,
  routes,
  className,
  onNodeClick,
  activeRouteId,
  onRouteClick,
}: WorldMapProps) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl", className)}>
      <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="route-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.15} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="60" fill="url(#map-glow)" />

        {/* graticule */}
        <g stroke="hsl(var(--border))" strokeWidth={0.1} opacity={0.5}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * 6} x2="100" y2={(i + 1) * 6} />
          ))}
          {Array.from({ length: 15 }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 6.25} y1="0" x2={(i + 1) * 6.25} y2="60" />
          ))}
        </g>

        {/* continents */}
        <g fill="hsl(var(--muted-foreground))" opacity={0.14}>
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* routes */}
        {routes.map((r) => {
          const path = `M ${r.fromPoint.x} ${r.fromPoint.y} Q ${r.controlPoint.x} ${r.controlPoint.y} ${r.toPoint.x} ${r.toPoint.y}`;
          const pos = bezier(r.fromPoint, r.controlPoint, r.toPoint, r.progress);
          const Icon = MODE_ICON[r.mode];
          const color = MODE_COLOR[r.mode];
          const active = activeRouteId === r.id;
          return (
            <g key={r.id} onClick={() => onRouteClick?.(r)} className={onRouteClick ? "cursor-pointer" : ""}>
              <path
                d={path}
                fill="none"
                stroke="url(#route-line)"
                strokeWidth={active ? 0.5 : 0.28}
                strokeDasharray="1.2 1"
                className="animate-[shimmer_none]"
                opacity={active ? 1 : 0.7}
              />
              {/* travelling marker */}
              <g transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r={active ? 1.5 : 1.1} fill={color} opacity={0.25} />
                <circle r={active ? 0.9 : 0.7} fill={color} />
                <foreignObject x={-1.1} y={-1.1} width={2.2} height={2.2} className="overflow-visible">
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="text-white" style={{ width: "1.4px", height: "1.4px" }} strokeWidth={2.5} />
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}

        {/* nodes */}
        {nodes.map((n) => (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            onClick={() => onNodeClick?.(n)}
            className={onNodeClick ? "cursor-pointer" : ""}
          >
            {n.glow && (
              <circle r={0.8} fill="hsl(var(--secondary))">
                <animate attributeName="r" from="0.8" to="2.6" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.7" to="0" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              r={0.9}
              fill={n.type === "warehouse" ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
              stroke="hsl(var(--background))"
              strokeWidth={0.2}
            />
          </g>
        ))}
      </svg>

      {/* node labels overlay */}
      <div className="pointer-events-none absolute inset-0">
        {nodes.filter((n) => n.glow).map((n) => (
          <span
            key={`lbl-${n.id}`}
            className="absolute -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-card/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground shadow-clay-sm backdrop-blur-sm"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            {n.label}
          </span>
        ))}
      </div>
    </div>
  );
}
