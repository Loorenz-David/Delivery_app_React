import { useMobile } from '@/app/contexts/MobileContext'
import { BasicButton } from '@/shared/buttons/BasicButton'
import type { PropsFooterConfig } from './MainPopup.types'



type PropsPopupFooter = {
    footerConfig?: PropsFooterConfig | null
}

export const PopupFooter = ({ footerConfig }: PropsPopupFooter) => {
    const { isMobile } = useMobile()
    const hasButtons = footerConfig?.saveButton || footerConfig?.deleteButton

    if (!hasButtons) return null

    return ( 
        <footer className={
            ` absolute bottom-0 flex w-full items-center justify-between gap-4 border-t border-[var(--color-border)] bottom-0 left-0 bg-[var(--color-page)] rounded-b-xl` + 
            (isMobile ? `px-4 py-4` : ` px-6 py-4`)
        }
        >       
            
            { footerConfig?.deleteButton && 
                <BasicButton params={{
                    variant:'secondary',
                    className:'py-3 px-5 ',
                    onClick: footerConfig.deleteButton.action
                }}>
                    {footerConfig.deleteButton.label}
                </BasicButton>
            }


               
                {footerConfig?.saveButton && (
                    <div className="flex flex-1 justify-end">
                        <BasicButton params={{
                            variant: 'primary',
                            className:'py-3 px-5',
                            onClick: footerConfig.saveButton.action
                        }}>
                            {footerConfig.saveButton.label}
                        </BasicButton>
                    </div>
                )}

        </footer>
    );
}
