import { request, type AuthResponse, type PageResponse } from "@/lib/api";

export type UserRole = AuthResponse["user"]["role"];
export interface ManagedUser {
  id: number; email: string; fullName: string; role: UserRole; active: boolean;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
  invitationDelivery: "PENDING" | "SENT" | "FAILED" | null;
  deliveryMessage: string | null; invitationExpiresAt: string | null;
}
export interface DeliveryResult { sent: boolean; message: string }
export interface EmailSettings {
  id: number | null;
  configured: boolean; encryptionReady: boolean; host: string; port: number; username: string;
  passwordConfigured: boolean; senderName: string; senderEmail: string; replyTo: string | null;
  security: "STARTTLS" | "SSL"; publicUrl: string; enabled: boolean; updatedAt: string | null;
}
export type SmtpInput = Pick<EmailSettings, "host" | "port" | "username" | "senderName" | "senderEmail" | "replyTo" | "security" | "publicUrl" | "enabled"> & { password: string };
export const adminApi = {
  users: (search: string, role: string, status: string, page: number) => request<PageResponse<ManagedUser>>(`/admin/users?${new URLSearchParams({ search, ...(role ? { role } : {}), status, page: String(page) })}`),
  createUser: (data: { fullName: string; email: string; role: UserRole }) => request<{ user: ManagedUser; delivery: DeliveryResult }>("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: { fullName: string; role: UserRole; active: boolean }) => request<ManagedUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  invite: (id: number) => request<DeliveryResult>(`/admin/users/${id}/invitation`, { method: "POST" }),
  emailSettings: () => request<EmailSettings>("/admin/email-settings"),
  emailAccounts: () => request<{ encryptionReady: boolean; accounts: EmailSettings[] }>("/admin/email-settings/accounts"),
  createEmailAccount: (data: SmtpInput) => request<EmailSettings>("/admin/email-settings/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateEmailAccount: (id: number, data: SmtpInput) => request<EmailSettings>(`/admin/email-settings/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setEmailAccountActive: (id: number, active: boolean) => request<EmailSettings>(`/admin/email-settings/accounts/${id}/status`, { method: "PATCH", body: JSON.stringify({ active }) }),
  saveEmailSettings: (data: SmtpInput) => request<EmailSettings>("/admin/email-settings", { method: "PUT", body: JSON.stringify(data) }),
  testEmail: (recipient: string) => request<DeliveryResult>("/admin/email-settings/test", { method: "POST", body: JSON.stringify({ recipient }) }),
};
