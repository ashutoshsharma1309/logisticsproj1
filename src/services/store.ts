import {
  generateShipments,
  generateLedger,
  generateWarehouses,
  generateVehicles,
  generateDrivers,
  generateCustomers,
  generateInvoices,
  generateInsights,
  generateActivity,
} from "@/lib/data/generators";
import type {
  Shipment,
  LedgerEvent,
  Warehouse,
  Vehicle,
  Driver,
  Customer,
  Invoice,
  AiInsight,
  ActivityLog,
} from "@/types";

/**
 * Central in-memory data store. Everything is generated once, deterministically,
 * so both the server render and the client see identical data. This is the
 * single source of truth the feature "services" read from.
 */
interface DataStore {
  shipments: Shipment[];
  ledger: LedgerEvent[];
  warehouses: Warehouse[];
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  invoices: Invoice[];
  insights: AiInsight[];
  activity: ActivityLog[];
}

let cache: DataStore | null = null;

export function getStore(): DataStore {
  if (cache) return cache;
  const shipments = generateShipments(120);
  const customers = generateCustomers();
  cache = {
    shipments,
    ledger: generateLedger(shipments),
    warehouses: generateWarehouses(),
    vehicles: generateVehicles(),
    drivers: generateDrivers(),
    customers,
    invoices: generateInvoices(customers),
    insights: generateInsights(shipments),
    activity: generateActivity(),
  };
  return cache;
}
