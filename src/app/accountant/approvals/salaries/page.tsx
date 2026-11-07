import SalaryHistory from "@/components/accountant/SalaryHistory";
import ApprovalTabs from "@/components/accountant/ApprovalTabs";
export const instant = false;
export default function Page(){return <div className="mx-auto max-w-7xl space-y-6"><h1 className="text-2xl font-bold">Financial Approvals</h1><ApprovalTabs active="salaries"/><SalaryHistory approvalMode/></div>;}
