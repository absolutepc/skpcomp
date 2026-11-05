import {components,peripherals} from './catalog';
import type {Product} from './seed';
const labels:Record<string,string>={...components,...peripherals,all:'Каталог',laptops:'Ноутбуки',furniture:'Компьютерная мебель',pc:'Готовые ПК',configurator:'Конфигуратор ПК',compare:'Сравнение товаров',cart:'Корзина',orders:'Мои заказы',checkout:'Оформление заказа',favorites:'Избранное',contacts:'Контакты'};
export function pageMetadata(path:string,products:Product[]){
 const [,route,id]=path.split('/');
 const product=route==='product'?products.find(item=>item.id===id):undefined;
 const label=product?.name||(route==='catalog'?labels[id]||'Каталог':labels[route]);
 return {title:label?label+' — SKP':'SKP — компьютеры, которые вдохновляют',description:product?.description?.slice(0,170)||(label?label+' в магазине SKP':'Готовые ПК, комплектующие, периферия и конфигуратор SKP')};
}
