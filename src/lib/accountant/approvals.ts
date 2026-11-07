import {request,type PageResponse} from "@/lib/api";
import type {ScholarshipApplication} from "./scholarships";
export interface AwardApplication extends ScholarshipApplication {decision_id:string|null;outcome:string|null;approved_amount:number|null;decision_note:string|null;decided_by:string|null}
export interface AwardInput {version?:number;requestId:string;outcome:string;note:string;allocations:{feeId:string;amount:number}[]}
export interface AwardDecision {reversals?:{id:string;status:string;reason:string;review_note:string|null}[];id:string;outcome:string;amount:number;note:string;decided_by:string;created_at:string;allocations:{fee_id:string;fee_type:string;amount:number;balance_before:number;balance_after:number}[]}
export const approvalApi={
 list:(search:string,stage:string,page:number,signal?:AbortSignal)=>request<PageResponse<AwardApplication>>(`/finance/approvals/awards?${new URLSearchParams({search,stage,page:String(page)})}`,{signal}),
 decide:(id:string,input:AwardInput)=>request<AwardDecision>(`/finance/approvals/awards/${id}`,{method:"POST",body:JSON.stringify(input)}),
 decision:(id:string,signal?:AbortSignal)=>request<AwardDecision>(`/finance/approvals/awards/${id}`,{signal}),
};
