import {request,type PageResponse} from "@/lib/api";
export interface OperatingEntry {version:number;progress:string;target_date:string|null;evidence_reference:string|null;vendor_id?:string|null;staff_user_id?:number|null;id:string;direction:string;category:string;counterparty:string;document_reference:string;document_date:string;amount:number;description:string;status:string;created_by:string;created_at:string;reviewed_by:string|null;review_note:string|null;settlement_method:string|null;settlement_reference:string|null;settlement_date:string|null;settled_by:string|null}
export interface OperatingInput {requestId:string;direction:string;category:string;counterparty:string;documentReference:string;documentDate:string;amount:number;description:string}
export interface OperatingWorklist {asOf:string;totals:{records:number;settledIncome:number;settledExpenses:number;netCash:number;pendingAmount:number;approvedAmount:number};entries:PageResponse<OperatingEntry>}
export interface OperatingSettlement {version?:number;requestId:string;method:string;reference:string;paidDate:string;verified:boolean}
export const operatingApi={
 list:(filters:Record<string,string>,signal?:AbortSignal)=>request<OperatingWorklist>(`/finance/operations?${new URLSearchParams(filters)}`,{signal}),
 categories:(signal?:AbortSignal)=>request<Record<string,string[]>>("/finance/operations/categories",{signal}),
 create:(input:OperatingInput)=>request<OperatingEntry>("/finance/operations",{method:"POST",body:JSON.stringify(input)}),
 detail:(id:string,signal?:AbortSignal)=>request<OperatingEntry>(`/finance/operations/${id}`,{signal}),
 review:(id:string,status:string,note:string,version?:number)=>request<OperatingEntry>(`/finance/operations/${id}/review`,{method:"POST",body:JSON.stringify({status,note,version})}),
 settle:(id:string,input:OperatingSettlement)=>request<OperatingEntry>(`/finance/operations/${id}/settlement`,{method:"POST",body:JSON.stringify(input)}),
};
