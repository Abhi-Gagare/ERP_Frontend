export function exportFinanceCsv(name:string,rows:unknown[][]){
 const cell=(value:unknown)=>{let text=String(value??'');if(typeof value==='string'&&/^\s*[=+@\-\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
}
