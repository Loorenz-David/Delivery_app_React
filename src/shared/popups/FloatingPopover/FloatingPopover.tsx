import type{ ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    useDismiss,
    useInteractions,
    size
} from '@floating-ui/react'

type PropsConfrimPopup = {
   open: boolean
   onOpenChange: (b:boolean)=> void
   classes?: string
   children: ReactNode
   reference: ReactNode
   offSetNum?: number
   crossOffSetNum?: number
   matchReferenceWidth?: boolean 
   removeFlip?:boolean
   closeOnInsideClick?:boolean
}

export const FloatingPopover = ({
    open,
    onOpenChange,
    classes,
    children,
    reference,
    offSetNum,
    crossOffSetNum,
    matchReferenceWidth,
    removeFlip,
    closeOnInsideClick
}: PropsConfrimPopup) => {

    const {
        refs,
        floatingStyles,
        context
    } = useFloating({
        open: open,
        onOpenChange: onOpenChange,
        placement: 'bottom-start',
        middleware: [
            offset({
                mainAxis: typeof offSetNum == 'number' ? offSetNum : 8,
                crossAxis: typeof crossOffSetNum == 'number' ? crossOffSetNum : 0,
            }),
            !removeFlip && flip(),
            shift({ padding: 8 }),

            matchReferenceWidth &&
            size({
                apply({ rects, elements }) {
                    elements.floating.style.width = `${rects.reference.width}px`
                },
            }),
        ],
        whileElementsMounted: autoUpdate
    })
    const dismiss = useDismiss( context, {outsidePressEvent:'mousedown'})
    const { getReferenceProps, getFloatingProps } = useInteractions([ dismiss ])
    return ( 
        <div className={`${classes} flex-1`}>
            <div
                ref={refs.setReference}
                { ...getReferenceProps() }
                className="h-full w-full"
            >
                {reference}
            </div>
            <AnimatePresence initial={false}>
                {open && 
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        {...getFloatingProps()}
                        className="z-50 "
                        onClick={(e) => {
                            if (!closeOnInsideClick) return

                            const target = e.target as HTMLElement
                            if (target.closest('[data-popover-close]')) {
                                onOpenChange(false)
                            }else{
                                console.error('closeOnInsideClick is set to true on component FloatingPopover, but missing to add [data-popover-close] on the children.')
                            }
                        }}
                    >
                        {children}
                    </div>
                }
            </AnimatePresence>
        </div>
    );
}
