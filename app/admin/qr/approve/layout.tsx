import type {Metadata} from 'next';

export const metadata:Metadata={
 title:'Подтверждение входа — SKP',
 robots:{index:false,follow:false,noarchive:true,nosnippet:true},
 referrer:'no-referrer',
};

export default function ApprovalLayout({children}:{children:React.ReactNode}){
 return children;
}
