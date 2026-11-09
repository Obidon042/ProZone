import { getSupabaseClient } from "./supabase";
import type {
  VerificationDocument,
  VerificationDocumentType,
} from "../context/account";

export type AdminDashboardStats = {
  totalUsers: number;
  seekers: number;
  agents: number;
  owners: number;
  pendingAgents: number;
  pendingOwners: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvedAgents: number;
  approvedOwners: number;
  needsInfoAgents: number;
  needsInfoOwners: number;
};

export type AdminRoleRequest = {
  id: string;
  userId: string;
  requestedRole: "agent" | "owner";
  status: "pending" | "approved" | "rejected" | "needs_info";
  createdAt: string;
  submittedAt: string | null;
  displayName: string;
  profileRole: string;
  isVerified: boolean;
  email: string;
  legalName: string | null;
  phoneNumber: string | null;
  agencyName: string | null;
  officeAddress: string | null;
  propertyAddress: string | null;
  documents: VerificationDocument[];
  decisionReason: string | null;
  decidedAt: string | null;
  decisionHistory: {
    action: string;
    reason: string | null;
    createdAt: string;
    adminName: string;
  }[];
};
export type AdminDecisionAction = "approve" | "reject" | "request_info";

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data, error } = await getSupabaseClient().rpc("admin_dashboard_stats");
  if (error) {
    throw error;
  }
  const stats = data?.[0];
  if (!stats) {
    throw new Error("The administrator dashboard returned no statistics.");
  }
  return {
    totalUsers: stats.total_users,
    seekers: stats.seekers,
    agents: stats.agents,
    owners: stats.owners,
    pendingAgents: stats.pending_agents,
    pendingOwners: stats.pending_owners,
    approvedRequests: stats.approved_requests,
    rejectedRequests: stats.rejected_requests,
    approvedAgents: stats.approved_agents,
    approvedOwners: stats.approved_owners,
    needsInfoAgents: stats.needs_info_agents,
    needsInfoOwners: stats.needs_info_owners,
  };
}

export async function getAdminRoleRequests(
  status: AdminRoleRequest["status"] | null,
): Promise<AdminRoleRequest[]> {
  const { data, error } = await getSupabaseClient().rpc(
    "admin_list_role_requests",
    { p_status: status },
  );
  if (error) {
    throw error;
  }
  return (data ?? []).map((request) => {
    const history = parseJsonArray(request.decision_history);
    return {
      id: request.id,
      userId: request.user_id,
      requestedRole: parseRequestedRole(request.requested_role),
      status: parseStatus(request.status),
      createdAt: request.created_at,
      submittedAt: request.submitted_at,
      displayName: request.display_name,
      profileRole: request.profile_role,
      isVerified: request.is_verified,
      email: request.email,
      legalName: request.legal_name,
      phoneNumber: request.phone_number,
      agencyName: request.agency_name,
      officeAddress: request.office_address,
      propertyAddress: request.property_address,
      documents: parseDocuments(request.document_files),
      decisionReason: request.decision_reason,
      decidedAt: request.decided_at,
      decisionHistory: history.map((entry) => ({
        action: readString(entry, "action"),
        reason: readNullableString(entry, "reason"),
        createdAt: readString(entry, "created_at"),
        adminName: readString(entry, "admin_name"),
      })),
    };
  });
}

function parseRequestedRole(role: string): "agent" | "owner" {
  if (role !== "agent" && role !== "owner") {
    throw new Error("The database returned an invalid requested role.");
  }
  return role;
}

function parseStatus(status: string): AdminRoleRequest["status"] {
  if (
    status !== "pending" &&
    status !== "approved" &&
    status !== "rejected" &&
    status !== "needs_info"
  ) {
    throw new Error("The database returned an invalid request status.");
  }
  return status;
}

function parseDocuments(value: unknown): VerificationDocument[] {
  return parseJsonArray(value).map((document) => {
    const documentType = readString(document, "documentType");
    if (!isDocumentType(documentType)) {
      throw new Error("The database returned an invalid document category.");
    }
    return {
      path: readString(document, "path"),
      fileName: readString(document, "fileName"),
      contentType: readString(document, "contentType"),
      size: readNumber(document, "size"),
      documentType,
    };
  });
}

function parseJsonArray(value: unknown): Record<string, unknown>[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.some((entry) => !isRecord(entry))) {
    throw new Error("The database returned invalid verification information.");
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (typeof field !== "string") {
    throw new Error(`The database returned an invalid ${key} value.`);
  }
  return field;
}

function readNullableString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (field === null || field === undefined) {
    return null;
  }
  if (typeof field !== "string") {
    throw new Error(`The database returned an invalid ${key} value.`);
  }
  return field;
}

function readNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (typeof field !== "number" || !Number.isFinite(field)) {
    throw new Error(`The database returned an invalid ${key} value.`);
  }
  return field;
}

function isDocumentType(value: string): value is VerificationDocumentType {
  return (
    value === "government_id" ||
    value === "ownership_proof" ||
    value === "professional_credential" ||
    value === "agency_registration" ||
    value === "other"
  );
}

export async function decideAdminRoleRequest(
  requestId: string,
  action: "approve" | "reject" | "request_info",
  reason: string,
): Promise<void> {
  const { data, error } = await getSupabaseClient().rpc(
    "admin_decide_role_request",
    { p_request_id: requestId, p_action: action, p_reason: reason || null },
  );
  if (error) {
    throw error;
  }
  const expectedStatus =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : "needs_info";
  if (data !== expectedStatus) {
    throw new Error("The role request decision could not be verified.");
  }
}
