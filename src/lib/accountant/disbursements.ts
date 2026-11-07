import {request,type PageResponse} from "@/lib/api";
import type {OperatingEntry,OperatingWorklist,OperatingSettlement} from "./operations";
export type PaymentType="VENDOR"|"PAYROLL";
export interface Vendor {id:string;name:string;email:string|null;active:boolean}
export interface Staff {id:number;full_name:string;email:string;role:string}
export interface InvoiceInput {requestId:string;vendorId:string;reference:string;date:string;amount:number;notes:string}
export interface PayrollInput {requestId:string;userId:number;month:string;reference:string;date:string;amount:number;notes:string}
function client(type:PaymentType){return {
 detail:(id:string,signal?:AbortSignal)=>request<OperatingEntry>(`/finance/disbursements/${type}/payments/${id}`,{signal}),
 review:(id:string,status:string,note:string)=>request<OperatingEntry>(`/finance/disbursements/${type}/payments/${id}/review`,{method:"POST",body:JSON.stringify({status,note})}),
 settle:(id:string,input:OperatingSettlement)=>request<OperatingEntry>(`/finance/disbursements/${type}/payments/${id}/settlement`,{method:"POST",body:JSON.stringify(input)}),
};}
export const disbursementClients={VENDOR:client("VENDOR"),PAYROLL:client("PAYROLL")};
export const disbursementApi={
 vendors:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<Vendor>>(`/finance/disbursements/vendors?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 vendor:(input:{requestId:string;name:string;email:string})=>request<Vendor>("/finance/disbursements/vendors",{method:"POST",body:JSON.stringify(input)}),
 active:(id:string,active:boolean)=>request<Vendor>(`/finance/disbursements/vendors/${id}/active`,{method:"PUT",body:JSON.stringify({active})}),
 staff:(search:string,page:number,signal?:AbortSignal)=>request<PageResponse<Staff>>(`/finance/disbursements/staff?${new URLSearchParams({search,page:String(page)})}`,{signal}),
 list:(type:PaymentType,search:string,status:string,page:number,signal?:AbortSignal)=>request<OperatingWorklist>(`/finance/disbursements/${type}/payments?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 create:(type:PaymentType,input:InvoiceInput|PayrollInput)=>request<OperatingEntry>(`/finance/disbursements/${type}/payments`,{method:"POST",body:JSON.stringify(input)}),
};
