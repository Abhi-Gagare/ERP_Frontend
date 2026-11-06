import {request,type PageResponse} from "@/lib/api";
export interface ScholarshipApplication {id:string;admission_id:string;student_name:string;program:string;scheme:string;category:string;funding:string;academic_year:number;requested_amount:number;evidence_reference:string;reason:string;status:string;created_by:string;created_at:string;reviewed_by:string|null;review_note:string|null;financial_outcome:string|null;approved_amount:number|null}
export interface ScholarshipInput {requestId:string;admissionId:string;scheme:string;category:string;funding:string;academicYear:number;requestedAmount:number;evidenceReference:string;reason:string}
export const scholarshipApi={
 list:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<ScholarshipApplication>>(`/finance/scholarships?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 create:(input:ScholarshipInput)=>request<ScholarshipApplication>("/finance/scholarships",{method:"POST",body:JSON.stringify(input)}),
 review:(id:string,status:string,note:string)=>request<ScholarshipApplication>(`/finance/scholarships/${id}/review`,{method:"POST",body:JSON.stringify({status,note})}),
};
