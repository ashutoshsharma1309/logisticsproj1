"use client";

import { repo } from "@/lib/db/collections";
import { makeId } from "@/lib/db/client";
import { logAudit, pushNotification } from "@/lib/db/audit";
import { mintLedgerBlock } from "@/lib/ledger/mint";
import { seededRandom } from "@/lib/hash";
import { shipmentCost } from "@/lib/domain/calc";
import type {
  Warehouse,
  Vehicle,
  Driver,
  Customer,
  Shipment,
  Invoice,
  LedgerBlock,
  AuditLog,
  AppNotification,
  CollectionName,
} from "@/lib/db/types";
import type { ShipmentStatus, TransportMode } from "@/types";

/**
 * OPT-IN sample dataset for demos / hosted previews. This is never loaded
 * automatically — a user explicitly clicks "Load demo data". It writes to the
 * same real collections as manual entry (and mints a real ledger chain), so the
 * app behaves identically to a hand-populated workspace. `clearWorkspace`
 * removes everything again.
 */

const rnd = seededRandom(424242);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;
const int = (min: number, max: number) => Math.floor(min + rnd() * (max - min + 1));
const now = Date.now();
const DAY = 86_400_000;

export function clearWorkspace(orgId: string): void {
  const names: CollectionName[] = [
    "shipments",
    "ledger",
    "warehouses",
    "vehicles",
    "drivers",
    "customers",
    "invoices",
    "audit",
    "notifications",
  ];
  for (const n of names) repo(orgId, n).replaceAll([]);
}

export function seedSampleData(
  orgId: string,
  actor: { id: string; name: string },
): void {
  clearWorkspace(orgId);

  const wRepo = repo<Warehouse>(orgId, "warehouses");
  const vRepo = repo<Vehicle>(orgId, "vehicles");
  const dRepo = repo<Driver>(orgId, "drivers");
  const cRepo = repo<Customer>(orgId, "customers");
  const sRepo = repo<Shipment>(orgId, "shipments");
  const iRepo = repo<Invoice>(orgId, "invoices");

  const stamp = (i: number) => new Date(now - (30 - i) * DAY - int(0, 12) * 3_600_000).toISOString();

  // ---- warehouses ----
  const whDefs = [
    { name: "Rotterdam Mega Hub", code: "RTM-01", city: "Rotterdam", country: "Netherlands", cap: 58000 },
    { name: "Newark Distribution", code: "EWR-02", city: "Newark", country: "USA", cap: 42000 },
    { name: "Singapore Cross-Dock", code: "SIN-03", city: "Singapore", country: "Singapore", cap: 36000 },
    { name: "Mumbai Regional", code: "BOM-04", city: "Mumbai", country: "India", cap: 30000 },
  ];
  const warehouses = whDefs.map((w, i) =>
    wRepo.insert({
      id: makeId("war"),
      orgId,
      name: w.name,
      code: w.code,
      addressLine1: `${int(1, 400)} Logistics Park`,
      city: w.city,
      state: "",
      country: w.country,
      capacityUnits: w.cap,
      usedUnits: Math.round(w.cap * (0.5 + rnd() * 0.42)),
      serviceAreas: pick([["Regional", "National"], ["National", "Export"], ["Regional"]]),
      contactName: pick(["Priya Nair", "Tom Vega", "Chen Wei", "Sara Idris"]),
      contactPhone: `+1 (555) ${int(100, 999)}-${int(1000, 9999)}`,
      createdAt: stamp(i),
    }),
  );

  // ---- drivers + vehicles (linked) ----
  const driverNames = ["Marcus Vega", "Priya Nair", "Diego Santos", "Yuki Tanaka", "Elena Petrova"];
  const vTypes = ["semi", "box_truck", "van", "reefer", "trailer"] as const;
  const fuels = ["diesel", "electric", "hydrogen", "cng"] as const;
  const drivers: Driver[] = [];
  const vehicles: Vehicle[] = [];
  driverNames.forEach((name, i) => {
    const driverId = makeId("dri");
    const vehicleId = makeId("veh");
    drivers.push(
      dRepo.insert({
        id: driverId,
        orgId,
        name,
        phone: `+1 (555) ${int(100, 999)}-${int(1000, 9999)}`,
        email: `${name.split(" ")[0]!.toLowerCase()}@fleet.example`,
        licenseNo: `DL-${int(100000, 999999)}`,
        status: pick(["available", "on_route", "off_duty"] as const),
        vehicleId,
        createdAt: stamp(i),
      }),
    );
    vehicles.push(
      vRepo.insert({
        id: vehicleId,
        orgId,
        plate: `${pick(["TX", "CA", "NY", "IL"])}-${int(100, 999)}-${pick(["AB", "XZ", "QR"])}`,
        makeModel: pick(["Volvo FH16", "Tesla Semi", "Scania R500", "Mercedes Actros", "Ford E-Transit"]),
        type: vTypes[i % vTypes.length]!,
        fuelType: fuels[i % fuels.length]!,
        capacityKg: int(3000, 26000),
        odometerKm: int(20000, 320000),
        status: pick(["active", "idle", "maintenance"] as const),
        driverId,
        purchaseCost: int(60000, 180000),
        monthlyMaintenanceCost: int(400, 2400),
        fuelCostPerKm: Math.round((0.2 + rnd() * 0.6) * 100) / 100,
        createdAt: stamp(i),
      }),
    );
  });

  // ---- customers ----
  const custDefs = [
    "Aperture Manufacturing", "Northwind Traders", "Volt Electronics",
    "Sunrise Foods Co.", "Cobalt Pharma", "Everest Apparel",
  ];
  const customers = custDefs.map((company, i) =>
    cRepo.insert({
      id: makeId("cus"),
      orgId,
      name: pick(["Alex Chen", "Sara Delgado", "Ravi Menon", "Nina Novak", "Omar Haddad"]),
      company,
      email: `ops@${company.split(" ")[0]!.toLowerCase()}.example`,
      phone: `+1 (555) ${int(100, 999)}-${int(1000, 9999)}`,
      gstin: `GST${int(100000000, 999999999)}`,
      addressLine1: `${int(1, 900)} Commerce St`,
      city: pick(["Chicago", "Berlin", "Dubai", "Mumbai", "Singapore"]),
      state: "",
      country: pick(["USA", "Germany", "UAE", "India", "Singapore"]),
      createdAt: stamp(i),
    }),
  );

  // ---- shipments (+ minted ledger) ----
  const modes: TransportMode[] = ["truck", "ship", "plane", "rail"];
  const statuses: ShipmentStatus[] = [
    "pending", "in_transit", "at_warehouse", "customs", "out_for_delivery", "delivered", "delayed",
  ];
  const destCities = ["Denver", "Hamburg", "Lyon", "Osaka", "Austin", "Pune", "Lisbon", "Detroit"];
  for (let i = 0; i < 14; i++) {
    const wh = pick(warehouses);
    const cust = pick(customers);
    const status = statuses[i % statuses.length]!;
    const mode = modes[i % modes.length]!;
    const created = stamp(int(0, 28));
    const shipment = sRepo.insert({
      id: makeId("shp"),
      orgId,
      reference: `CR-${100001 + i}`,
      customerId: cust.id,
      originWarehouseId: wh.id,
      destinationCity: pick(destCities),
      destinationState: "",
      destinationCountry: pick(["USA", "Germany", "France", "Japan", "India"]),
      mode,
      status,
      priority: pick(["standard", "express", "critical"] as const),
      weightKg: int(200, 18000),
      distanceKm: int(300, 9000),
      packages: int(1, 40),
      freightCharge: int(1200, 12000),
      fuelCost: int(200, 3200),
      packagingCost: int(50, 900),
      insuranceCost: int(80, 1400),
      otherCost: int(0, 600),
      taxRatePct: pick([5, 12, 18]),
      driverId: mode === "truck" ? pick(drivers).id : null,
      vehicleId: mode === "truck" ? pick(vehicles).id : null,
      eta: new Date(now + int(-3, 12) * DAY).toISOString(),
      notes: "",
      createdAt: created,
      updatedAt: created,
    });
    // mint a short chain of ledger events for this shipment's journey
    const journey: ShipmentStatus[] = ["pending", "in_transit", status];
    for (const st of [...new Set(journey)]) {
      mintLedgerBlock(orgId, shipment, st, st === "pending" ? wh.city : shipment.destinationCity);
    }
    // invoice for delivered/in-progress shipments
    if (i % 2 === 0) {
      const c = shipmentCost(shipment);
      iRepo.insert({
        id: makeId("inv"),
        orgId,
        number: `INV-${1000 + i}`,
        customerId: cust.id,
        shipmentId: shipment.id,
        subtotal: c.subtotal,
        taxAmount: c.tax,
        total: c.total,
        status: pick(["paid", "sent", "overdue", "draft"] as const),
        issuedAt: created,
        dueAt: new Date(new Date(created).getTime() + 30 * DAY).toISOString(),
      });
    }
  }

  logAudit({
    orgId,
    actorId: actor.id,
    actorName: actor.name,
    action: "create",
    entity: "workspace",
    summary: "Loaded sample demo dataset",
  });
  pushNotification({
    orgId,
    title: "Demo data loaded",
    body: "A sample logistics network has been added. Reset anytime from Settings.",
    kind: "success",
    href: "/dashboard",
  });
}

/** exported for typing convenience in callers */
export type { LedgerBlock, AuditLog, AppNotification };
