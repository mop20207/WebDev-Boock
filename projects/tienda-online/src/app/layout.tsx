import type {ReactNode} from "react";
export const metadata={title:"Tienda WebDev",description:"Catálogo didáctico"};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="es"><body style={{fontFamily:"system-ui",margin:0,background:"#f3f5fa",color:"#18263c"}}>{children}</body></html>;}