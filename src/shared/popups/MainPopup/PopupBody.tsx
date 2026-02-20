import type { ReactNode } from 'react'

type PropsPopupBody = {
  children: ReactNode
}
export const PopupBody = ({children}: PropsPopupBody) => {
    return ( 
        <div className="flex-1 px-3 py-5 h-full relative overflow-hidden">
            {children}
        </div>
    );
}