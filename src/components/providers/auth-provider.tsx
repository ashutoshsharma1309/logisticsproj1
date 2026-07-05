"use client";

import * as React from "react";
import { subscribe, readValue, writeValue } from "@/lib/db/client";
import {
  getSession,
  setSession,
  findAccountByEmail,
  createAccount,
  createOrg,
  getOrg,
  getAccount,
  updateAccount,
  updateOrg,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/accounts";
import type { Account, Organization, Session } from "@/lib/db/types";
import type { UserRole } from "@/types";

export type AuthStatus = "loading" | "authed" | "guest";

interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company: string;
}

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  account: Account | null;
  org: Organization | null;
  orgId: string | null;
  signUp: (input: SignUpInput) => Account;
  signIn: (email: string, password: string) => Account;
  signOut: () => void;
  updateProfile: (patch: Partial<Account>) => void;
  updateOrganization: (patch: Partial<Organization>) => void;
  changePassword: (current: string, next: string) => void;
  requestReset: (email: string) => string; // returns the demo code
  resetPassword: (email: string, code: string, password: string) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function resolve(): { session: Session | null; account: Account | null; org: Organization | null } {
  const session = getSession();
  if (!session) return { session: null, account: null, org: null };
  const account = getAccount(session.userId) ?? null;
  const org = getOrg(session.orgId) ?? null;
  if (!account || !org) return { session: null, account: null, org: null };
  return { session, account, org };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [state, setState] = React.useState<{
    session: Session | null;
    account: Account | null;
    org: Organization | null;
  }>({ session: null, account: null, org: null });

  React.useEffect(() => {
    setMounted(true);
    setState(resolve());
    const unsub = subscribe(() => setState(resolve()));
    return unsub;
  }, []);

  const value = React.useMemo<AuthContextValue>(() => {
    const status: AuthStatus = !mounted
      ? "loading"
      : state.account
        ? "authed"
        : "guest";

    return {
      status,
      session: state.session,
      account: state.account,
      org: state.org,
      orgId: state.org?.id ?? null,

      signUp: ({ name, email, password, role, company }) => {
        if (findAccountByEmail(email)) {
          throw new Error("An account with this email already exists.");
        }
        const org = createOrg({ name: company || `${name}'s Organization`, email });
        const account = createAccount({ orgId: org.id, name, email, password, role });
        setSession({ userId: account.id, orgId: org.id });
        return account;
      },

      signIn: (email, password) => {
        const account = findAccountByEmail(email);
        if (!account || !verifyPassword(password, account.passwordHash)) {
          throw new Error("Invalid email or password.");
        }
        if (account.status === "suspended") throw new Error("This account is suspended.");
        updateAccount(account.id, { lastActiveAt: new Date().toISOString() });
        setSession({ userId: account.id, orgId: account.orgId });
        return account;
      },

      signOut: () => setSession(null),

      updateProfile: (patch) => {
        if (state.account) updateAccount(state.account.id, patch);
      },

      updateOrganization: (patch) => {
        if (state.org) updateOrg(state.org.id, patch);
      },

      changePassword: (current, next) => {
        if (!state.account) throw new Error("Not signed in.");
        if (!verifyPassword(current, state.account.passwordHash)) {
          throw new Error("Current password is incorrect.");
        }
        updateAccount(state.account.id, { passwordHash: hashPassword(next) });
      },

      requestReset: (email) => {
        const account = findAccountByEmail(email);
        if (!account) throw new Error("No account found for that email.");
        // 6-digit code derived from a rotating counter (no PRNG in render path).
        const seed = (Date.now() % 900000) + 100000;
        const code = String(seed).slice(0, 6);
        writeValue(`reset:${email.toLowerCase()}`, { code, at: Date.now() });
        return code;
      },

      resetPassword: (email, code, password) => {
        const stored = readValue<{ code: string; at: number }>(`reset:${email.toLowerCase()}`);
        if (!stored || stored.code !== code) throw new Error("Invalid or expired reset code.");
        const account = findAccountByEmail(email);
        if (!account) throw new Error("No account found for that email.");
        updateAccount(account.id, { passwordHash: hashPassword(password) });
        writeValue(`reset:${email.toLowerCase()}`, null);
      },
    };
  }, [mounted, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
