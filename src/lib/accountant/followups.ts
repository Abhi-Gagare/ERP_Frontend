import {request,type PageResponse} from "@/lib/api";
export interface DebtAccount {admissionId:string;studentName:string;program:string;semester:number;batchYear:number;outstanding:number;overdue:number;aging30:number;aging60:number;aging90:number;agingOlder:number;earliestDue:string;latestOutcome:string;promisedDate:string|null;promisedAmount:number|null;nextContactDate:string|null}
export interface DebtWorklist {asOf:string;totals:{accounts:number;outstanding:number;overdue:number};accounts:PageResponse<DebtAccount>}
export interface FeeFollowup {id:number;admissionId:string;channel:string;outcome:string;note:string;promisedDate:string|null;promisedAmount:number|null;nextContactDate:string|null;recordedBy:string;createdAt:string}
export interface FollowupInput {requestId:string;channel:string;outcome:string;note:string;promisedDate:string|null;promisedAmount:number|null;nextContactDate:string|null}
export interface ReminderDraft {recipient:string;subject:string;body:string;asOf:string}
export const followupApi={
 list:(filters:Record<string,string>,signal?:AbortSignal)=>request<DebtWorklist>(`/finance/defaulters?${new URLSearchParams(filters)}`,{signal}),
 history:(id:string,page:number,signal?:AbortSignal)=>request<PageResponse<FeeFollowup>>(`/finance/defaulters/${encodeURIComponent(id)}/followups?page=${page}`,{signal}),
 record:(id:string,input:FollowupInput)=>request<FeeFollowup>(`/finance/defaulters/${encodeURIComponent(id)}/followups`,{method:"POST",body:JSON.stringify(input)}),
 draft:(id:string)=>request<ReminderDraft>(`/finance/defaulters/${encodeURIComponent(id)}/reminder-draft`),
};
