import {request,type PageResponse} from "@/lib/api";
export interface Refund {id:string;payment_id:string;receipt_number:string;admission_id:string;student_name:string;program:string;amount:number;reason:string;status:string;created_by:string;created_at:string;reviewed_by:string|null;review_note:string|null;payout_method:string|null;payout_reference:string|null;payout_date:string|null;paid_by:string|null}
export interface RefundDetail extends Refund {allocations:{fee_id:string;fee_type:string;amount:number;paid_before:number|null;paid_after:number|null}[]}
export interface RefundReceipt {id:string;receipt_number:string;student_name:string;admission_id:string;amount:number;allocations:{fee_id:string;fee_type:string;original_amount:number;reserved_amount:number}[]}
export interface RefundInput {requestId:string;paymentId:string;reason:string;allocations:{feeId:string;amount:number}[]}
export interface RefundPayout {requestId:string;method:string;reference:string;paidDate:string;verified:boolean}
export const refundApi={
 list:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<Refund>>(`/finance/refunds?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 receipt:(id:string,signal?:AbortSignal)=>request<RefundReceipt>(`/finance/refunds/receipts/${id}`,{signal}),
 detail:(id:string,signal?:AbortSignal)=>request<RefundDetail>(`/finance/refunds/${id}`,{signal}),
 create:(input:RefundInput)=>request<RefundDetail>("/finance/refunds",{method:"POST",body:JSON.stringify(input)}),
 review:(id:string,status:string,note:string)=>request<RefundDetail>(`/finance/refunds/${id}/review`,{method:"POST",body:JSON.stringify({status,note})}),
 payout:(id:string,input:RefundPayout)=>request<RefundDetail>(`/finance/refunds/${id}/payout`,{method:"POST",body:JSON.stringify(input)}),
};
