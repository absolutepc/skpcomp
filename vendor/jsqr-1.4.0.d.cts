declare function jsQR(data:Uint8ClampedArray,width:number,height:number,options?:{inversionAttempts:"attemptBoth"|"dontInvert"|"onlyInvert"|"invertFirst"}):{data:string}|null;
export = jsQR;
