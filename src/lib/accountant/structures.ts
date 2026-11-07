import {request,type PageResponse} from "@/lib/api";
export interface StructureLine {feeHead:string;installment:string;amount:number;dueDate:string}
export interface StructureRow {id:number;version:number;name:string;courseId:number|null;courseName:string;program:string;academicYear:number;semester:number;status:string;updatedAt:string;batchYear:number|null;effectiveFrom:string|null;effectiveUntil:string|null;notes:string|null;courseScope:"LEGACY"|"SELECTED"|"UNIVERSITY";courseIds:number[];courseNames:string[];studyYears:number[];includeFinalYear:boolean;semesters:number[];batchYears:number[]}
export interface StructureDetail {structure:StructureRow;lines:StructureLine[];total:number;createdBy:string}
export interface StructureCourse {id:number;name:string;program:string;components:{feeHead:string;amount:number;frequency:string}[];code:string;durationMonths:number}
export interface StructureOptions {semesters:number[];studyYears:number[];finalSemesters:number[];batchYears:number[];activeCourses:number;unconfiguredCourses:number}
export const structureApi={
 options:(ids:number[],signal?:AbortSignal)=>request<StructureOptions>(`/finance/fee-structures/options?${new URLSearchParams(ids.length?{courseIds:ids.join(',')}:{})}`,{signal,cache:'no-store'}),
 list:(search:string,status:string,page:number,signal?:AbortSignal)=>request<PageResponse<StructureRow>>(`/finance/fee-structures?${new URLSearchParams({search,status,page:String(page)})}`,{signal}),
 courses:(search:string,page:number,signal?:AbortSignal)=>request<PageResponse<StructureCourse>>(`/finance/fee-structures/courses?${new URLSearchParams({search,page:String(page)})}`,{signal}),
 detail:(id:number)=>request<StructureDetail>(`/finance/fee-structures/${id}`),
 save:(row:StructureRow|undefined,data:{name:string;courseId:number|null;courseScope?:string;courseIds?:number[];studyYears?:number[];includeFinalYear?:boolean;semesters?:number[];batchYears?:number[];academicYear:number;semester:number;lines:StructureLine[];batchYear?:number|null;effectiveFrom?:string|null;effectiveUntil?:string|null;notes?:string})=>request<StructureDetail>(row?`/finance/fee-structures/${row.id}?version=${row.version}`:"/finance/fee-structures",{method:row?"PUT":"POST",body:JSON.stringify(data)}),
 remove:(row:StructureRow)=>request<void>(`/finance/fee-structures/${row.id}?version=${row.version}`,{method:"DELETE"}),
 transition:(row:StructureRow,status:string)=>request<StructureDetail>(`/finance/fee-structures/${row.id}/status`,{method:"POST",body:JSON.stringify({version:row.version,status})}),
};

export const structureYears=(s:StructureRow)=>s.studyYears?.length||s.includeFinalYear?[...(s.studyYears||[]).map(y=>`Year ${y}`),...(s.includeFinalYear?["Final year"]:[])].join(" + "):s.semester?`Year ${Math.ceil(s.semester/2)} (semester ${s.semester})`:"All study years";

export const structureSemesters=(s:StructureRow)=>s.semesters?.length?s.semesters.map(n=>`Semester ${n}`).join(", "):s.semester?`Semester ${s.semester}`:"All semesters";
export const structureBatches=(s:StructureRow)=>s.batchYears?.length?s.batchYears.join(", "):s.batchYear?String(s.batchYear):"All batches";
