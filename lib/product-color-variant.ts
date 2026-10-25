import type {Product} from './seed';

export function createColorVariant(source:Product,id:string):Product{
 return {...structuredClone(source),id,
  variantGroup:source.variantGroup?.trim()||'colors-'+id,
  image:'',gallery:[],colorHex:'',specs:{...source.specs,color:''}};
}

// Link an ungrouped original only when the new colour is saved successfully.
export function saveColorVariant(products:Product[],variant:Product,sourceId:string):Product[]{
 const source=products.find(product=>product.id===sourceId);
 if(!source)throw Error('Исходный товар не найден. Откройте редактор заново.');
 if(products.some(product=>product.id===variant.id))throw Error('Этот вариант уже существует. Откройте редактор заново.');
 if(variant.category!==source.category)throw Error('Цветовой вариант должен быть в той же категории.');
 if(!variant.specs?.color?.trim())throw Error('Укажите название нового цвета');
 if(!/^#[0-9a-fA-F]{6}$/.test(variant.colorHex||''))throw Error('Укажите HEX-код цвета, например #FFFFFF');
 const variantGroup=source.variantGroup?.trim()||variant.variantGroup;
 if(!variantGroup||variantGroup.length>80)throw Error('Проверьте группу цветовых вариантов');
 return [...products.map(product=>product.id===sourceId?{...product,variantGroup}:product),
  {...variant,variantGroup}];
}
