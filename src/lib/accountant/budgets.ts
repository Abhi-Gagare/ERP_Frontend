import {request,type PageResponse} from "@/lib/api";
export interface Budget {version:number;id:string;name:string;period_start:string;period_end:string;amount:number;notes:string;status:string;created_by:string;reviewed_by:string|null;review_note:string|null}
export interface BudgetDetail extends Budget {actual:number;committed:number;remaining:number;lines:{category:string;allocated:number;actual:number;committed:number;remaining:number}[]}
export interface BudgetInput {requestId:string;name:string;periodStart:string;periodEnd:string;notes:string;lines:{category:string;amount:number}[]}
export const budgetApi={
 list:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<Budget>>(`/finance/budgets?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 detail:(id:string,signal?:AbortSignal)=>request<BudgetDetail>(`/finance/budgets/${id}`,{signal}),
 create:(input:BudgetInput)=>request<BudgetDetail>("/finance/budgets",{method:"POST",body:JSON.stringify(input)}),
 review:(id:string,status:string,note:string,version?:number)=>request<BudgetDetail>(`/finance/budgets/${id}/review`,{method:"POST",body:JSON.stringify({status,note,version})}),
};
