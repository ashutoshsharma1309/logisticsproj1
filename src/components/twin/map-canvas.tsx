"use client";

import * as React from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MLMap,
  type LngLatLike,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoModel, GeoRoute } from "@/lib/network";
import type { TransportMode } from "@/types";

export interface RiskZone {
  lat: number;
  lng: number;
  label: string;
}

export interface TwinLayers {
  routes: boolean;
  vehicles: boolean;
  risk: boolean;
}

interface MapCanvasProps {
  model: GeoModel;
  risk: RiskZone[];
  playing: boolean;
  speed: number;
  layers: TwinLayers;
  theme: "dark" | "light";
  onSelectRoute?: (route: GeoRoute | null) => void;
}

const MODE_COLOR: Record<TransportMode, string> = {
  truck: "#6d4bff",
  ship: "#14b8a6",
  plane: "#a855f7",
  rail: "#f59e0b",
};

function basemapStyle(theme: "dark" | "light"): StyleSpecification {
  const base = theme === "dark" ? "dark_all" : "light_all";
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [`https://a.basemaps.cartocdn.com/${base}/{z}/{x}/{y}.png`],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors © CARTO",
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  };
}

function routeFeatures(model: GeoModel) {
  return {
    type: "FeatureCollection" as const,
    features: model.routes.map((r) => ({
      type: "Feature" as const,
      properties: { color: MODE_COLOR[r.mode], ref: r.shipmentRef, status: r.status },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [r.from.lng, r.from.lat],
          [r.to.lng, r.to.lat],
        ],
      },
    })),
  };
}

function riskFeatures(risk: RiskZone[]) {
  return {
    type: "FeatureCollection" as const,
    features: risk.map((z, i) => ({
      type: "Feature" as const,
      properties: { label: z.label, id: i },
      geometry: { type: "Point" as const, coordinates: [z.lng, z.lat] },
    })),
  };
}

function vehicleFeatures(model: GeoModel, t: number) {
  return {
    type: "FeatureCollection" as const,
    features: model.routes.map((r, i) => {
      const p = (t + i * 0.13) % 1;
      const lng = r.from.lng + (r.to.lng - r.from.lng) * p;
      const lat = r.from.lat + (r.to.lat - r.from.lat) * p;
      return {
        type: "Feature" as const,
        properties: { color: MODE_COLOR[r.mode], ref: r.shipmentRef, id: r.id },
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      };
    }),
  };
}

export default function MapCanvas({
  model,
  risk,
  playing,
  speed,
  layers,
  theme,
  onSelectRoute,
}: MapCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MLMap | null>(null);
  const progressRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = React.useState(false);

  // Latest props for the animation loop without re-subscribing every frame.
  const modelRef = React.useRef(model);
  const playingRef = React.useRef(playing);
  const speedRef = React.useRef(speed);
  modelRef.current = model;
  playingRef.current = playing;
  speedRef.current = speed;
  const onSelectRef = React.useRef(onSelectRoute);
  onSelectRef.current = onSelectRoute;

  // Adds the custom sources + layers on top of a freshly loaded basemap style.
  const addOverlays = React.useCallback((map: MLMap) => {
    map.addSource("risk", { type: "geojson", data: riskFeatures([]) });
    map.addLayer({
      id: "risk-glow",
      type: "circle",
      source: "risk",
      paint: {
        "circle-radius": 46,
        "circle-color": "#ef4444",
        "circle-opacity": 0.12,
        "circle-blur": 0.8,
      },
    });
    map.addLayer({
      id: "risk-core",
      type: "circle",
      source: "risk",
      paint: {
        "circle-radius": 6,
        "circle-color": "#ef4444",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fca5a5",
        "circle-opacity": 0.9,
      },
    });

    map.addSource("routes", { type: "geojson", data: routeFeatures({ routes: [], nodes: [] }) });
    map.addLayer({
      id: "routes-line",
      type: "line",
      source: "routes",
      layout: { "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.6,
        "line-opacity": 0.5,
        "line-dasharray": [2, 2],
      },
    });

    map.addSource("vehicles", { type: "geojson", data: vehicleFeatures({ routes: [], nodes: [] }, 0) });
    map.addLayer({
      id: "vehicles-glow",
      type: "circle",
      source: "vehicles",
      paint: { "circle-radius": 10, "circle-color": ["get", "color"], "circle-opacity": 0.25, "circle-blur": 0.6 },
    });
    map.addLayer({
      id: "vehicles-core",
      type: "circle",
      source: "vehicles",
      paint: {
        "circle-radius": 4.5,
        "circle-color": ["get", "color"],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    map.on("click", "vehicles-core", (e) => {
      const ref = e.features?.[0]?.properties?.ref as string | undefined;
      const route = modelRef.current.routes.find((r) => r.shipmentRef === ref) ?? null;
      onSelectRef.current?.(route);
    });
    map.on("mouseenter", "vehicles-core", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "vehicles-core", () => (map.getCanvas().style.cursor = ""));
  }, []);

  // Init map once.
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyle(theme),
      center: [20, 30],
      zoom: 1.4,
      attributionControl: { compact: true },
      dragRotate: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "bottom-right",
    );
    map.on("load", () => {
      addOverlays(map);
      setReady(true);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // theme handled in a separate effect via setStyle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOverlays]);

  // Theme change → swap basemap, re-add overlays.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(basemapStyle(theme));
    map.once("styledata", () => {
      if (!map.getSource("routes")) addOverlays(map);
    });
  }, [theme, ready, addOverlays]);

  // Sync node markers (HTML) with the model.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = model.nodes.map((n) => {
      const el = document.createElement("div");
      const isWh = n.type === "warehouse";
      el.className = "flex flex-col items-center gap-1";
      el.innerHTML = `
        <span style="width:${isWh ? 12 : 8}px;height:${isWh ? 12 : 8}px;border-radius:9999px;background:${isWh ? "#14b8a6" : "#6d4bff"};box-shadow:0 0 0 3px ${isWh ? "rgba(20,184,166,.25)" : "rgba(109,75,255,.25)"};display:block"></span>
        <span style="font-size:10px;font-weight:600;color:${theme === "dark" ? "#e5e9f2" : "#1e2637"};text-shadow:0 1px 2px ${theme === "dark" ? "rgba(0,0,0,.8)" : "rgba(255,255,255,.9)"};white-space:nowrap">${n.label.split(",")[0]}</span>`;
      return new maplibregl.Marker({ element: el }).setLngLat([n.lng, n.lat] as LngLatLike).addTo(map);
    });
  }, [model, ready, theme]);

  // Sync route + risk sources.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("routes") as GeoJSONSource | undefined)?.setData(routeFeatures(model));
    (map.getSource("risk") as GeoJSONSource | undefined)?.setData(riskFeatures(risk));
    (map.getSource("vehicles") as GeoJSONSource | undefined)?.setData(
      vehicleFeatures(model, progressRef.current),
    );
  }, [model, risk, ready]);

  // Layer visibility.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const set = (id: string, v: boolean) =>
      map.getLayer(id) && map.setLayoutProperty(id, "visibility", v ? "visible" : "none");
    set("routes-line", layers.routes);
    set("vehicles-glow", layers.vehicles);
    set("vehicles-core", layers.vehicles);
    set("risk-glow", layers.risk);
    set("risk-core", layers.risk);
  }, [layers, ready]);

  // Animation loop.
  React.useEffect(() => {
    if (!ready) return;
    let last = 0;
    const tick = (now: number) => {
      const map = mapRef.current;
      if (!last) last = now;
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) {
        progressRef.current = (progressRef.current + dt * 0.05 * speedRef.current) % 1;
        (map?.getSource("vehicles") as GeoJSONSource | undefined)?.setData(
          vehicleFeatures(modelRef.current, progressRef.current),
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      last = 0;
    };
  }, [ready]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
