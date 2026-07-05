import type { UserRole, TransportMode, ShipmentStatus } from "@/types";

export type { UserRole, TransportMode, ShipmentStatus };

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  gstin: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  currency: string;
  logo: string; // data URL
  onboarded: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  orgId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar: string;
  status: "active" | "invited" | "suspended";
  createdAt: string;
  lastActiveAt: string;
}

export type VehicleType = "semi" | "box_truck" | "van" | "reefer" | "trailer";
export type FuelType = "diesel" | "petrol" | "electric" | "hydrogen" | "cng";
export type VehicleStatus = "active" | "idle" | "maintenance";
export type DriverStatus = "available" | "on_route" | "off_duty";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type Priority = "standard" | "express" | "critical";

export interface Warehouse {
  id: string;
  orgId: string;
  name: string;
  code: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  capacityUnits: number;
  usedUnits: number;
  serviceAreas: string[];
  contactName: string;
  contactPhone: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  orgId: string;
  plate: string;
  makeModel: string;
  type: VehicleType;
  fuelType: FuelType;
  capacityKg: number;
  odometerKm: number;
  status: VehicleStatus;
  driverId: string | null;
  purchaseCost: number;
  monthlyMaintenanceCost: number;
  fuelCostPerKm: number;
  createdAt: string;
}

export interface Driver {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string;
  licenseNo: string;
  status: DriverStatus;
  vehicleId: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  gstin: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orgId: string;
  reference: string;
  customerId: string;
  originWarehouseId: string;
  destinationCity: string;
  destinationState: string;
  destinationCountry: string;
  mode: TransportMode;
  status: ShipmentStatus;
  priority: Priority;
  weightKg: number;
  distanceKm: number;
  packages: number;
  // Cost breakdown — all user-entered, currency = org currency
  freightCharge: number;
  fuelCost: number;
  packagingCost: number;
  insuranceCost: number;
  otherCost: number;
  taxRatePct: number; // GST / VAT
  driverId: string | null;
  vehicleId: string | null;
  eta: string; // ISO date
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerBlock {
  id: string;
  orgId: string;
  blockIndex: number;
  shipmentId: string;
  shipmentRef: string;
  status: ShipmentStatus;
  action: string;
  location: string;
  node: string;
  verifier: string;
  hash: string;
  previousHash: string;
  signature: string;
  integrityScore: number;
  nonce: number;
  timestamp: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  number: string;
  customerId: string;
  shipmentId: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  actorId: string;
  actorName: string;
  action: "create" | "update" | "delete" | "verify" | "login" | "settings";
  entity: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export type NotificationKind = "info" | "success" | "warning" | "alert";

export interface AppNotification {
  id: string;
  orgId: string;
  title: string;
  body: string;
  kind: NotificationKind;
  href: string;
  read: boolean;
  createdAt: string;
}

/** Session pointer persisted outside org scope. */
export interface Session {
  userId: string;
  orgId: string;
}

export interface CollectionMap {
  warehouses: Warehouse;
  vehicles: Vehicle;
  drivers: Driver;
  customers: Customer;
  shipments: Shipment;
  ledger: LedgerBlock;
  invoices: Invoice;
  audit: AuditLog;
  notifications: AppNotification;
}

export type CollectionName = keyof CollectionMap;
