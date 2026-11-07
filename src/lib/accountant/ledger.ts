import {request,type PageResponse} from "@/lib/api";
export interface LedgerAccount {code:string;name:string;kind:string}
export interface Journal {entry_id:string;source_type:string;source_id:string;entry_date:string;reference:string;counterparty:string;description:string;amount:number;debit_account:string;credit_account:string}
export interface TrialAccount extends LedgerAccount {opening:number;debit:number;credit:number;closing:number}
export interface Trial {accounts:TrialAccount[];debits:number;credits:number;difference:number}
export interface Movement {entry_id:string;entry_date:string;reference:string;counterparty:string;debit:number;credit:number;running_balance:number}
export interface Statement {account:LedgerAccount;opening:number;debits:number;credits:number;closing:number;movements:PageResponse<Movement>}
const query=(filters:Record<string,string>)=>new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v!=="")));
export const ledgerApi={
 accounts:(signal?:AbortSignal)=>request<LedgerAccount[]>("/finance/ledger/accounts",{signal}),
 journals:(filters:Record<string,string>,signal?:AbortSignal)=>request<PageResponse<Journal>>(`/finance/ledger/journals?${query(filters)}`,{signal}),
 trial:(filters:Record<string,string>,signal?:AbortSignal)=>request<Trial>(`/finance/ledger/trial-balance?${query(filters)}`,{signal}),
 statement:(code:string,filters:Record<string,string>,signal?:AbortSignal)=>request<Statement>(`/finance/ledger/accounts/${code}?${query(filters)}`,{signal}),
};
