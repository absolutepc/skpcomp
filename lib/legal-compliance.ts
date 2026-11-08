/** Shared legal metadata. This module contains NO legal text or seller identity. */
export const LEGAL_DOCUMENT_TYPES = ['privacy','terms','returns','delivery','warranty','cookies','consent_order','consent_marketing'] as const;
export type LegalDocumentType = typeof LEGAL_DOCUMENT_TYPES[number];
export type SellerType = 'unconfirmed'|'ip'|'ooo';
export type LegalDocumentStatus = 'draft'|'published'|'archived';
export type SellerProfile = {
 sellerType:SellerType;fullName:string;shortName:string;inn:string;registrationNumber:string;
 legalAddress:string;postalAddress:string;contactEmail:string;contactPhone:string;
};
export const EMPTY_SELLER_PROFILE:SellerProfile={
 sellerType:'unconfirmed',fullName:'',shortName:'',inn:'',registrationNumber:'',
 legalAddress:'',postalAddress:'',contactEmail:'',contactPhone:''
};
export function validateSellerProfile(input:SellerProfile):string[]{
 const errors:string[]=[];
 if(!['unconfirmed','ip','ooo'].includes(input.sellerType))errors.push('Некорректная форма продавца');
 if(input.sellerType==='unconfirmed')errors.push('Не уточнена форма регистрации продавца');
 if(!input.fullName.trim())errors.push('Не указано наименование продавца');
 if(!/^\\d{10}$/.test(input.inn)&&!/^\\d{12}$/.test(input.inn))errors.push('ИНН должен содержать 10 или 12 цифр');
 if(input.sellerType==='ip'&&!/^\\d{15}$/.test(input.registrationNumber))errors.push('ОГРНИП должен содержать 15 цифр');
 if(input.sellerType==='ooo'&&!/^\\d{13}$/.test(input.registrationNumber))errors.push('ОГРН должен содержать 13 цифр');
 if(!input.legalAddress.trim())errors.push('Не указан адрес продавца');
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(input.contactEmail))errors.push('Не указан корректный e-mail');
 return errors;
}
export function canPublishLegalDocument(status:LegalDocumentStatus,title:string,body:string,seller:SellerProfile):boolean{
 return status==='draft'&&title.trim().length>=5&&body.trim().length>=100&&validateSellerProfile(seller).length===0;
}
