import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAccount } from "../context/account";
import {
  decideAdminRoleRequest,
  getAdminDashboardStats,
  getAdminRoleRequests,
  type AdminDecisionAction,
  type AdminDashboardStats,
  type AdminRoleRequest,
} from "../lib/admin";
import { getSupabaseClient } from "../lib/supabase";

type StatusFilter = "pending" | "approved" | "rejected" | "needs_info";
type RoleFilter = "all" | "agent" | "owner";

const emptyStats: AdminDashboardStats = {
  totalUsers: 0,
  seekers: 0,
  agents: 0,
  owners: 0,
  pendingAgents: 0,
  pendingOwners: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  approvedAgents: 0,
  approvedOwners: 0,
  needsInfoAgents: 0,
  needsInfoOwners: 0,
};

export default function AdminDashboardScreen() {
  const { account, signOut } = useAccount();
  const [stats, setStats] = useState(emptyStats);
  const [requests, setRequests] = useState<AdminRoleRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<AdminRoleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [openingDocumentPath, setOpeningDocumentPath] = useState<string | null>(
    null,
  );
  const [decisionReason, setDecisionReason] = useState("");
  const [error, setError] = useState("");
  const [signOutError, setSignOutError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [nextStats, nextRequests] = await Promise.all([
        getAdminDashboardStats(),
        getAdminRoleRequests(statusFilter),
      ]);
      setStats(nextStats);
      setRequests(nextRequests);
      setSelectedRequest((selected) =>
        selected
          ? nextRequests.find((request) => request.id === selected.id) ?? null
          : null,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load administrator information.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const filteredRequests = useMemo(
    () =>
      roleFilter === "all"
        ? requests
        : requests.filter((request) => request.requestedRole === roleFilter),
    [requests, roleFilter],
  );

  const openRequest = (request: AdminRoleRequest) => {
    setSelectedRequest(request);
    setDecisionReason("");
    setError("");
  };

  const handleDecision = async (action: AdminDecisionAction) => {
    if (!selectedRequest || selectedRequest.status !== "pending") {
      return;
    }
    if (
      (action === "reject" || action === "request_info") &&
      !decisionReason.trim()
    ) {
      setError("Enter a reason for rejection or requested changes.");
      return;
    }
    const requestId = selectedRequest.id;
    setBusyRequestId(requestId);
    setError("");
    try {
      await decideAdminRoleRequest(
        requestId,
        action,
        decisionReason.trim(),
      );
      setSelectedRequest(null);
      await refresh();
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Unable to update this role request.",
      );
    } finally {
      setBusyRequestId(null);
    }
  };

  const openVerificationDocument = async (
    request: AdminRoleRequest,
    path: string,
  ) => {
    if (!path.startsWith(`${request.userId}/`) || path.includes("..")) {
      setError("This application contains an invalid document reference.");
      return;
    }
    setOpeningDocumentPath(path);
    setError("");
    try {
      const { data, error: signedUrlError } = await getSupabaseClient()
        .storage.from("verification-documents")
        .createSignedUrl(path, 300);
      if (signedUrlError) {
        throw signedUrlError;
      }
      await Linking.openURL(data.signedUrl);
    } catch (documentError) {
      setError(
        documentError instanceof Error
          ? documentError.message
          : "Unable to securely open this document.",
      );
    } finally {
      setOpeningDocumentPath(null);
    }
  };

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await signOut();
      router.dismissAll();
      router.replace("/login");
    } catch (logoutError) {
      setSignOutError(
        logoutError instanceof Error
          ? logoutError.message
          : "Unable to sign out.",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8FC]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-4">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-[#6049E8]">
              ProZone administration
            </Text>
            <Text className="mt-1 text-2xl font-extrabold text-slate-900">
              Dashboard
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Welcome, {account?.name ?? "Administrator"}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh dashboard"
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
              disabled={loading}
              onPress={() => void refresh()}
            >
              <Ionicons name="refresh-outline" size={20} color="#475569" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
              onPress={() => void handleSignOut()}
            >
              <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
            </Pressable>
          </View>
        </View>

        {signOutError ? (
          <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">
            {signOutError}
          </Text>
        ) : null}
        {error ? (
          <View className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
            <Text accessibilityRole="alert" className="text-sm text-red-700">
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              className="mt-2"
              onPress={() => void refresh()}
            >
              <Text className="text-sm font-bold text-red-700">Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <Text className="mb-3 mt-6 text-base font-bold text-slate-900">
          User overview
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <MetricCard label="Registered users" value={stats.totalUsers} />
          <MetricCard label="Property seekers" value={stats.seekers} />
          <MetricCard label="Agents" value={stats.agents} />
          <MetricCard label="Owners" value={stats.owners} />
          <MetricCard label="Pending agents" value={stats.pendingAgents} />
          <MetricCard label="Pending owners" value={stats.pendingOwners} />
          <MetricCard label="Approved requests" value={stats.approvedRequests} />
          <MetricCard label="Rejected requests" value={stats.rejectedRequests} />
          <MetricCard label="Approved agents" value={stats.approvedAgents} />
          <MetricCard label="Approved owners" value={stats.approvedOwners} />
          <MetricCard label="Agent info requested" value={stats.needsInfoAgents} />
          <MetricCard label="Owner info requested" value={stats.needsInfoOwners} />
        </View>

        <View className="mb-3 mt-8 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-extrabold text-slate-900">
              User Role Requests
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              Review applications before granting listing access.
            </Text>
          </View>
          {loading ? <ActivityIndicator color="#6049E8" /> : null}
        </View>

        <View className="mb-3 flex-row gap-2">
          {(["pending", "needs_info", "approved", "rejected"] as const).map((status) => (
            <FilterButton
              key={status}
              label={status === "needs_info" ? "Needs changes" : capitalize(status)}
              active={statusFilter === status}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </View>
        <View className="mb-4 flex-row gap-2">
          {(["all", "agent", "owner"] as const).map((role) => (
            <FilterButton
              key={role}
              label={role === "all" ? "All roles" : capitalize(role)}
              active={roleFilter === role}
              onPress={() => setRoleFilter(role)}
            />
          ))}
        </View>

        {loading && requests.length === 0 ? (
          <View className="items-center rounded-2xl bg-white px-4 py-8">
            <ActivityIndicator color="#6049E8" />
          </View>
        ) : filteredRequests.length ? (
          <View className="gap-3">
            {filteredRequests.map((request) => (
              <Pressable
                key={request.id}
                accessibilityRole="button"
                className="rounded-2xl bg-white p-4"
                onPress={() => openRequest(request)}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {request.displayName}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {capitalize(request.requestedRole)} application
                    </Text>
                  </View>
                  <StatusBadge status={request.status} />
                </View>
                <Text className="mt-3 text-xs text-slate-500">
                  Submitted {formatDate(request.submittedAt ?? request.createdAt)}
                </Text>
                <Text className="mt-2 text-sm font-semibold text-[#6049E8]">
                  View application
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="items-center rounded-2xl bg-white px-4 py-8">
            <Ionicons name="documents-outline" size={28} color="#94A3B8" />
            <Text className="mt-3 text-sm font-semibold text-slate-700">
              No {statusFilter} role requests
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              Applications matching these filters will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={selectedRequest !== null}
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-[#F8F8FC] px-5 pb-8 pt-5">
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase text-[#6049E8]">
                  Application details
                </Text>
                <Text className="mt-1 text-xl font-extrabold text-slate-900">
                  {selectedRequest?.displayName}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close application"
                className="h-9 w-9 items-center justify-center rounded-full bg-white"
                onPress={() => setSelectedRequest(null)}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </Pressable>
            </View>
            {selectedRequest ? (
              <View className="rounded-2xl bg-white p-4">
                {error ? (
                  <Text accessibilityRole="alert" className="mb-2 text-sm text-red-600">
                    {error}
                  </Text>
                ) : null}
                <DetailRow label="Email" value={selectedRequest.email} />
                <DetailRow
                  label="Legal name"
                  value={selectedRequest.legalName ?? "Not provided"}
                />
                <DetailRow
                  label="Phone number"
                  value={selectedRequest.phoneNumber ?? "Not provided"}
                />
                {selectedRequest.requestedRole === "agent" ? (
                  <>
                    <DetailRow
                      label="Agency / company"
                      value={selectedRequest.agencyName ?? "Not provided"}
                    />
                    <DetailRow
                      label="Office address"
                      value={selectedRequest.officeAddress ?? "Not provided"}
                    />
                  </>
                ) : (
                  <DetailRow
                    label="Property address"
                    value={selectedRequest.propertyAddress ?? "Not provided"}
                  />
                )}
                <DetailRow
                  label="Requested role"
                  value={capitalize(selectedRequest.requestedRole)}
                />
                <DetailRow
                  label="Current profile role"
                  value={capitalize(selectedRequest.profileRole)}
                />
                <DetailRow
                  label="Profile verified"
                  value={selectedRequest.isVerified ? "Yes" : "No"}
                />
                <DetailRow
                  label="Request status"
                  value={capitalize(selectedRequest.status)}
                />
                <DetailRow
                  label="Submitted"
                  value={formatDate(
                    selectedRequest.submittedAt ?? selectedRequest.createdAt,
                  )}
                />
                <Text className="mb-2 mt-4 text-sm font-bold text-slate-800">
                  Private verification documents
                </Text>
                {selectedRequest.documents.length ? (
                  selectedRequest.documents.map((document) => (
                    <Pressable
                      key={document.path}
                      accessibilityRole="link"
                      className="mb-2 flex-row items-center rounded-xl bg-slate-50 p-3"
                      disabled={openingDocumentPath !== null}
                      onPress={() =>
                        void openVerificationDocument(
                          selectedRequest,
                          document.path,
                        )
                      }
                    >
                      {openingDocumentPath === document.path ? (
                        <ActivityIndicator color="#6049E8" />
                      ) : (
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color="#6049E8"
                        />
                      )}
                      <View className="ml-2 flex-1">
                        <Text className="text-sm font-semibold text-[#6049E8]">
                          {document.fileName}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {formatDocumentType(document.documentType)} ·{" "}
                          {formatBytes(document.size)}
                        </Text>
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={17}
                        color="#6049E8"
                      />
                    </Pressable>
                  ))
                ) : (
                  <Text className="text-sm text-slate-500">
                    No documents were attached.
                  </Text>
                )}
                {selectedRequest.decisionReason ? (
                  <DetailRow
                    label="Latest decision note"
                    value={selectedRequest.decisionReason}
                  />
                ) : null}
                {selectedRequest.decisionHistory.length ? (
                  <View className="mt-3">
                    <Text className="text-sm font-bold text-slate-800">
                      Previous verification decisions
                    </Text>
                    {selectedRequest.decisionHistory.map((decision, index) => (
                      <View
                        key={`${decision.createdAt}-${index}`}
                        className="mt-2 rounded-xl bg-slate-50 p-3"
                      >
                        <Text className="text-sm font-semibold text-slate-800">
                          {statusLabel(decision.action)} · {decision.adminName}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500">
                          {formatDate(decision.createdAt)}
                        </Text>
                        {decision.reason ? (
                          <Text className="mt-1 text-sm text-slate-600">
                            {decision.reason}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text className="mt-3 text-xs text-slate-400">
                  User ID: {selectedRequest.userId}
                </Text>
              </View>
            ) : null}
            {selectedRequest?.status === "pending" ? (
              <View className="mt-4">
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Note to applicant
                </Text>
                <TextInput
                  className="min-h-20 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
                  multiline
                  onChangeText={setDecisionReason}
                  placeholder="Required for rejection or requests for changes"
                  placeholderTextColor="#94A3B8"
                  textAlignVertical="top"
                  value={decisionReason}
                />
                <View className="mt-3 flex-row flex-wrap gap-2">
                <Pressable
                  accessibilityRole="button"
                  className="h-11 flex-1 items-center justify-center rounded-xl border border-amber-200 bg-white"
                  disabled={busyRequestId !== null}
                  onPress={() => void handleDecision("request_info")}
                >
                  <Text className="text-xs font-bold text-amber-700">
                    {busyRequestId === selectedRequest.id
                      ? "Updating..."
                      : "Request changes"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="h-11 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-white"
                  disabled={busyRequestId !== null}
                  onPress={() => void handleDecision("reject")}
                >
                  <Text className="text-xs font-bold text-rose-700">
                    {busyRequestId === selectedRequest.id
                      ? "Updating..."
                      : "Reject"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="h-11 flex-1 items-center justify-center rounded-xl bg-[#6049E8]"
                  disabled={busyRequestId !== null}
                  onPress={() => void handleDecision("approve")}
                >
                  <Text className="text-xs font-bold text-white">
                    {busyRequestId === selectedRequest.id
                      ? "Updating..."
                      : "Approve"}
                  </Text>
                </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-2xl bg-white p-4">
      <Text className="text-2xl font-extrabold text-slate-900">{value}</Text>
      <Text className="mt-1 text-xs leading-5 text-slate-500">{label}</Text>
    </View>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`rounded-full px-3 py-2 ${
        active ? "bg-[#6049E8]" : "bg-white"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-semibold ${
          active ? "text-white" : "text-slate-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: AdminRoleRequest["status"] }) {
  const background =
    status === "approved"
      ? "bg-emerald-50"
      : status === "rejected"
        ? "bg-rose-50"
        : "bg-amber-50";
  const foreground =
    status === "approved"
      ? "text-emerald-700"
      : status === "rejected"
        ? "text-rose-700"
        : "text-amber-700";
  return (
    <View className={`rounded-full px-2.5 py-1 ${background}`}>
      <Text className={`text-[10px] font-bold ${foreground}`}>
        {capitalize(status)}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-slate-100 py-3">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-slate-800">
        {value}
      </Text>
    </View>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusLabel(status: string) {
  return status === "needs_info"
    ? "Changes requested"
    : capitalize(status);
}

function formatDocumentType(value: string) {
  return value
    .split("_")
    .map(capitalize)
    .join(" ");
}

function formatBytes(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}
