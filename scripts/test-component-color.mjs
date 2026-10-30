import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/component-color.ts','utf8'),{module:ts.ModuleKind.CommonJS}),{exports});
const match=exports.matchesComponentColor;
for(const [product,color,expected] of [
 [{name:'GPU'},'',true], [{name:'GPU'},'black',false],
 [{name:'GPU',specs:{color:'Белый'}},'white',true],
 [{name:'GPU',specs:{color:'Черный'}},'black',true],
 [{name:'GPU White',specs:{color:'Розовый'}},'white',false],
 [{name:'GPU',colorHex:'#eeeeee'},'white',true],
 [{name:'GPU',colorHex:'#191919'},'black',true],
 [{name:'GPU',colorHex:'#ff0055'},'black',false],
 [{name:'GPU White'},'white',true], [{name:'AORUS ICE'},'white',true],
 [{name:'GPU',colorHex:'#191919'},'white',false],
]) assert.equal(match(product,color),expected,JSON.stringify([product,color]));
console.log('Component colour filters passed.');
