// Storefront priorities are independent from the specification editor's order.
export const catalogFilterOrder:Record<string,string[]>={
 cpu:['socket','cores','threads','memory','graphics','architecture','l3','watts','package','frequency','boost'],
 gpu:['gpu','vram','videoMemory','bus','length','slots','recommendedPsu','powerConnectors','interface','coolingType','fans','color','watts'],
 motherboard:['socket','chipset','memory','form','wifi','ramSlots','maxRam','m2Slots','gpuPcie','m2Pcie'],
 ram:['memory','capacity','speed','modules','form','latency','rgb','voltage'],
 ssd:['driveType','capacity','form','interface','pcieVersion','readSpeed','writeSpeed','nandType','dramCache','endurance','heatsink','warranty'],
 psu:['watts','certificate','form','modular','standard','pcieStandard','gpu16pin','gpu16pinType','length','semiPassive','warranty'],
 cooler:['coolingType','socket','tdp','radiator','height','fanSize','rgb'],
 case:['form','boardForm','color','gpuLength','coolerHeight','psuForm','side','fans','width','height','depth'],
 monitor:['diagonal','resolution','refresh','panel','response','aspectRatio','gSync','hdr','curved'],
 mouse:['connection','shape','weight','sensor','polling','dpi','buttons','battery','color'],
 keyboard:['keyboardType','format','connection','switch','layout','hotswap','color','rgb','polling'],
 headphones:['headphoneType','connection','microphone','noiseCancel','sound','battery','color'],
 mousepad:['width','depth','material','surface','thickness','color','rgb'],
 microphone:['connection','micType','pattern','mounting','sampleRate','bitDepth'],
 mount:['screens','vesa','load','maxDiagonal','mounting','gasLift'],
 webcam:['resolution','fps','focus','microphone','privacy','connection','angle'],
 laptops:['gpu','cpu','capacity','memoryType','driveCapacity','diagonal','resolution','refresh','panel','gpuPowerWatts'],
 furniture:['furnitureType','width','load','material','color']
};
