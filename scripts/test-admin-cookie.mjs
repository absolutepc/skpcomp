import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
const source=fs.readFileSync(new URL('../lib/admin-cookie.ts',import.meta.url),'utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL});
const {adminCookie}=exports;
for(const host of ['localhost','127.0.0.1','[::1]']){
 const cookie=adminCookie(new Request('http://'+host+':3000'),'token',28800);
 assert(!cookie.includes('; Secure'));
 assert(cookie.includes('; HttpOnly; SameSite=Strict; Path=/'));
}
for(const url of ['https://skp.ru','http://skp.ru','https://localhost','http://localhost.evil.com','http://192.168.1.2']){
 assert(adminCookie(new Request(url),'token',28800).includes('; Secure'));
}
assert(adminCookie(new Request('http://localhost'),'',0).endsWith('Max-Age=0'));
console.log('Admin cookie tests passed');
