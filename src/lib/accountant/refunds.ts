import {request,type PageResponse} from "@/lib/api";
export interface Refund {reviewed_at:string|null;paid_at:string|null;version:number;refund_number:string;category:string;request_source:string;evidence_reference:string|null;target_date:string|null;verification_status:string;verified_by:string|null;verification_note:string|null;payout_progress:string;id:string;payment_id:string;receipt_number:string;admission_id:string;student_name:string;program:string;amount:number;reason:string;status:string;created_by:string;created_at:string;reviewed_by:string|null;review_note:string|null;payout_method:string|null;payout_reference:string|null;payout_date:string|null;paid_by:string|null}
export interface RefundDetail extends Refund {events:{action:string;actor:string;note:string;created_at:string}[];allocations:{fee_id:string;fee_type:string;amount:number;paid_before:number|null;paid_after:number|null}[]}
export interface RefundReceipt {id:string;receipt_number:string;student_name:string;admission_id:string;amount:number;allocations:{fee_id:string;fee_type:string;original_amount:number;reserved_amount:number}[]}
export interface RefundInput {category?:string;source?:string;evidenceReference?:string;targetDate?:string|null;requestId:string;paymentId:string;reason:string;allocations:{feeId:string;amount:number}[]}
export interface RefundPayout {version?:number;requestId:string;method:string;reference:string;paidDate:string;verified:boolean}
export interface RefundSummary {status:string;count:number;amount:number;failed:number;overdue:number}
export const refundApi={
 summary:(search:string,signal?:AbortSignal)=>request<RefundSummary[]>(`/finance/refunds/summary?${new URLSearchParams({search})}`,{signal}),
 list:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<Refund>>(`/finance/refunds?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 receipt:(id:string,signal?:AbortSignal)=>request<RefundReceipt>(`/finance/refunds/receipts/${id}`,{signal}),
 detail:(id:string,signal?:AbortSignal)=>request<RefundDetail>(`/finance/refunds/${id}`,{signal}),
 edit:(row:Refund,input:RefundInput,note:string)=>request<RefundDetail>(`/finance/refunds/${row.id}`,{method:"PUT",body:JSON.stringify({version:row.version,application:input,note})}),
 action:(row:Refund,action:string,note:string)=>request<RefundDetail>(`/finance/refunds/${row.id}/actions`,{method:"POST",body:JSON.stringify({version:row.version,action,note})}),
 create:(input:RefundInput)=>request<RefundDetail>("/finance/refunds",{method:"POST",body:JSON.stringify(input)}),
 review:(id:string,status:string,note:string,version?:number)=>request<RefundDetail>(`/finance/refunds/${id}/review`,{method:"POST",body:JSON.stringify({status,note,version})}),
 payout:(id:string,input:RefundPayout)=>request<RefundDetail>(`/finance/refunds/${id}/payout`,{method:"POST",body:JSON.stringify(input)}),
};
