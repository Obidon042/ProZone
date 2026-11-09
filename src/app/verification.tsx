
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { useAccount, type VerificationDocumentType } from "../context/account";
import {
  removeVerificationDocument,
  submitVerificationApplication,
  uploadVerificationDocument,
} from "../lib/verification";

const documentTypes: {
  value: VerificationDocumentType;
  label: string;
}[] = [
    { value: "government_id", label: "Government ID" },
    { value: "ownership_proof", label: "Ownership proof" },
    { value: "professional_credential", label: "Professional credential" },
    { value: "agency_registration", label: "Agency registration" },
    { value: "other", label: "Other" },
  ];

export default function VerificationScreen() {
  const { account, roleRequest, refreshAccount } = useAccount();
  const { role: routeRole } = useLocalSearchParams<{ role?: string }>();

  const initialRole =
    roleRequest?.requestedRole ??
    (routeRole === "agent" || routeRole === "owner"
      ? routeRole
      : account?.role === "agent" || account?.role === "owner"
        ? account.role
        : "agent");

  const [requestedRole, setRequestedRole] = useState<"agent" | "owner">(
    initialRole,
  );
  const [legalName, setLegalName] = useState(
    roleRequest?.legalName ?? account?.name ?? "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    roleRequest?.phoneNumber ?? "",
  );
  const [agencyName, setAgencyName] = useState(
    roleRequest?.agencyName ?? "",
  );
  const [officeAddress, setOfficeAddress] = useState(
    roleRequest?.officeAddress ?? "",
  );
  const [propertyAddress, setPropertyAddress] = useState(
    roleRequest?.propertyAddress ?? "",
  );

  const [documents, setDocuments] = useState(
    roleRequest?.requestedRole === initialRole
      ? roleRequest.documentFiles
      : [],
  );

  const [selectedDocumentType, setSelectedDocumentType] =
    useState<VerificationDocumentType>("government_id");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isLocked =
    account?.isVerified ||
    (roleRequest?.requestedRole === requestedRole &&
      roleRequest.applicationSubmitted &&
      roleRequest.status === "pending");

  const canChooseRole =
    !roleRequest || roleRequest.status === "rejected";

  const hasGovernmentId = documents.some(
    (document) => document.documentType === "government_id",
  );

  const hasOwnershipEvidence = documents.some(
    (document) => document.documentType === "ownership_proof",
  );

  const addDocument = async () => {
    if (!account || documents.length >= 8) {
      setError("You can attach up to eight documents.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (selection.canceled) {
        return;
      }

      const file = selection.assets[0];

      const uploaded = await uploadVerificationDocument(
        account.id,
        {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType ?? null,
          size: file.size,
        },
        selectedDocumentType,
      );

      setDocuments((current) => [...current, uploaded]);
    } catch (pickerError) {
      setError(
        pickerError instanceof Error
          ? pickerError.message
          : "Unable to upload this verification document.",
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (path: string) => {
    if (!account) {
      return;
    }

    setError("");

    try {
      await removeVerificationDocument(path, account.id);

      setDocuments((current) =>
        current.filter((document) => document.path !== path),
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove this document.",
      );
    }
  };

  const submit = async () => {
    if (!account) {
      setError("Sign in to submit a verification application.");
      return;
    }

    if (
      !legalName.trim() ||
      legalName.trim().length > 160 ||
      !phoneNumber.trim() ||
      phoneNumber.trim().length > 40
    ) {
      setError(
        "Enter your full legal name (160 characters or fewer) and phone number (40 characters or fewer).",
      );
      return;
    }

    if (
      requestedRole === "owner" &&
      (!propertyAddress.trim() || propertyAddress.trim().length > 500)
    ) {
      setError(
        "Enter the property address (500 characters or fewer) for owner verification.",
      );
      return;
    }

    if (
      agencyName.trim().length > 200 ||
      officeAddress.trim().length > 500
    ) {
      setError("Agency details are too long. Shorten them and try again.");
      return;
    }

    if (!hasGovernmentId) {
      setError("Attach a government-issued identification document.");
      return;
    }

    if (requestedRole === "owner" && !hasOwnershipEvidence) {
      setError("Attach evidence of ownership or authorization.");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      await submitVerificationApplication({
        requestedRole,
        legalName: legalName.trim(),
        phoneNumber: phoneNumber.trim(),
        agencyName: agencyName.trim(),
        officeAddress: officeAddress.trim(),
        propertyAddress: propertyAddress.trim(),
        documents,
      });

      await refreshAccount();

      // Navigate to the main Add Property page as requested
      router.replace("/add-property");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your verification application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#F8F8FC]"
      edges={["top", "bottom"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mt-3 h-10 w-10 items-center justify-center rounded-full bg-white"
          onPress={() => handleSafeBack("/role")}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>

        <Text className="mt-5 text-2xl font-extrabold text-slate-900">
          Verify your {requestedRole === "agent" ? "Agent" : "Owner"} account
        </Text>

        <Text className="mt-2 text-sm leading-6 text-slate-600">
          Verification and registration are free. Only an administrator can
          approve an application and enable property publishing.
        </Text>

        {roleRequest?.status === "needs_info" &&
          roleRequest.requestedRole === requestedRole ? (
          <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Text className="text-sm font-bold text-amber-900">
              More information requested
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-800">
              {roleRequest.decisionReason ??
                "Please update your application and resubmit it."}
            </Text>
          </View>
        ) : null}

        {roleRequest?.status === "rejected" &&
          roleRequest.requestedRole === requestedRole ? (
          <View className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <Text className="text-sm font-bold text-rose-900">
              Previous application not approved
            </Text>

            {roleRequest.decisionReason ? (
              <Text className="mt-1 text-sm leading-5 text-rose-800">
                {roleRequest.decisionReason}
              </Text>
            ) : null}

            <Text className="mt-1 text-xs text-rose-700">
              You may submit a corrected application. Your current permissions
              remain unchanged.
            </Text>
          </View>
        ) : null}

        {account?.isVerified ? (
          <View className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={26} color="#059669" />
              <Text className="ml-2.5 text-base font-extrabold text-emerald-950">
                Verification Complete & Approved
              </Text>
            </View>
            <Text className="mt-2 text-sm leading-5 text-emerald-900">
              Your identity and credentials have been verified. You can now post and add properties for sale as an approved {account.role === "agent" ? "Real Estate Agent" : "Property Owner"}.
            </Text>

            <Pressable
              accessibilityRole="button"
              className="mt-4 h-13 flex-row items-center justify-center rounded-xl bg-[#6049E8] py-3.5"
              onPress={() => router.replace("/workspace")}
            >
              <Ionicons name="business-outline" size={19} color="white" />
              <Text className="ml-2 font-bold text-white">
                Go to Dashboard to Add Properties
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="mt-2.5 h-12 flex-row items-center justify-center rounded-xl border border-emerald-300 bg-white"
              onPress={() => router.push("/add-property")}
            >
              <Ionicons name="add-circle-outline" size={19} color="#059669" />
              <Text className="ml-2 font-bold text-emerald-800">
                Post a Property for Sale Now
              </Text>
            </Pressable>
          </View>
        ) : null}

        {roleRequest?.applicationSubmitted &&
          roleRequest.status === "pending" &&
          roleRequest.requestedRole === requestedRole ? (
          <View className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={24} color="#6049E8" />
              <Text className="ml-2.5 text-base font-bold text-violet-950">
                Application Under Review
              </Text>
            </View>
            <Text className="mt-2 text-sm leading-5 text-violet-900">
              Your government ID and verification documents have been submitted and are awaiting administrator review. Once verified, you will be able to post and add properties for sale.
            </Text>

            <Pressable
              accessibilityRole="button"
              className="mt-4 h-12 flex-row items-center justify-center rounded-xl bg-[#6049E8]"
              onPress={() => router.replace("/add-property")}
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text className="ml-2 text-sm font-bold text-white">
                Continue to Add Property Page
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="mt-2.5 h-11 flex-row items-center justify-center rounded-xl bg-white border border-violet-300"
              onPress={async () => {
                try {
                  await refreshAccount();
                  setNotice("Account status refreshed.");
                } catch {
                  setError("Unable to refresh status. Please try again.");
                }
              }}
            >
              <Ionicons name="refresh-outline" size={17} color="#6049E8" />
              <Text className="ml-2 text-xs font-bold text-[#6049E8]">
                Check / Refresh Verification Status
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="mt-2.5 h-11 flex-row items-center justify-center rounded-xl bg-[#6049E8]/10"
              onPress={() => router.replace("/(tabs)")}
            >
              <Ionicons name="home-outline" size={17} color="#6049E8" />
              <Text className="ml-2 text-xs font-bold text-[#6049E8]">
                Browse Marketplace as Seeker
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLocked ? (
          <>
            <Text className="mb-2 mt-6 text-sm font-bold text-slate-700">
              Application type
            </Text>

            {canChooseRole ? (
              <View className="flex-row gap-3">
                {(["agent", "owner"] as const).map((role) => (
                  <Pressable
                    key={role}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: role === requestedRole,
                    }}
                    className={`flex-1 rounded-xl border p-3 ${role === requestedRole
                      ? "border-[#6049E8] bg-violet-50"
                      : "border-slate-200 bg-white"
                      }`}
                    onPress={() => {
                      setRequestedRole(role);
                      setDocuments([]);
                      setError("");
                    }}
                  >
                    <Text
                      className={`text-center text-sm font-bold ${role === requestedRole
                        ? "text-[#6049E8]"
                        : "text-slate-600"
                        }`}
                    >
                      {role === "agent"
                        ? "Property Agent"
                        : "Property Owner"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="rounded-xl bg-violet-50 p-3 text-sm font-semibold text-[#6049E8]">
                {requestedRole === "agent"
                  ? "Property Agent"
                  : "Property Owner"}
              </Text>
            )}

            <FormField
              label="Full legal name"
              value={legalName}
              onChangeText={setLegalName}
              placeholder="Name as shown on your identification"
            />

            <FormField
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Your contact number"
              keyboardType="phone-pad"
            />

            {requestedRole === "agent" ? (
              <>
                <FormField
                  label="Agency or company (optional)"
                  value={agencyName}
                  onChangeText={setAgencyName}
                  placeholder="Company name"
                />

                <FormField
                  label="Office address (optional)"
                  value={officeAddress}
                  onChangeText={setOfficeAddress}
                  placeholder="Agency office address"
                />
              </>
            ) : (
              <FormField
                label="Property address"
                value={propertyAddress}
                onChangeText={setPropertyAddress}
                placeholder="Address of the property you represent"
              />
            )}

            <Text className="mb-2 mt-6 text-sm font-bold text-slate-700">
              Verification documents
            </Text>

            <Text className="text-xs leading-5 text-slate-500">
              Files are private. Only you and authorized administrators can
              access them. PDF, JPG, PNG, or WebP; maximum 10 MB per file.
            </Text>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {documentTypes
                .filter(
                  ({ value }) =>
                    requestedRole !== "owner" ||
                    value !== "professional_credential",
                )
                .map(({ value, label }) => (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: selectedDocumentType === value,
                    }}
                    className={`rounded-full px-3 py-2 ${selectedDocumentType === value
                      ? "bg-[#6049E8]"
                      : "bg-white"
                      }`}
                    onPress={() => setSelectedDocumentType(value)}
                  >
                    <Text
                      className={`text-xs font-semibold ${selectedDocumentType === value
                        ? "text-white"
                        : "text-slate-600"
                        }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-3 h-12 flex-row items-center justify-center rounded-xl border border-dashed border-violet-300 bg-white"
              disabled={uploading || documents.length >= 8}
              onPress={() => void addDocument()}
            >
              {uploading ? (
                <ActivityIndicator color="#6049E8" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={19}
                    color="#6049E8"
                  />
                  <Text className="ml-2 text-sm font-semibold text-[#6049E8]">
                    Add{" "}
                    {
                      documentTypes.find(
                        (item) =>
                          item.value === selectedDocumentType,
                      )?.label
                    }
                  </Text>
                </>
              )}
            </Pressable>

            {documents.map((document) => (
              <View
                key={document.path}
                className="mt-2 flex-row items-center rounded-xl bg-white px-3 py-3"
              >
                <Ionicons
                  name="document-text-outline"
                  size={19}
                  color="#6049E8"
                />

                <View className="ml-2 flex-1">
                  <Text className="text-sm font-semibold text-slate-800">
                    {document.fileName}
                  </Text>

                  <Text className="text-xs text-slate-500">
                    {
                      documentTypes.find(
                        (item) =>
                          item.value === document.documentType,
                      )?.label ?? "Document"
                    }
                    {" · "}
                    {formatFileSize(document.size)}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${document.fileName}`}
                  onPress={() => void deleteDocument(document.path)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={21}
                    color="#B91C1C"
                  />
                </Pressable>
              </View>
            ))}

            <Text className="mt-4 text-xs leading-5 text-slate-500">
              {requestedRole === "owner"
                ? "Attach a government ID and proof of ownership or legal authorization for the property."
                : "Attach a government-issued ID. Agency registration or professional credentials can also be included where applicable."}
            </Text>
          </>
        ) : null}

        {error ? (
          <Text accessibilityRole="alert" className="mt-4 text-sm text-red-600">
            {error}
          </Text>
        ) : null}

        {notice ? (
          <Text
            accessibilityRole="alert"
            className="mt-4 text-sm text-emerald-700"
          >
            {notice}
          </Text>
        ) : null}
      </ScrollView>

      {!isLocked ? (
        <View className="border-t border-slate-200 bg-white px-5 pb-3 pt-3">
          <Pressable
            accessibilityRole="button"
            className="h-12 items-center justify-center rounded-xl bg-[#6049E8]"
            disabled={submitting || uploading}
            onPress={() => {
              Keyboard.dismiss();
              void submit();
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-bold text-white">
                Submit for free review
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-bold text-slate-700">
        {label}
      </Text>

      <TextInput
        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
      />
    </View>
  );
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
