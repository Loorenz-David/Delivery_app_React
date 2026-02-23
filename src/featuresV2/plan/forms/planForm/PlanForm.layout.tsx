import { useMemo } from 'react'
import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { CustomDatePicker } from '@/shared/inputs/CustomDatePicker'
import { PlanTypeDescription, PlanTypeSelector } from '../../components'
import { InputWarning } from '@/shared/inputs/InputWarning'
import { PopupFooter } from '@/shared/popups/MainPopup/PopupFooter'

import { usePlanForm } from './PlanForm.context'








export const PlanFormLayout = ({}) => {
    const {
        mode,
        planForm,
        planSetters,
        planActions,
        planFormWarnings,
    } = usePlanForm()

    const footerConfig = useMemo(() => {
        return mode == 'edit'
            ? {
                  deleteButton: { label: 'Delete', action: planActions.handleDeletePlan },
              }
            : {
                  saveButton: { label: 'Create Plan', action: planActions.handleCreatePlan },
              }
    }, [mode, planActions.handleCreatePlan, planActions.handleDeletePlan])

    return ( 
        <>
            <form
                className="flex h-full flex-col gap-4 overflow-y-auto overflow-x-hidden pb-30 scroll-thin" 
                action=""
            >

                <Field label="Plan name:" required={true}
                    warning={ planFormWarnings.planNameWarning.warning }
                    warningController={ planFormWarnings.planNameWarning }
                >
                    <InputField value={ planForm.label }
                        onChange={ planSetters.handlePlanName }
                    />
                </Field>
                

                <div className="grid grid-cols-2 gap-6">
                    <Field label="From:" required={true} 
                   
                    >
                        <CustomDatePicker date={ planForm.start_date ? new Date( planForm.start_date ) : new Date() } 
                            onChange={ planSetters.handleStartDate }
                        />
                    </Field>
                    <Field label="To:" required={true} 
                    >
                        <CustomDatePicker date={ planForm.end_date ? new Date( planForm.end_date ) : new Date() } 
                            onChange={ planSetters.handleEndDate }
                        />
                    </Field>
                    
                </div>
                { planFormWarnings.planStartDateWarning?.warning && <InputWarning {...planFormWarnings.planStartDateWarning.warning} />}

                { mode == 'create' && 
                    <Field label="Plan type:" required={true} 
                    >
                        <PlanTypeSelector
                            selectedValue={ planForm.plan_type }
                            onChange={ planSetters.handlePlanType }
                        />
                        <PlanTypeDescription planType={planForm.plan_type} />
                    </Field>
                }
                
                
            </form>
            <PopupFooter footerConfig={footerConfig} />
        </>
    );
}
