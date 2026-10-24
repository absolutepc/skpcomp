import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('lib/local-admin-access.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
for(const mode of ['development','production','test',undefined]){
 const exports={};vm.runInNewContext(code,{exports,URL,process:{env:{NODE_ENV:mode}}});
 for(const host of ['localhost','127.0.0.1','[::1]','localhost.example.com','skp.ru','192.168.1.2']){
  assert.equal(exports.localAdminAccess(new Request('http://'+host+':5173/api/store')),mode==='development'&&['localhost','127.0.0.1','[::1]'].includes(host));
 }
}
for(const name of ['store','orders','reviews','media'])assert(fs.readFileSync('app/api/'+name+'/route.ts','utf8').includes('if(localAdminAccess('));
console.log('Local admin: development loopback access allowed; production and external hosts protected.');
