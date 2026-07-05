"use client";

import { repo, makeId } from "@/lib/db/collections";
import { readValue, writeValue } from "@/lib/db/client";
import { simHash } from "@/lib/hash";
import type { Account, Organization, Session } from "@/lib/db/types";
import type { UserRole } from "@/types";

/**
 * Client-side account/org store. Accounts and organizations live in the "global"
 * scope; per-org business data is scoped by orgId elsewhere.
 *
 * NOTE: password hashing here (`simHash`) is a functional stand-in, NOT secure
 * credential storage — in production the storage driver would be a server with a
 * proper KDF (argon2/bcrypt). Documented in docs/AUDIT.md.
 */
const accountsRepo = repo<Account>("global", "accounts");
const orgsRepo = repo<Organization>("global", "orgs");

const SALT = "chainroute::v1::";

export function hashPassword(password: string): string {
  return simHash(SALT + password);
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ---- accounts --------------------------------------------------------------
export function listAccounts(orgId?: string): Account[] {
  const all = accountsRepo.all();
  return orgId ? all.filter((a) => a.orgId === orgId) : all;
}

export function findAccountByEmail(email: string): Account | undefined {
  const target = email.trim().toLowerCase();
  return accountsRepo.all().find((a) => a.email.toLowerCase() === target);
}

export function getAccount(id: string): Account | undefined {
  return accountsRepo.get(id);
}

export function createAccount(input: {
  orgId: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
  status?: Account["status"];
}): Account {
  const now = new Date().toISOString();
  const account: Account = {
    id: makeId("usr"),
    orgId: input.orgId,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash ?? hashPassword(input.password ?? ""),
    role: input.role,
    avatar: "",
    status: input.status ?? "active",
    createdAt: now,
    lastActiveAt: now,
  };
  accountsRepo.insert(account);
  return account;
}

export function updateAccount(id: string, patch: Partial<Account>): Account | undefined {
  return accountsRepo.update(id, patch);
}

// ---- organizations ---------------------------------------------------------
export function getOrg(id: string): Organization | undefined {
  return orgsRepo.get(id);
}

export function createOrg(input: { name: string; email: string; currency?: string }): Organization {
  const org: Organization = {
    id: makeId("org"),
    name: input.name,
    legalName: "",
    industry: "",
    gstin: "",
    email: input.email.trim().toLowerCase(),
    phone: "",
    website: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    currency: input.currency ?? "USD",
    logo: "",
    onboarded: false,
    createdAt: new Date().toISOString(),
  };
  orgsRepo.insert(org);
  return org;
}

export function updateOrg(id: string, patch: Partial<Organization>): Organization | undefined {
  return orgsRepo.update(id, patch);
}

// ---- session ---------------------------------------------------------------
export function getSession(): Session | null {
  return readValue<Session>("session");
}

export function setSession(session: Session | null): void {
  writeValue("session", session);
}
