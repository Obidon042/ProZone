import type {
  VerificationDocument,
  VerificationDocumentType,
} from "../context/account";
import { getSupabaseClient } from "./supabase";

export type VerificationApplicationInput = {
  requestedRole: "agent" | "owner";
  legalName: string;
  phoneNumber: string;
  agencyName: string;
  officeAddress: string;
  propertyAddress: string;
  documents: VerificationDocument[];
};

const mimeExtensions: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadVerificationDocument(
  userId: string,
  file: { uri: string; name: string; mimeType: string | null; size?: number },
  documentType: VerificationDocumentType,
): Promise<VerificationDocument> {
  const extension = mimeExtensions[file.mimeType ?? ""];
  if (!extension) {
    throw new Error("Choose a PDF, JPG, PNG, or WebP document.");
  }
  if (!file.name.trim() || file.name.length > 255) {
    throw new Error("Choose a document with a file name of 255 characters or fewer.");
  }
  if (file.size !== undefined && file.size > 10 * 1024 * 1024) {
    throw new Error("Verification files must be 10 MB or smaller.");
  }

  const response = await fetch(file.uri);
  if (!response.ok) {
    throw new Error("Unable to read the selected verification document.");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > 10 * 1024 * 1024) {
    throw new Error("Verification files must be between 1 byte and 10 MB.");
  }
  if (file.size !== undefined && file.size !== bytes.byteLength) {
    throw new Error("The selected document changed while it was being read.");
  }

  const client = getSupabaseClient();
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${extension}`;
  const { error } = await client.storage
    .from("verification-documents")
    .upload(path, bytes, {
      contentType: file.mimeType ?? undefined,
      upsert: false,
    });
  if (error) {
    throw error;
  }
  return {
    path,
    fileName: file.name,
    contentType: file.mimeType ?? "",
    size: bytes.byteLength,
    documentType,
  };
}

export async function removeVerificationDocument(path: string, userId: string) {
  if (!path.startsWith(`${userId}/`) || path.includes("..")) {
    throw new Error("You can only remove your own verification documents.");
  }
  const { error } = await getSupabaseClient()
    .storage.from("verification-documents")
    .remove([path]);
  if (error) {
    throw error;
  }
}

export async function submitVerificationApplication(
  application: VerificationApplicationInput,
) {
  const { data, error } = await getSupabaseClient().rpc(
    "submit_role_verification",
    {
      p_requested_role: application.requestedRole,
      p_legal_name: application.legalName,
      p_phone_number: application.phoneNumber,
      p_agency_name: application.agencyName || null,
      p_office_address: application.officeAddress || null,
      p_property_address: application.propertyAddress || null,
      p_document_files: application.documents,
    },
  );
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("The verification application could not be confirmed.");
  }
}
