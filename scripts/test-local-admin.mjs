import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('lib/local-admin-access.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
for(const mode of ['development','production','test',undefined]){
 const exports={};vm.runInNewContext(code,{exports,URL,process:{env:{NODE_ENV:mode}}});
 const privateHosts=['localhost','127.0.0.1','[::1]','192.168.0.101','172.20.10.3','10.10.2.4','172.16.0.1','172.31.255.254'];
 const deniedHosts=['localhost.example.com','skp.ru','8.8.8.8','172.15.1.1','172.32.1.1','192.167.1.1','192.169.1.2','10.2.3.4.evil.com','192.168.1.2.evil.com','0.0.0.0'];
 for(const host of [...privateHosts,...deniedHosts]){
  const actual=exports.localAdminAccess(new Request('http://'+host+':5173/api/store'));
  assert.equal(actual,mode==='development'&&privateHosts.includes(host),mode+': '+host);
 }
}
for(const name of ['store','orders','reviews','media'])assert(fs.readFileSync('app/api/'+name+'/route.ts','utf8').includes('if(localAdminAccess('));
console.log('Local admin: passwordless dev loopback/private LAN; production and public hosts protected.');
