import type {
  Shipment,
  ShipmentStatus,
  TransportMode,
  RiskLevel,
  LedgerEvent,
  Warehouse,
  Vehicle,
  Driver,
  Customer,
  Invoice,
  AiInsight,
  ActivityLog,
  GeoPoint,
} from "@/types";
import { HUB_LIST } from "@/lib/geo";
import { seededRandom, simHash, simSignature, stringToSeed } from "@/lib/hash";

/**
 * All demo data is generated deterministically from a fixed base date and
 * seed so the server render and client hydration always agree (no random
 * hydration mismatches) and the "ledger" hash-chain stays internally
 * consistent across the whole app.
 */
export const BASE_TIME = new Date("2026-07-01T09:00:00.000Z").getTime();
const HOUR = 3_600_000;
const DAY = 86_400_000;

const rand = seededRandom(20260701);
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}
function between(min: number, max: number): number {
  return min + rand() * (max - min);
}
function intBetween(min: number, max: number): number {
  return Math.floor(between(min, max + 1));
}

const CARRIERS = [
  "Meridian Freight",
  "Polaris Logistics",
  "Vanguard Cargo",
  "Orion Transport",
  "Atlas Global",
  "Nimbus Air",
  "Sable Maritime",
  "Redwood Haul",
];
const CUSTOMER_NAMES = [
  "Aperture Manufacturing",
  "Northwind Traders",
  "Volt Electronics",
  "Sunrise Foods Co.",
  "Titan Steelworks",
  "Cobalt Pharma",
  "Everest Apparel",
  "Delphi Robotics",
  "Marlin Seafood",
  "Quartz Materials",
  "Lumen Devices",
  "Sequoia Timber",
];
const CONTENTS = [
  "Consumer electronics",
  "Automotive parts",
  "Pharmaceuticals (cold chain)",
  "Industrial machinery",
  "Textiles & apparel",
  "Perishable foods",
  "Lithium battery cells",
  "Precision instruments",
  "Building materials",
  "Retail goods",
];
const STATUSES: ShipmentStatus[] = [
  "pending",
  "in_transit",
  "at_warehouse",
  "customs",
  "out_for_delivery",
  "delivered",
  "delayed",
  "exception",
];
const MODES: TransportMode[] = ["truck", "ship", "plane", "rail"];
const NODES = [
  "node-alpha-01",
  "node-beta-04",
  "node-gamma-07",
  "node-delta-02",
  "node-epsilon-09",
  "node-zeta-05",
  "node-theta-08",
  "node-sigma-03",
];
const VERIFIERS = [
  "Validator-EU-West",
  "Validator-US-East",
  "Validator-APAC",
  "Validator-ME-Central",
  "Validator-LATAM",
];

function riskFrom(prob: number): RiskLevel {
  if (prob > 0.7) return "critical";
  if (prob > 0.45) return "high";
  if (prob > 0.2) return "medium";
  return "low";
}

// ------------------------------------------------------------------ Shipments
export function generateShipments(count: number): Shipment[] {
  const shipments: Shipment[] = [];
  for (let i = 0; i < count; i++) {
    let origin: GeoPoint = pick(HUB_LIST);
    let destination: GeoPoint = pick(HUB_LIST);
    let guard = 0;
    while (destination.label === origin.label && guard++ < 10) {
      destination = pick(HUB_LIST);
    }
    const status = pick(STATUSES);
    const mode = pick(MODES);
    const progress =
      status === "delivered"
        ? 100
        : status === "pending"
          ? intBetween(0, 6)
          : intBetween(8, 96);
    const delayProbability =
      status === "delayed"
        ? between(0.6, 0.95)
        : status === "exception"
          ? between(0.7, 0.98)
          : between(0.03, 0.55);
    const healthScore = Math.round(
      status === "exception" ? between(28, 55) : between(62, 99),
    );
    const integrityScore = Math.round(between(94, 100));
    const weightKg = Math.round(between(120, 24000));
    const createdAt = new Date(
      BASE_TIME - intBetween(0, 21) * DAY - intBetween(0, 23) * HOUR,
    ).toISOString();
    const eta = new Date(
      BASE_TIME + intBetween(-2, 12) * DAY + intBetween(0, 23) * HOUR,
    ).toISOString();
    const ref = `CR-${String(2026000 + i).toString()}`;
    shipments.push({
      id: `shp_${i.toString().padStart(4, "0")}`,
      reference: ref,
      origin,
      destination,
      status,
      mode,
      customer: pick(CUSTOMER_NAMES),
      carrier: pick(CARRIERS),
      driverId: mode === "truck" ? `drv_${intBetween(0, 23)}` : null,
      vehicleId: mode === "truck" ? `veh_${intBetween(0, 23)}` : null,
      weightKg,
      volumeM3: Math.round(between(1, 68) * 10) / 10,
      valueUsd: Math.round(between(4000, 480000)),
      progress,
      createdAt,
      eta,
      healthScore,
      integrityScore,
      riskLevel: riskFrom(delayProbability),
      delayProbability: Math.round(delayProbability * 100) / 100,
      co2Kg: Math.round(
        weightKg *
          (mode === "plane" ? 0.6 : mode === "truck" ? 0.11 : mode === "rail" ? 0.03 : 0.016),
      ),
      priority: pick(["standard", "standard", "express", "critical"] as const),
      contents: pick(CONTENTS),
      ledgerHead: simHash(`${ref}-head`),
    });
  }
  return shipments;
}

// --------------------------------------------------------------------- Ledger
export function generateLedger(shipments: Shipment[]): LedgerEvent[] {
  const events: LedgerEvent[] = [];
  let previousHash =
    "0000000000000000000000000000000000000000000000000000000000000000";
  let blockIndex = 1;

  // Build a chronological chain of events per shipment.
  const flat: Array<{ s: Shipment; step: number; time: number }> = [];
  for (const s of shipments.slice(0, 60)) {
    const journeySteps = intBetween(3, 6);
    const start = new Date(s.createdAt).getTime();
    for (let step = 0; step < journeySteps; step++) {
      flat.push({ s, step, time: start + step * intBetween(4, 30) * HOUR });
    }
  }
  flat.sort((a, b) => a.time - b.time);

  const stepStatus: ShipmentStatus[] = [
    "pending",
    "in_transit",
    "at_warehouse",
    "customs",
    "out_for_delivery",
    "delivered",
  ];

  for (const { s, step, time } of flat) {
    const status = stepStatus[Math.min(step, stepStatus.length - 1)]!;
    const location =
      step === 0
        ? s.origin.label
        : step >= stepStatus.length - 1
          ? s.destination.label
          : pick(HUB_LIST).label;
    const nonce = intBetween(10000, 999999);
    const payload = `${s.reference}|${status}|${location}|${time}|${nonce}|${previousHash}`;
    const hash = simHash(payload);
    events.push({
      id: `evt_${blockIndex.toString().padStart(5, "0")}`,
      blockIndex,
      shipmentId: s.id,
      shipmentRef: s.reference,
      status,
      node: pick(NODES),
      location,
      timestamp: new Date(time).toISOString(),
      hash,
      previousHash,
      signature: simSignature(payload),
      verifier: pick(VERIFIERS),
      integrityScore: Math.round(between(96, 100)),
      nonce,
      confirmations: intBetween(12, 480),
      gas: Math.round(between(0.4, 3.2) * 1000) / 1000,
    });
    previousHash = hash;
    blockIndex++;
  }
  return events.reverse(); // newest first
}

// ----------------------------------------------------------------- Warehouses
const WH_DEFS = [
  { name: "Rotterdam Mega Hub", region: "EU-West", location: "Rotterdam, NL", x: 51.1, y: 21.3 },
  { name: "Newark Distribution", region: "US-East", location: "Newark, US", x: 29.4, y: 27.4 },
  { name: "Singapore Cross-Dock", region: "APAC", location: "Singapore, SG", x: 78.8, y: 49.2 },
  { name: "Dubai Bonded Zone", region: "ME-Central", location: "Dubai, AE", x: 65.3, y: 35.9 },
  { name: "Los Angeles Fulfilment", region: "US-West", location: "Los Angeles, US", x: 17.2, y: 30.5 },
  { name: "Shanghai East Depot", region: "APAC", location: "Shanghai, CN", x: 83.7, y: 32.0 },
  { name: "Hamburg Cold Storage", region: "EU-North", location: "Hamburg, DE", x: 52.7, y: 20.2 },
  { name: "São Paulo Regional", region: "LATAM", location: "São Paulo, BR", x: 37.1, y: 63.1 },
];

export function generateWarehouses(): Warehouse[] {
  const zoneTypes = ["ambient", "cold", "hazmat", "bonded"] as const;
  return WH_DEFS.map((w, i) => {
    const capacity = intBetween(18000, 60000);
    const utilization = Math.round(between(48, 96));
    const used = Math.round((capacity * utilization) / 100);
    const status =
      utilization > 88 ? "high_load" : i === 6 ? "maintenance" : "operational";
    return {
      id: `wh_${i}`,
      name: w.name,
      location: w.location,
      region: w.region,
      x: w.x,
      y: w.y,
      capacity,
      used,
      utilization,
      inboundToday: intBetween(40, 320),
      outboundToday: intBetween(38, 300),
      sku: intBetween(1200, 9800),
      status,
      temperatureC: Math.round(between(2, 22)),
      zones: zoneTypes.map((t, zi) => ({
        id: `wh_${i}_z${zi}`,
        name: `Zone ${String.fromCharCode(65 + zi)}`,
        utilization: Math.round(between(35, 98)),
        type: t,
      })),
    };
  });
}

// -------------------------------------------------------------------- Drivers
const DRIVER_NAMES = [
  "Marcus Vega", "Priya Nair", "Tomasz Kowalski", "Amara Okafor", "Chen Wei",
  "Sofia Rossi", "Liam O'Brien", "Fatima Al-Sayed", "Diego Santos", "Yuki Tanaka",
  "Hannah Berg", "Omar Haddad", "Isabella Moreno", "Kwame Mensah", "Elena Petrova",
  "Raj Patel", "Nora Lindqvist", "Mateo Alvarez", "Aisha Rahman", "Viktor Novak",
  "Grace Kim", "Samir Farouk", "Lena Vogel", "Carlos Mendes",
];

export function generateDrivers(): Driver[] {
  const statuses = ["on_route", "available", "off_duty", "resting"] as const;
  return DRIVER_NAMES.map((name, i) => ({
    id: `drv_${i}`,
    name,
    avatar: `https://avatars.githubusercontent.com/u/${1000 + i * 37}?v=4`,
    status: pick(statuses),
    rating: Math.round(between(3.8, 5) * 10) / 10,
    trustScore: Math.round(between(72, 99)),
    deliveries: intBetween(120, 2400),
    onTimeRate: Math.round(between(82, 99.5) * 10) / 10,
    vehicleId: `veh_${i}`,
    hoursThisWeek: intBetween(12, 46),
    license: `DL-${intBetween(100000, 999999)}`,
    phone: `+1 (555) ${intBetween(100, 999)}-${intBetween(1000, 9999)}`,
  }));
}

// ------------------------------------------------------------------- Vehicles
export function generateVehicles(): Vehicle[] {
  const types = ["semi", "box_truck", "van", "reefer"] as const;
  const models = ["Volvo FH16", "Freightliner Cascadia", "Tesla Semi", "Mercedes Actros", "Scania R500", "Ford E-Transit"];
  const fuels = ["diesel", "electric", "hydrogen"] as const;
  const statuses = ["active", "idle", "maintenance", "charging"] as const;
  return Array.from({ length: 24 }, (_, i) => {
    const odo = intBetween(20000, 480000);
    return {
      id: `veh_${i}`,
      plate: `${pick(["TX", "CA", "NY", "IL", "FL"])}-${intBetween(100, 999)}-${pick(["AB", "XZ", "QR", "MK"])}`,
      type: pick(types),
      model: pick(models),
      status: pick(statuses),
      fuelLevel: intBetween(8, 100),
      fuelType: pick(fuels),
      healthScore: Math.round(between(58, 99)),
      odometerKm: odo,
      nextServiceKm: odo + intBetween(500, 15000),
      driverId: `drv_${i}`,
      location: pick(HUB_LIST).label,
      utilization: Math.round(between(40, 96)),
      efficiencyMpg: Math.round(between(6.2, 12.4) * 10) / 10,
    };
  });
}

// ------------------------------------------------------------------ Customers
export function generateCustomers(): Customer[] {
  const tiers = ["starter", "business", "enterprise"] as const;
  return CUSTOMER_NAMES.map((name, i) => ({
    id: `cus_${i}`,
    name: name.split(" ")[0]! + " " + pick(["Chen", "Delgado", "Novak", "Ahmed", "Silva", "Yamada"]),
    company: name,
    avatar: `https://avatars.githubusercontent.com/u/${500 + i * 51}?v=4`,
    tier: pick(tiers),
    activeShipments: intBetween(2, 84),
    totalSpend: Math.round(between(24000, 1400000)),
    satisfaction: Math.round(between(78, 99)),
    since: new Date(BASE_TIME - intBetween(60, 900) * DAY).toISOString(),
    outstandingInvoices: intBetween(0, 6),
  }));
}

// ------------------------------------------------------------------- Invoices
export function generateInvoices(customers: Customer[]): Invoice[] {
  const statuses = ["paid", "paid", "pending", "overdue", "draft"] as const;
  return Array.from({ length: 32 }, (_, i) => {
    const c = pick(customers);
    const issued = BASE_TIME - intBetween(2, 120) * DAY;
    return {
      id: `inv_${i}`,
      number: `INV-2026-${String(1040 + i)}`,
      customer: c.company,
      amount: Math.round(between(1800, 96000)),
      status: pick(statuses),
      issued: new Date(issued).toISOString(),
      due: new Date(issued + 30 * DAY).toISOString(),
      items: intBetween(1, 24),
    };
  });
}

// ------------------------------------------------------------------ AI Insights
export function generateInsights(shipments: Shipment[]): AiInsight[] {
  const templates: Array<Omit<AiInsight, "id" | "createdAt" | "relatedShipment">> = [
    {
      type: "delay",
      title: "Port congestion risk at Singapore",
      description: "6 in-transit shipments route through Singapore where berth wait times rose 34% this week.",
      confidence: 91,
      impact: "high",
      recommendation: "Reroute 2 critical shipments via Port Klang to save an estimated 3.2 days.",
      savingsUsd: 48200,
    },
    {
      type: "route",
      title: "Optimized corridor: Rotterdam → Hamburg",
      description: "Rail-first multimodal path reduces cost and CO₂ versus the current road plan.",
      confidence: 87,
      impact: "medium",
      recommendation: "Switch 14 pallets to rail leg — cuts CO₂ by 62% and cost by $9,400.",
      savingsUsd: 9400,
    },
    {
      type: "risk",
      title: "Elevated weather risk on North Atlantic lane",
      description: "Storm system projected to intersect 3 ocean freight routes within 48h.",
      confidence: 78,
      impact: "high",
      recommendation: "Delay departure of CR-2026012 by 18h or hold at Rotterdam bonded zone.",
    },
    {
      type: "warehouse",
      title: "Newark hub nearing capacity",
      description: "Inbound forecast exceeds outbound throughput; utilization projected at 97% in 3 days.",
      confidence: 94,
      impact: "high",
      recommendation: "Divert 8% of inbound volume to Los Angeles Fulfilment.",
      savingsUsd: 21500,
    },
    {
      type: "demand",
      title: "Demand spike forecast: Consumer electronics",
      description: "Seasonal model predicts a 22% volume increase for APAC → US-West next 14 days.",
      confidence: 83,
      impact: "medium",
      recommendation: "Pre-position 3 reefer units and reserve air capacity now.",
    },
    {
      type: "cost",
      title: "Fuel hedging opportunity",
      description: "Diesel spot prices trending down; locking rates now reduces Q3 fleet spend.",
      confidence: 71,
      impact: "medium",
      recommendation: "Lock 60% of projected Q3 volume at current rate.",
      savingsUsd: 63800,
    },
    {
      type: "fraud",
      title: "Ledger anomaly flagged",
      description: "Event timestamp for CR-2026034 arrived out-of-sequence versus predecessor block.",
      confidence: 66,
      impact: "high",
      recommendation: "Trigger re-verification; integrity score dropped to 96.2.",
    },
    {
      type: "health",
      title: "Cold-chain drift on CR-2026008",
      description: "Simulated sensor telemetry shows temperature nearing upper threshold.",
      confidence: 88,
      impact: "high",
      recommendation: "Dispatch alert to carrier and pre-cool destination dock.",
    },
  ];
  return templates.map((t, i) => ({
    ...t,
    id: `ai_${i}`,
    createdAt: new Date(BASE_TIME - intBetween(0, 40) * HOUR).toISOString(),
    relatedShipment: pick(shipments).reference,
  }));
}

// -------------------------------------------------------------------- Activity
export function generateActivity(): ActivityLog[] {
  const actions: Array<{ action: string; type: ActivityLog["type"]; target: string }> = [
    { action: "created shipment", type: "create", target: "CR-2026041" },
    { action: "verified ledger block", type: "verify", target: "#48213" },
    { action: "updated route for", type: "update", target: "CR-2026019" },
    { action: "flagged anomaly on", type: "alert", target: "CR-2026034" },
    { action: "marked delivered", type: "update", target: "CR-2026007" },
    { action: "onboarded driver", type: "create", target: "Grace Kim" },
    { action: "archived shipment", type: "delete", target: "CR-2025992" },
    { action: "signed in from", type: "login", target: "Rotterdam, NL" },
    { action: "adjusted warehouse capacity", type: "update", target: "Newark Distribution" },
    { action: "approved invoice", type: "update", target: "INV-2026-1044" },
  ];
  const actors = ["Alex Rivera", "Sam Chen", "Jordan Blake", "Nadia Idris", "System"];
  return Array.from({ length: 14 }, (_, i) => {
    const a = actions[i % actions.length]!;
    return {
      id: `act_${i}`,
      actor: pick(actors),
      action: a.action,
      target: a.target,
      timestamp: new Date(BASE_TIME - i * intBetween(1, 5) * HOUR).toISOString(),
      type: a.type,
    };
  });
}

export { stringToSeed };
