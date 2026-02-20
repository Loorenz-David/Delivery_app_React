

import { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DesktopTimePicker } from '@mui/x-date-pickers'
import { TextField } from '@mui/material'

import { TimeIcon } from '@/assets/icons'

type PropsCustomTimePicker = {
    selectedTime: string | null | undefined
    onChange: (value: string) => void
}
export const CustomTimePicker = ({
    selectedTime,
    onChange
}: PropsCustomTimePicker) => {
    const [isOpen, setIsOpen] = useState(false)
    const value = useMemo(() => toDayjsTime(selectedTime), [selectedTime])

    const handleChange = (next: Dayjs | null) => {
        if (!next || !next.isValid()) {
            onChange('')
            return
        }
        onChange(next.format('HH:mm'))
    }

    return (
        <div
            className="custom-field-container rounded-xl relative text-sm "
            onClick={() => setIsOpen(true)}
        >
            <TimeIcon className="h-4 w-4 app-icon absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]/70" />
            <div className="w-full pl-10">
                <DesktopTimePicker
                    enableAccessibleFieldDOMStructure={false}
                    open={isOpen}
                    onOpen={() => setIsOpen(true)}
                    onClose={() => setIsOpen(false)}
                    onAccept={() => setIsOpen(false)}
                    value={value}
                    onChange={handleChange}
                    ampm={false}
                    views={['hours', 'minutes']}
                    slotProps={{
                        actionBar: {
                            actions: ['cancel', 'accept'], 
                        },
                        textField: {
                            variant: 'standard',
                            fullWidth: true,
                            InputProps: { disableUnderline: true },
                            inputProps: {
                                className: 'w-full pl-9',
                            },
                        },
                    }}
                    slots={{
                        textField: TextField,
                        openPickerButton: () => null,
                    }}
                />
            </div>
        </div>
    )
}

const toDayjsTime = (value: string | null | undefined) => {
    if (!value) return null
    const [hours, minutes] = value.split(':').map((part) => Number(part))
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
    return dayjs().hour(hours).minute(minutes).second(0).millisecond(0)
}
