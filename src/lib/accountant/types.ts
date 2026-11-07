export type FeeStatus = "PAID" | "PENDING" | "PARTIAL" | "OVERDUE" | "WAIVED";

export interface DashboardFee {
  feeId: string; admissionId: string; studentName: string; program: string;
  feeType: string; amount: number; amountPaid: number; concessionAmount: number; balance: number;
  dueDate: string; status: FeeStatus; createdAt: string;
}

export interface FinanceDashboard {
  dueSoon: number; dueSoonCount: number;
  overdueAging: { label: string; amount: number }[]; generatedAt: string;
  asOf: string; totalBilled: number; totalCollected: number; totalConcessions: number; totalRefunded: number;
  outstanding: number; overdueAmount: number; waivedBalance: number;
  totalRecords: number; paid: number; pending: number; partial: number; overdue: number; waived: number;
  recentFees: DashboardFee[]; upcomingDues: DashboardFee[];
}
