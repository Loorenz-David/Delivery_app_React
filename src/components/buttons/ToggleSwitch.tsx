import { cn } from '../../lib/utils/cn'

interface ToggleSwitchProps {
    checked: boolean
    onClick: () => void
}

export function ToggleSwitch({ checked, onClick }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full border border-transparent transition-colors duration-200',
                checked ? 'bg-[#111827]' : 'bg-gray-200',
            )}
            aria-pressed={checked}
        >
            <span
                className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200',
                    checked ? 'translate-x-5' : 'translate-x-1',
                )}
            />
        </button>
    )
}