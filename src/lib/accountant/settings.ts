import {request} from '@/lib/api';
export interface Preferences {reportPeriod:string;reportSection:string;version:number}
export interface FinanceSettings {fullName:string;email:string;role:string;currency:string;timeZone:string;today:string;reportFrom:string;preferences:Preferences;paymentMethods:string[]}
export const settingsApi={read:(signal?:AbortSignal)=>request<FinanceSettings>('/finance/settings',{signal}),save:(input:Preferences)=>request<FinanceSettings>('/finance/settings',{method:'PUT',body:JSON.stringify(input)})};
