import {request,type PageResponse} from "@/lib/api";
export interface CollectibleCharge {feeId:string;feeType:string;amount:number;paid:number;balance:number;dueDate:string}
export interface FeePayment {id:string;receiptNumber:string;admissionId:string;studentName:string;program:string;amount:number;method:string;reference:string|null;paidDate:string;notes:string|null;recordedBy:string;createdAt:string}
export interface FeeReceipt {payment:FeePayment;allocations:{feeId:string;feeType:string;amount:number;paidBefore:number;balanceAfter:number}[]}
export interface PaymentInput {requestId:string;admissionId:string;method:string;reference:string;paidDate:string;notes:string;verified:boolean;allocations:{feeId:string;amount:number}[]}
export const collectionsApi={
 charges:(admissionId:string,page:number,signal?:AbortSignal)=>request<PageResponse<CollectibleCharge>>(`/finance/collections/charges?${new URLSearchParams({admissionId,page:String(page)})}`,{signal}),
 collect:(input:PaymentInput)=>request<FeeReceipt>("/finance/collections",{method:"POST",body:JSON.stringify(input)}),
 history:(search:string,admissionId:string,from:string,until:string,page:number,signal?:AbortSignal)=>request<PageResponse<FeePayment>>(`/finance/collections?${new URLSearchParams({search,admissionId,...(from?{from}:{}),...(until?{until}:{}),page:String(page)})}`,{signal}),
 receipt:(id:string,signal?:AbortSignal)=>request<FeeReceipt>(`/finance/collections/receipts/${encodeURIComponent(id)}`,{signal}),
};
