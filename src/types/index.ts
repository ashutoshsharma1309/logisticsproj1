export type UserRole = "admin" | "manager" | "warehouse" | "driver" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  company: string;
  status: "active" | "invited" | "suspended";
  lastActive: string;
}

export type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "at_warehouse"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "exception";

export type TransportMode = "truck" | "ship" | "plane" | "rail";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface GeoPoint {
  lat: number;
  lng: number;
  /** normalized 0-100 coordinates for the schematic SVG world map */
  x: number;
  y: number;
  label: string;
}

export interface Shipment {
  id: string;
  reference: string;
  origin: GeoPoint;
  destination: GeoPoint;
  status: ShipmentStatus;
  mode: TransportMode;
  customer: string;
  carrier: string;
  driverId: string | null;
  vehicleId: string | null;
  weightKg: number;
  volumeM3: number;
  valueUsd: number;
  progress: number; // 0-100
  createdAt: string;
  eta: string;
  healthScore: number; // 0-100
  integrityScore: number; // 0-100
  riskLevel: RiskLevel;
  delayProbability: number; // 0-1
  co2Kg: number;
  priority: "standard" | "express" | "critical";
  contents: string;
  ledgerHead: string; // latest block hash
}

export interface LedgerEvent {
  id: string;
  blockIndex: number;
  shipmentId: string;
  shipmentRef: string;
  status: ShipmentStatus;
  node: string;
  location: string;
  timestamp: string;
  hash: string;
  previousHash: string;
  signature: string;
  verifier: string;
  integrityScore: number;
  nonce: number;
  confirmations: number;
  gas: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  region: string;
  x: number;
  y: number;
  capacity: number;
  used: number;
  utilization: number; // 0-100
  inboundToday: number;
  outboundToday: number;
  sku: number;
  status: "operational" | "high_load" | "maintenance";
  temperatureC: number;
  zones: WarehouseZone[];
}

export interface WarehouseZone {
  id: string;
  name: string;
  utilization: number;
  type: "ambient" | "cold" | "hazmat" | "bonded";
}

export interface Vehicle {
  id: string;
  plate: string;
  type: "semi" | "box_truck" | "van" | "reefer";
  model: string;
  status: "active" | "idle" | "maintenance" | "charging";
  fuelLevel: number;
  fuelType: "diesel" | "electric" | "hydrogen";
  healthScore: number;
  odometerKm: number;
  nextServiceKm: number;
  driverId: string | null;
  location: string;
  utilization: number;
  efficiencyMpg: number;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  status: "on_route" | "available" | "off_duty" | "resting";
  rating: number;
  trustScore: number; // simulated decentralized trust
  deliveries: number;
  onTimeRate: number;
  vehicleId: string | null;
  hoursThisWeek: number;
  license: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  avatar: string;
  tier: "starter" | "business" | "enterprise";
  activeShipments: number;
  totalSpend: number;
  satisfaction: number;
  since: string;
  outstandingInvoices: number;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  issued: string;
  due: string;
  items: number;
}

export interface AiInsight {
  id: string;
  type:
    | "delay"
    | "route"
    | "risk"
    | "warehouse"
    | "demand"
    | "cost"
    | "fraud"
    | "health";
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: "low" | "medium" | "high";
  recommendation: string;
  savingsUsd?: number;
  relatedShipment?: string;
  createdAt: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  formatted: string;
  delta: number; // percent change
  trend: "up" | "down" | "flat";
  positive: boolean;
  spark: number[];
  icon: string;
}

export interface TimeSeriesPoint {
  label: string;
  [key: string]: string | number;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  type: "create" | "update" | "delete" | "verify" | "alert" | "login";
}

export interface SimNode {
  id: string;
  type: "port" | "airport" | "warehouse" | "hub" | "city";
  label: string;
  x: number;
  y: number;
  glow: boolean;
}

export interface SimRoute {
  id: string;
  from: string;
  to: string;
  mode: TransportMode;
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
  controlPoint: { x: number; y: number };
  shipmentRef: string;
  progress: number;
  healthScore: number;
}
