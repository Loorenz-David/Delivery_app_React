import { useMemo } from 'react'
import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { CustomDatePicker } from '@/shared/inputs/CustomDatePicker'
import { PlanTypeSelector } from '../components/planTypeSelector/PlanTypeSelector'
import { InputWarning } from '@/shared/inputs/InputWarning'
import { PopupFooter } from '@/shared/popups/MainPopup/PopupFooter'

import { usePlanForm } from './PlanForm.context'
import { usePlanFormPopupConfig } from './planFormPopupConfig.hook'

import { StorePickupForm } from '@/featuresV2/plan/planTypes/storePickup/popups/StorePickup.form'
import { LocalDeliveryForm } from '@/featuresV2/plan/planTypes/localDelivery/popups/LocalDelivery.form'
import { InternationalShippingForm } from '@/featuresV2/plan/planTypes/internationalShipping/popups/InternationalShipping.form'


const PlanTypeComponentMap = {
    'local_delivery':<LocalDeliveryForm/>,
    'international_shipping': <InternationalShippingForm/>,
    'store_pickup':<StorePickupForm/>,
}

export const PlanFormLayout = ({}) => {
    const {
        mode,
        planForm,
        handlePlanName,
        handleStartDate,
        handleEndDate,
        handlePlanType,
        handleCreatePlan,
        handleSavePlan,
        handleDeletePlan,
        planFormWarnings,
    } = usePlanForm()
    usePlanFormPopupConfig()
    const footerConfig = useMemo(() => {
        return mode == 'edit'
            ? {
                  saveButton: { label: 'Save Plan', action: handleSavePlan },
                  deleteButton: { label: 'Delete', action: handleDeletePlan },
              }
            : {
                  saveButton: { label: 'Create Plan', action: handleCreatePlan },
              }
    }, [mode, handleCreatePlan, handleSavePlan, handleDeletePlan])

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
                        onChange={handlePlanName}
                    />
                </Field>
                

                <div className="grid grid-cols-2 gap-6">
                    <Field label="From:" required={true} 
                   
                    >
                        <CustomDatePicker date={ planForm.start_date ? new Date( planForm.start_date ) : new Date() } 
                            onChange={ handleStartDate }
                        />
                    </Field>
                    <Field label="To:" required={true} 
                    >
                        <CustomDatePicker date={ planForm.end_date ? new Date( planForm.end_date ) : new Date() } 
                            onChange={ handleEndDate }
                        />
                    </Field>
                    
                </div>
                { planFormWarnings.planStartDateWarning?.warning && <InputWarning {...planFormWarnings.planStartDateWarning.warning} />}

                { mode == 'create' && 
                    <Field label="Plan type:" required={true} 
                    >
                        <PlanTypeSelector
                            selectedValue={ planForm.plan_type }
                            onChange={ handlePlanType }
                        />
                    </Field>
                }
                
                {/* { planForm.plan_type && 
                    PlanTypeComponentMap[ planForm.plan_type ]
                } */}
            </form>
            <PopupFooter footerConfig={footerConfig} />
        </>
    );
}
