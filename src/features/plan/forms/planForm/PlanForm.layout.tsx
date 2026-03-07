import { Field } from '@/shared/inputs/FieldContainer'
import { InputField } from '@/shared/inputs/InputField'
import { CustomDatePicker } from '@/shared/inputs/CustomDatePicker'
import { PlanTypeDescription, PlanTypeSelector } from '../../components'
import { InputWarning } from '@/shared/inputs/InputWarning'
import { BasicButton } from '@/shared/buttons/BasicButton'
import { ConfirmActionButton } from '@/shared/buttons/DeleteButton'
import { FeaturePopupFooter } from '@/shared/popups/featurePopup'

import { usePlanForm } from './PlanForm.context'








export const PlanFormLayout = ({}) => {
    const {
        mode,
        planForm,
        planSetters,
        planActions,
        planFormWarnings,
    } = usePlanForm()

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
                            onChange={(value) => planSetters.handleStartDate(value ?? '')}
                        />
                    </Field>
                    <Field label="To:" required={true} 
                    >
                        <CustomDatePicker date={ planForm.end_date ? new Date( planForm.end_date ) : new Date() } 
                            onChange={(value) => planSetters.handleEndDate(value ?? '')}
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
            <FeaturePopupFooter>
                {mode === 'edit' ? (
                    <ConfirmActionButton
                        onConfirm={planActions.handleDeletePlan}
                        deleteContent={'Delete'}
                        confirmContent={'Confirm Deletion'}
                        deleteClassName={'text-sm rounded-md bg-[var(--color-page)] text-red-500 border-[text-red-500] px-2 py-2'}
                        confirmClassName={'text-sm rounded-md bg-red-500 py-2 px-2 text-white'}
                    />
                ) : <span />}
                {mode === 'create' ? (
                    <div className="flex flex-1 justify-end">
                        <BasicButton
                            params={{
                                variant: 'primary',
                                className: 'py-2 px-5',
                                onClick: planActions.handleCreatePlan,
                            }}
                        >
                            Create Plan
                        </BasicButton>
                    </div>
                ) : null}
            </FeaturePopupFooter>
        </>
    );
}
