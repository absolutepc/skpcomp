import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
const source=fs.readFileSync('lib/admin-session.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports,require:()=>({env:{ADMIN_PASSWORD:'test'}})});
for(const host of ['localhost','127.0.0.1','192.168.1.2','skp.ru']){
 assert.equal(await exports.authorized(new Request('http://'+host)),false);
}
for(const route of ['store','orders','reviews','media']){
 assert.match(fs.readFileSync('app/api/'+route+'/route.ts','utf8'),/from '\.\.\/\.\.\/\.\.\/lib\/admin-session'/);
}
console.log('Admin authentication required on local, private and public hosts.');
