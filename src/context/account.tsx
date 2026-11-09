import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { getSupabaseClient } from "../lib/supabase";

export type AccountRole = "seeker" | "owner" | "agent" | "admin";
export type SelfAssignableRole = Exclude<AccountRole, "admin">;

export type Account = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  isVerified: boolean;
};

export type ProfileRoleRequest = {
  requestedRole: "owner" | "agent";
  status: "pending" | "approved" | "rejected" | "needs_info";
  legalName: string | null;
  phoneNumber: string | null;
  agencyName: string | null;
  officeAddress: string | null;
  propertyAddress: string | null;
  documentFiles: VerificationDocument[];
  applicationSubmitted: boolean;
  submittedAt: string | null;
  decisionReason: string | null;
};

export type VerificationDocumentType =
  | "government_id"
  | "ownership_proof"
  | "professional_credential"
  | "agency_registration"
  | "other";

export type VerificationDocument = {
  path: string;
  fileName: string;
  contentType: string;
  size: number;
  documentType: VerificationDocumentType;
};

type AccountContextValue = {
  account: Account | null;
  roleRequest: ProfileRoleRequest | null;
  authLoading: boolean;
  authError: string | null;
  selectedRole: SelfAssignableRole;
  setSelectedRole: (role: SelfAssignableRole) => void;
  refreshAccount: () => Promise<void>;
  requestRoleChange: () => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    requestedRole?: SelfAssignableRole,
  ) => Promise<{ emailConfirmationRequired: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateAccount: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function toUserMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function parseVerificationDocuments(value: unknown): VerificationDocument[] {
  if (!Array.isArray(value)) {
    throw new Error("The verification application has invalid document data.");
  }

  return value.map((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("path" in item) ||
      typeof item.path !== "string" ||
      !("fileName" in item) ||
      typeof item.fileName !== "string" ||
      !("contentType" in item) ||
      typeof item.contentType !== "string" ||
      !("size" in item) ||
      typeof item.size !== "number" ||
      !("documentType" in item) ||
      !isVerificationDocumentType(item.documentType)
    ) {
      throw new Error(
        "The verification application has invalid document data.",
      );
    }

    return {
      path: item.path,
      fileName: item.fileName,
      contentType: item.contentType,
      size: item.size,
      documentType: item.documentType,
    };
  });
}

function isVerificationDocumentType(
  value: unknown,
): value is VerificationDocumentType {
  return (
    value === "government_id" ||
    value === "ownership_proof" ||
    value === "professional_credential" ||
    value === "agency_registration" ||
    value === "other"
  );
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [roleRequest, setRoleRequest] = useState<ProfileRoleRequest | null>(
    null,
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedRole, setSelectedRoleState] =
    useState<SelfAssignableRole>("seeker");

  const authVersion = useRef(0);

  const loadAccount = useCallback(
    async (session: Session | null, version: number) => {
      if (!session) {
        if (version !== authVersion.current) {
          return;
        }

        setAccount(null);
        setRoleRequest(null);
        setSelectedRoleState("seeker");
        setAuthError(null);
        setAuthLoading(false);
        return;
      }

      const client = getSupabaseClient();

      const { data, error } = await client
        .from("profiles")
        .select("id, display_name, role, is_verified")
        .eq("id", session.user.id)
        .single();

      if (error) {
        throw error;
      }

      if (version !== authVersion.current) {
        return;
      }

      const { data: request, error: requestError } = await client
        .from("profile_role_requests")
        .select(
          "requested_role, status, legal_name, phone_number, agency_name, office_address, property_address, document_files, application_submitted, submitted_at, decision_reason",
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) {
        throw requestError;
      }

      if (version !== authVersion.current) {
        return;
      }

      setAccount({
        id: data.id,
        name: data.display_name,
        email: session.user.email ?? "",
        role: data.role,
        isVerified: data.is_verified,
      });

      setRoleRequest(
        request
          ? {
              requestedRole: request.requested_role,
              status: request.status,
              legalName: request.legal_name,
              phoneNumber: request.phone_number,
              agencyName: request.agency_name,
              officeAddress: request.office_address,
              propertyAddress: request.property_address,
              documentFiles: parseVerificationDocuments(request.document_files),
              applicationSubmitted: request.application_submitted,
              submittedAt: request.submitted_at,
              decisionReason: request.decision_reason,
            }
          : null,
      );

      // Remember whether the user registered as an Agent or Owner.
      // The actual profile role remains unchanged until administrator approval.
      setSelectedRoleState(
        request?.requested_role === "agent" ||
          request?.requested_role === "owner"
          ? request.requested_role
          : data.role === "admin"
            ? "seeker"
            : data.role,
      );

      setAuthError(null);
      setAuthLoading(false);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    const loadInitialSession = async () => {
      const version = ++authVersion.current;

      try {
        const { data, error } = await client.auth.getSession();

        if (error) {
          throw error;
        }

        if (active) {
          await loadAccount(data.session, version);
        }
      } catch (error) {
        if (active && version === authVersion.current) {
          setAuthError(toUserMessage(error));
          setAuthLoading(false);
        }
      }
    };

    void loadInitialSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      const version = ++authVersion.current;

      if (!session) {
        setAccount(null);
        setRoleRequest(null);
        setSelectedRoleState("seeker");
        setAuthError(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      void Promise.resolve()
        .then(() => loadAccount(session, version))
        .catch((error) => {
          if (active && version === authVersion.current) {
            setAuthError(toUserMessage(error));
            setAuthLoading(false);
          }
        });
    });

    const handleAuthUrl = async (url: string) => {
      try {
        const parsedUrl = new URL(url);
        const fragment = new URLSearchParams(parsedUrl.hash.slice(1));

        const type = parsedUrl.searchParams.get("type") ?? fragment.get("type");

        if (type !== "recovery") {
          return;
        }

        const code = parsedUrl.searchParams.get("code");

        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          return;
        }

        const accessToken =
          parsedUrl.searchParams.get("access_token") ??
          fragment.get("access_token");

        const refreshToken =
          parsedUrl.searchParams.get("refresh_token") ??
          fragment.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        }
      } catch (error) {
        if (active) {
          setAuthError(toUserMessage(error));
        }
      }
    };

    const urlSubscription = Linking.addEventListener("url", ({ url }) => {
      void handleAuthUrl(url);
    });

    void Linking.getInitialURL()
      .then((url) => (url ? handleAuthUrl(url) : undefined))
      .catch((error) => {
        if (active) {
          setAuthError(toUserMessage(error));
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, [loadAccount]);

  const setSelectedRole = useCallback((role: SelfAssignableRole) => {
    setSelectedRoleState(role);
  }, []);

  const refreshAccount = useCallback(async () => {
    const client = getSupabaseClient();

    setAuthLoading(true);
    setAuthError(null);

    const version = ++authVersion.current;

    try {
      const { data, error } = await client.auth.getSession();

      if (error) {
        throw error;
      }

      await loadAccount(data.session, version);
    } catch (error) {
      if (version === authVersion.current) {
        setAuthError(toUserMessage(error));
        setAuthLoading(false);
      }

      throw error;
    }
  }, [loadAccount]);

  const requestRoleChange = useCallback(async () => {
    const client = getSupabaseClient();

    const { data: userData, error: userError } = await client.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!userData.user || !account || userData.user.id !== account.id) {
      throw new Error("Your session changed. Please sign in again.");
    }

    if (selectedRole === account.role) {
      return;
    }

    if (selectedRole === "seeker") {
      throw new Error("Changing back to a seeker profile requires support.");
    }

    const { error } = await client.from("profile_role_requests").insert({
      user_id: userData.user.id,
      requested_role: selectedRole,
    });

    if (error) {
      throw error;
    }

    await refreshAccount();
  }, [account, refreshAccount, selectedRole]);

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      requestedRole?: SelfAssignableRole,
    ) => {
      const roleToSave = requestedRole ?? selectedRole;

      const { data, error } = await getSupabaseClient().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: name.trim(),
            requested_role: roleToSave,
          },
        },
      });

      if (error) {
        throw error;
      }

      return { emailConfirmationRequired: !data.session };
    },
    [selectedRole],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: Linking.createURL("reset-password") },
    );

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await getSupabaseClient().auth.updateUser({ password });

    if (error) {
      throw error;
    }
  }, []);

  const updateAccount = useCallback(
    async (name: string) => {
      const client = getSupabaseClient();

      const { data: userData, error: userError } = await client.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!userData.user || !account || userData.user.id !== account.id) {
        throw new Error("Your session changed. Please sign in again.");
      }

      const { data, error } = await client
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", userData.user.id)
        .select("id, display_name, role, is_verified")
        .single();

      if (error) {
        throw error;
      }

      setAccount((current) =>
        current && data ? { ...current, name: data.display_name } : current,
      );
    },
    [account],
  );

  const signOut = useCallback(async () => {
    const version = ++authVersion.current;

    setAuthLoading(true);
    setAuthError(null);
    setAccount(null);
    setRoleRequest(null);
    setSelectedRoleState("seeker");

    try {
      const { error } = await getSupabaseClient().auth.signOut({
        scope: "local",
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      if (version === authVersion.current) {
        try {
          const { data, error: sessionError } =
            await getSupabaseClient().auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          await loadAccount(data.session, version);
        } catch (restoreError) {
          setAuthError(toUserMessage(restoreError));
          setAuthLoading(false);
        }
      }

      throw error;
    }

    if (version === authVersion.current) {
      setAuthLoading(false);
    }
  }, [loadAccount]);

  const value = useMemo(
    () => ({
      account,
      roleRequest,
      authLoading,
      authError,
      selectedRole,
      setSelectedRole,
      refreshAccount,
      requestRoleChange,
      signUp,
      signIn,
      sendPasswordReset,
      updatePassword,
      updateAccount,
      signOut,
    }),
    [
      account,
      roleRequest,
      authLoading,
      authError,
      selectedRole,
      setSelectedRole,
      refreshAccount,
      requestRoleChange,
      signUp,
      signIn,
      sendPasswordReset,
      updatePassword,
      updateAccount,
      signOut,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }

  return context;
}

export { toUserMessage };
