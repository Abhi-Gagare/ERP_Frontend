import { request, type PageResponse } from "@/lib/api";
import type { FinanceDashboard, DashboardFee } from "./types";

export interface AdmissionOption { admissionId: string; studentName: string; program: string }
export interface FeeDetail { fee: DashboardFee; remarks: string | null; paidDate: string | null }
export interface AssignFee { admissionId: string; feeType: string; amount: number; dueDate: string; remarks: string }
export interface StudentFeeSummary {
  admissionId: string; studentName: string; program: string; semester: number; batchYear: number;
  admissionStatus: string; feeCount: number; billed: number; paid: number; concessions: number; outstanding: number; overdue: number; waived: number;
}
export interface StudentFeeAccount { summary: StudentFeeSummary; charges: PageResponse<DashboardFee>; asOf: string }

export const accountantApi = {
  studentAccounts: (search: string, program: string, semester: string, batch: string, page: number, signal?: AbortSignal) =>
    request<PageResponse<StudentFeeSummary>>(`/finance/fees/accounts?${new URLSearchParams({search,program,semester:semester||"0",batch:batch||"0",page:String(page)})}`, {signal}),
  studentAccount: (id: string, page: number, signal?: AbortSignal) =>
    request<StudentFeeAccount>(`/finance/fees/accounts/${encodeURIComponent(id)}?page=${page}`,{signal}),
  fees: (search: string, status: string, page: number, signal?: AbortSignal) =>
    request<PageResponse<DashboardFee>>(`/finance/fees?${new URLSearchParams({ search, status, page: String(page) })}`, { signal }),
  fee: (id: string, signal?: AbortSignal) => request<FeeDetail>(`/finance/fees/${encodeURIComponent(id)}`, { signal }),
  admissions: (search: string, page: number, signal?: AbortSignal) =>
    request<PageResponse<AdmissionOption>>(`/finance/fees/admissions?${new URLSearchParams({ search, page: String(page) })}`, { signal }),
  assignFee: (data: AssignFee) => request<DashboardFee>("/finance/fees", { method: "POST", body: JSON.stringify(data) }),
  dashboard: (signal?: AbortSignal) => request<FinanceDashboard>("/finance/dashboard", { signal }),
};
