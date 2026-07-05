import type { TransportMode, ShipmentStatus, UserRole } from "@/types";
import type {
  VehicleType,
  FuelType,
  VehicleStatus,
  DriverStatus,
  Priority,
  InvoiceStatus,
} from "@/lib/db/types";

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const TRANSPORT_MODES: Option<TransportMode>[] = [
  { value: "truck", label: "Road / Truck" },
  { value: "ship", label: "Ocean / Ship" },
  { value: "plane", label: "Air / Plane" },
  { value: "rail", label: "Rail" },
];

export const SHIPMENT_STATUSES: Option<ShipmentStatus>[] = [
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In Transit" },
  { value: "at_warehouse", label: "At Warehouse" },
  { value: "customs", label: "Customs" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
  { value: "exception", label: "Exception" },
];

export const PRIORITIES: Option<Priority>[] = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "critical", label: "Critical" },
];

export const VEHICLE_TYPES: Option<VehicleType>[] = [
  { value: "semi", label: "Semi-Trailer" },
  { value: "box_truck", label: "Box Truck" },
  { value: "van", label: "Van" },
  { value: "reefer", label: "Reefer (Refrigerated)" },
  { value: "trailer", label: "Trailer" },
];

export const FUEL_TYPES: Option<FuelType>[] = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "electric", label: "Electric" },
  { value: "hydrogen", label: "Hydrogen" },
  { value: "cng", label: "CNG" },
];

export const VEHICLE_STATUSES: Option<VehicleStatus>[] = [
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
  { value: "maintenance", label: "Maintenance" },
];

export const DRIVER_STATUSES: Option<DriverStatus>[] = [
  { value: "available", label: "Available" },
  { value: "on_route", label: "On Route" },
  { value: "off_duty", label: "Off Duty" },
];

export const INVOICE_STATUSES: Option<InvoiceStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export const ROLES: Option<UserRole>[] = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Operations Manager" },
  { value: "warehouse", label: "Warehouse Staff" },
  { value: "driver", label: "Fleet Driver" },
  { value: "customer", label: "Customer" },
];

export const CURRENCIES: Option[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
];

export const INDUSTRIES: Option[] = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "pharma", label: "Pharmaceuticals" },
  { value: "food", label: "Food & Beverage" },
  { value: "automotive", label: "Automotive" },
  { value: "electronics", label: "Electronics" },
  { value: "3pl", label: "3PL / Freight Forwarding" },
  { value: "other", label: "Other" },
];
