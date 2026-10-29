/** Catalog shortcuts for popular notebook CPUs and GPUs.
 * Model-only presets: never infer exact laptop performance, TGP, screen or RAM
 * from an OEM model. More models can be added without a database migration.
 */
export type LaptopProcessor={brand:'AMD'|'Intel';line:string;generation:string;name:string};
const makeCpu=(brand:LaptopProcessor['brand'],line:string,generation:string,models:string[]):LaptopProcessor[]=>
 models.map(name=>({brand,line,generation,name}));
export const laptopProcessors:LaptopProcessor[]=[
 ...makeCpu('AMD','Ryzen 5','7000',['AMD Ryzen 5 7535HS','AMD Ryzen 5 7640HS']),
 ...makeCpu('AMD','Ryzen 7','7000',['AMD Ryzen 7 7735HS','AMD Ryzen 7 7840HS','AMD Ryzen 7 7840U']),
 ...makeCpu('AMD','Ryzen 9','7000',['AMD Ryzen 9 7940HS','AMD Ryzen 9 7945HX','AMD Ryzen 9 7945HX3D']),
 ...makeCpu('AMD','Ryzen 5','8000',['AMD Ryzen 5 8645HS']),
 ...makeCpu('AMD','Ryzen 7','8000',['AMD Ryzen 7 8840HS','AMD Ryzen 7 8845HS']),
 ...makeCpu('AMD','Ryzen 9','8000',['AMD Ryzen 9 8945HS']),
 ...makeCpu('AMD','Ryzen AI 5','300',['AMD Ryzen AI 5 340']),
 ...makeCpu('AMD','Ryzen AI 7','300',['AMD Ryzen AI 7 350']),
 ...makeCpu('AMD','Ryzen AI 9','300',['AMD Ryzen AI 9 365','AMD Ryzen AI 9 HX 370','AMD Ryzen AI 9 HX 375']),
 ...makeCpu('AMD','Ryzen 9','9000',['AMD Ryzen 9 9955HX','AMD Ryzen 9 9955HX3D']),
 ...makeCpu('Intel','Core i5','12',['Intel Core i5-12450H','Intel Core i5-12500H']),
 ...makeCpu('Intel','Core i7','12',['Intel Core i7-12650H','Intel Core i7-12700H','Intel Core i7-12800HX']),
 ...makeCpu('Intel','Core i9','12',['Intel Core i9-12900H','Intel Core i9-12900HX']),
 ...makeCpu('Intel','Core i5','13',['Intel Core i5-13420H','Intel Core i5-13500H','Intel Core i5-13500HX']),
 ...makeCpu('Intel','Core i7','13',['Intel Core i7-13620H','Intel Core i7-13700H','Intel Core i7-13700HX']),
 ...makeCpu('Intel','Core i9','13',['Intel Core i9-13900H','Intel Core i9-13900HX']),
 ...makeCpu('Intel','Core i5','14',['Intel Core i5-14450HX','Intel Core i5-14500HX']),
 ...makeCpu('Intel','Core i7','14',['Intel Core i7-14650HX','Intel Core i7-14700HX']),
 ...makeCpu('Intel','Core i9','14',['Intel Core i9-14900HX']),
 ...makeCpu('Intel','Core Ultra 5','Series 1',['Intel Core Ultra 5 125H','Intel Core Ultra 5 135H']),
 ...makeCpu('Intel','Core Ultra 7','Series 1',['Intel Core Ultra 7 155H','Intel Core Ultra 7 165H']),
 ...makeCpu('Intel','Core Ultra 9','Series 1',['Intel Core Ultra 9 185H']),
 ...makeCpu('Intel','Core Ultra 5','Series 2',['Intel Core Ultra 5 225H','Intel Core Ultra 5 235H']),
 ...makeCpu('Intel','Core Ultra 7','Series 2',['Intel Core Ultra 7 255H','Intel Core Ultra 7 265H','Intel Core Ultra 7 255HX','Intel Core Ultra 7 265HX']),
 ...makeCpu('Intel','Core Ultra 9','Series 2',['Intel Core Ultra 9 285H','Intel Core Ultra 9 275HX','Intel Core Ultra 9 285HX'])
];
export type LaptopGraphics={brand:'NVIDIA'|'AMD'|'Intel';generation:string;name:string};
const makeGpu=(brand:LaptopGraphics['brand'],generation:string,models:string[]):LaptopGraphics[]=>
 models.map(name=>({brand,generation,name}));
export const laptopGraphics:LaptopGraphics[]=[
 ...makeGpu('NVIDIA','GeForce RTX 50',['GeForce RTX 5050 Laptop GPU','GeForce RTX 5060 Laptop GPU','GeForce RTX 5070 Laptop GPU','GeForce RTX 5070 Ti Laptop GPU','GeForce RTX 5080 Laptop GPU','GeForce RTX 5090 Laptop GPU']),
 ...makeGpu('NVIDIA','GeForce RTX 40',['GeForce RTX 4050 Laptop GPU','GeForce RTX 4060 Laptop GPU','GeForce RTX 4070 Laptop GPU','GeForce RTX 4080 Laptop GPU','GeForce RTX 4090 Laptop GPU']),
 ...makeGpu('NVIDIA','GeForce RTX 30',['GeForce RTX 3050 Laptop GPU','GeForce RTX 3060 Laptop GPU','GeForce RTX 3070 Laptop GPU','GeForce RTX 3070 Ti Laptop GPU','GeForce RTX 3080 Laptop GPU','GeForce RTX 3080 Ti Laptop GPU']),
 ...makeGpu('AMD','Radeon RX 7000',['Radeon RX 7600S','Radeon RX 7600M XT','Radeon RX 7700S','Radeon RX 7900M']),
 ...makeGpu('AMD','Radeon 800M',['Radeon 860M','Radeon 880M','Radeon 890M']),
 ...makeGpu('Intel','Arc',['Intel Arc A370M','Intel Arc A550M','Intel Arc A730M','Intel Arc A770M'])
];
