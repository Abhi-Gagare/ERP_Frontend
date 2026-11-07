import {request,type PageResponse} from "@/lib/api";
export interface PayrollProfile {user_id:number;employee_code:string;department_id:number|null;department_name:string|null;designation:string;joined_on:string;active:boolean;version:number;full_name:string;email:string}
export interface ProfileInput {employeeCode:string;departmentId:number|null;designation:string;joinedOn:string;active:boolean;version:number}
export interface SalaryInput {requestId:string;userId:number;effectiveFrom:string;basic:number;allowances:number;deductions:number;notes:string}
export interface Salary extends SalaryInput {id:string;user_id:number;effective_from:string;net:number;status:string;created_by:string;reviewed_by:string|null;review_note:string|null;full_name?:string;email?:string}
export interface SalaryPreview extends Salary {gross:number;profile:PayrollProfile;month:string}
export interface GeneratePayroll {requestId:string;salaryId:string;month:string;reference:string;date:string;notes:string}
export interface PayrollSnapshot {employee_code:string;designation:string;department_name:string|null;basic:number;allowances:number;deductions:number;gross:number;net:number}
export const payrollSetupApi={
 profile:(id:number,signal?:AbortSignal)=>request<PayrollProfile>(`/finance/payroll/profiles/${id}`,{signal}),
 save:(id:number,input:ProfileInput)=>request<PayrollProfile>(`/finance/payroll/profiles/${id}`,{method:"PUT",body:JSON.stringify(input)}),
 departments:(search:string,page:number,signal?:AbortSignal)=>request<PageResponse<{id:number;code:string;name:string}>>(`/finance/payroll/departments?${new URLSearchParams({search,page:String(page)})}`,{signal}),
 salaries:(id:number|null,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<Salary>>(`/finance/payroll/salaries?${new URLSearchParams({...id?{user:String(id)}:{},status,page:String(page)})}`,{signal}),
 salary:(input:SalaryInput)=>request<Salary>("/finance/payroll/salaries",{method:"POST",body:JSON.stringify(input)}),
 review:(id:string,status:string,note:string)=>request<Salary>(`/finance/payroll/salaries/${id}/review`,{method:"POST",body:JSON.stringify({status,note})}),
 preview:(id:number,month:string)=>request<SalaryPreview>(`/finance/payroll/profiles/${id}/preview?${new URLSearchParams({month})}`),
 generate:(id:number,input:GeneratePayroll)=>request<{id:string}>(`/finance/payroll/profiles/${id}/generate`,{method:"POST",body:JSON.stringify(input)}),
 snapshot:(id:string,signal?:AbortSignal)=>request<PayrollSnapshot>(`/finance/payroll/snapshots/${id}`,{signal}),
};
