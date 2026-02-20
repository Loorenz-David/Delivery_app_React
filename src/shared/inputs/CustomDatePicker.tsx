import { useState  } from 'react'
import { DayPicker} from "react-day-picker";
import { motion } from 'framer-motion'

import { FloatingPopover } from '@/shared/popups/FloatingPopover/FloatingPopover'
import { fieldContainer } from '@/constants/classes'
import { CalendarIcon } from '@/assets/icons'

import "react-day-picker/style.css";


type PropsDatePicker = {
    date?: Date | null,
    onChange?: (d: any)=> void
}

export const CustomDatePicker = ({
    date,
    onChange,
}:PropsDatePicker)=>{
   
    const [ showCalendar, setShowCalendar ] = useState( false )

    const handleSelect = (value: any)=>{
        if (!value) return

        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, '0')
        const day = String(value.getDate()).padStart(2, '0')

        const localDate = `${year}-${month}-${day}`

        onChange?.(localDate)
        setShowCalendar( false )
    }

    return(
            <FloatingPopover
                open={showCalendar}
                onOpenChange={setShowCalendar}
                classes={'relative'}
                reference={
                    <div
                        className={fieldContainer}
                        onClick={()=> setShowCalendar(prev => !prev)}
                    >
                        <div className="flex items-center gap-2 flex-1">
                            <CalendarIcon className="h-5 w-5 stroke-[var(--color-muted)]/70"/>
                            <span className="text-sm text-[var(--color-muted)]/70">
                                { date ? 
                                    formatDateForDisplay(date)
                                    :
                                    "yyy-mm-dd "
                                }
                            </span>
                        </div>
                    </div>
                }
            >
                <motion.div className=" text-sm   overflow-hidden px-4 py-1 shadow-md rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] "
                    key={`calendar ${new Date().toISOString()}`}
                    initial={{ height: 0, opacity: 0, y: -4 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                    <DayPicker
                        mode="single"
                        {...(date ? {selected: date} : {})}

                        defaultMonth={getMonthStart(date ?? new Date())}
                        onSelect={handleSelect}
                        classNames={{
                            today: `text-blue-500`, // Add a border to today's date
                            selected: `bg-black rounded-lg  text-white`,  // Highlight the selected day
                            chevron: `fill-black`, // Change the color of the chevron
                        }}
                    />
                </motion.div>
            </FloatingPopover>
          
    )
}

const getMonthStart = ( date: Date ) =>{
    const normalized = new Date(date.getFullYear(), date.getMonth() + 1, 15, 12,0,0)
    return normalized
}

const formatDateForDisplay = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
