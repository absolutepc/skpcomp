import type {ReactNode} from 'react';

export default function AdminLayout({children}:{children:ReactNode}){
 return <><link rel="preload" as="image" href="/images/skp-admin-background.webp" fetchPriority="high"/>{children}</>;
}
