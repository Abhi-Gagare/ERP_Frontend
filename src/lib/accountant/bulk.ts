import {request} from "@/lib/api";
export interface AssignmentTarget {admissionId:string;studentName:string;state:string;reason:string|null}
export interface AssignmentRun {id:string;structureId:number;structureName:string;program:string;batchYear:number|null;status:string;expiresAt:string;matched:number;ready:number;assigned:number;skipped:number;ineligible:number;perStudent:number;previewAmount:number;sample:AssignmentTarget[];mappingUnresolved:number;batchYears:number[]}
export const bulkApi={
 programs:(search:string,signal?:AbortSignal)=>request<string[]>(`/finance/fee-assignments/programs?search=${encodeURIComponent(search)}`,{signal}),
 preview:(id:number,selection:{program:string;batchYear:number|null;search:string;admissionIds:string[];batchYears?:number[]})=>request<AssignmentRun>(`/finance/fee-assignments/structures/${id}/preview`,{method:"POST",body:JSON.stringify(selection)}),
 process:(id:string)=>request<AssignmentRun>(`/finance/fee-assignments/${id}/process`,{method:"POST"}),
 get:(id:string)=>request<AssignmentRun>(`/finance/fee-assignments/${id}`),
 history:(id:number)=>request<AssignmentRun[]>(`/finance/fee-assignments/structures/${id}/history`),
};
