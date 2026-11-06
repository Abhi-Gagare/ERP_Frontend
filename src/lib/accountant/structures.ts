import {request,type PageResponse} from "@/lib/api";
export interface StructureLine {feeHead:string;installment:string;amount:number;dueDate:string}
export interface StructureRow {id:number;version:number;name:string;courseId:number;courseName:string;program:string;academicYear:number;semester:number;status:string;updatedAt:string;batchYear:number|null;effectiveFrom:string|null;effectiveUntil:string|null;notes:string|null}
export interface StructureDetail {structure:StructureRow;lines:StructureLine[];total:number;createdBy:string}
export interface StructureCourse {id:number;name:string;program:string;components:{feeHead:string;amount:number;frequency:string}[]}
export const structureApi={
 list:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<StructureRow>>(`/finance/fee-structures?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 courses:(search:string,page:number,signal?:AbortSignal)=>request<PageResponse<StructureCourse>>(`/finance/fee-structures/courses?${new URLSearchParams({search,page:String(page)})}`,{signal}),
 detail:(id:number)=>request<StructureDetail>(`/finance/fee-structures/${id}`),
 create:(data:{name:string;courseId:number;academicYear:number;semester:number;lines:StructureLine[];batchYear?:number|null;effectiveFrom?:string|null;effectiveUntil?:string|null;notes?:string})=>request<StructureDetail>("/finance/fee-structures",{method:"POST",body:JSON.stringify(data)}),
 transition:(row:StructureRow,status:string)=>request<StructureDetail>(`/finance/fee-structures/${row.id}/status`,{method:"POST",body:JSON.stringify({version:row.version,status})}),
};
