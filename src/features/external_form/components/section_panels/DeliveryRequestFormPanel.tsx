import { useEffect, useMemo, useState } from 'react'

import { BackArrowIcon, CheckMarkIcon, LocationIcon } from '../../../../assets/icons'
import { BasicButton } from '../../../../components/buttons/BasicButton'
import { Field } from '../../../../components/forms/FieldContainer'
import { InputField } from '../../../../components/forms/InputField'
import { PhoneField, type PhoneValue } from '../../../../components/forms/PhoneField'
import { TextAreaField } from '../../../../components/forms/TextAreaField'
import { DEFAULT_PREFIX } from '../../../../constants/dropDownOptions'
import { AddressAutocomplete } from '../../../../google_maps/components/AddressAutocomplete'
import { useMessageManager } from '../../../../message_manager/MessageManagerContext'
import type { AddressPayload } from '../../../home/types/backend'
import type { FormHandoffPayload, BridgeStatus } from '../../../../webrtc/formBridge'

type StepKey = 'names' | 'contact' | 'address' | 'terms'

type FormState = {
  client_first_name: string
  client_second_name: string
  client_email: string
  client_primary_phone: PhoneValue
  client_secondary_phone: PhoneValue
  client_address: AddressPayload | null
  note: string
  acceptTerms: boolean
}

type StepDefinition = {
  key: StepKey
  label: string
  helper: string
}

const FORM_STEPS: StepDefinition[] = [
  { key: 'names', label: 'Who is receiving', helper: 'Client first and second name' },
  { key: 'contact', label: 'How to reach them', helper: 'Email and phones' },
  { key: 'address', label: 'Where to deliver', helper: 'Address and delivery note' },
  { key: 'terms', label: 'Rules', helper: 'Confirm delivery rules' },
]

const backgroundStyle = {
  backgroundImage:
    "linear-gradient(120deg, rgba(15,23,42,0.18), rgba(255,255,255,0.7)), url('https://images.unsplash.com/photo-1500111709600-7761aa8216c7?auto=format&fit=crop&w=1600&q=80')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

const buildInitialFormState = (): FormState => ({
  client_first_name: '',
  client_second_name: '',
  client_email: '',
  client_primary_phone: { prefix: DEFAULT_PREFIX, number: '' },
  client_secondary_phone: { prefix: DEFAULT_PREFIX, number: '' },
  client_address: null,
  note: '',
  acceptTerms: false,
})

const applyPayloadToFormState = (prev: FormState, payload: FormHandoffPayload): FormState => {
  const mergePhone = (current: PhoneValue, incoming?: PhoneValue): PhoneValue =>
    incoming
      ? {
          prefix: incoming.prefix ?? current.prefix,
          number: incoming.number ?? current.number,
        }
      : current

  return {
    ...prev,
    client_first_name: payload.client_first_name ?? prev.client_first_name,
    client_second_name: payload.client_second_name ?? prev.client_second_name,
    client_email: payload.client_email ?? prev.client_email,
    client_primary_phone: mergePhone(prev.client_primary_phone, payload.client_primary_phone),
    client_secondary_phone: mergePhone(prev.client_secondary_phone, payload.client_secondary_phone),
    client_address: payload.client_address ?? prev.client_address,
    note: payload.note ?? prev.note,
  }
}

const mapFormStateToPayload = (state: FormState): FormHandoffPayload => ({
  client_first_name: state.client_first_name,
  client_second_name: state.client_second_name,
  client_email: state.client_email,
  client_primary_phone: state.client_primary_phone,
  client_secondary_phone: state.client_secondary_phone.number.trim() ? state.client_secondary_phone : undefined,
  client_address: state.client_address,
  note: state.note,
})

interface DeliveryRequestFormPanelProps {
  isActive: boolean
  onOpen: () => void
  onClose: () => void
  collapseOnSubmit?: boolean
  incomingPayload?: FormHandoffPayload | null
  connectionStatus: BridgeStatus
  connectionError?: string | null
  onSubmitResponse: (payload: FormHandoffPayload) => void
}

export function DeliveryRequestFormPanel({
  isActive,
  onOpen: _onOpen,
  onClose,
  collapseOnSubmit = true,
  incomingPayload,
  connectionStatus, // consumed in UI
  connectionError,  // consumed in UI
  onSubmitResponse,
}: DeliveryRequestFormPanelProps) {
  return (
    <div className="relative h-full  overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm ">
      <div className="absolute inset-0" style={backgroundStyle} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/80 to-white/90" />

      <div className="relative space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Delivery intake</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">Bring in a new delivery request</p>
            <p className="text-sm text-[var(--color-muted)]">
              Capture the receiver details, where to drop off, and ensure they accept the delivery rules before you
              dispatch a driver.
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Live handoff status: <span className="font-semibold text-[var(--color-text)]">{connectionStatus}</span>{' '}
              {connectionError ? <span className="text-red-500">({connectionError})</span> : null}
            </p>
          </div>

         
        </div>

        {isActive ? (
          <DeliveryProgressForm
            onClose={onClose}
            collapseOnSubmit={collapseOnSubmit}
            incomingPayload={incomingPayload}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            onSubmitResponse={onSubmitResponse}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">Form is hidden</p>
              <p className="text-sm text-[var(--color-muted)]">
                It will open automatically when a paired device sends a form.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DeliveryProgressForm({
  onClose,
  collapseOnSubmit = true,
  incomingPayload,
  connectionStatus: _connectionStatus,
  connectionError: _connectionError,
  onSubmitResponse,
}: {
  onClose?: () => void
  collapseOnSubmit?: boolean
  incomingPayload?: FormHandoffPayload | null
  connectionStatus: BridgeStatus
  connectionError?: string | null
  onSubmitResponse: (payload: FormHandoffPayload) => void
}) {
  const { showMessage } = useMessageManager()
  const [formState, setFormState] = useState<FormState>(() => buildInitialFormState())
  const [currentStep, setCurrentStep] = useState<StepKey>('names')
  const [furthestStepIndex, setFurthestStepIndex] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)

  const currentIndex = useMemo(() => FORM_STEPS.findIndex((step) => step.key === currentStep), [currentStep])
  const isLastStep = currentIndex === FORM_STEPS.length - 1

  const goToStep = (target: StepKey) => {
    const targetIndex = FORM_STEPS.findIndex((step) => step.key === target)
    if (targetIndex < 0) {
      return
    }
    if (targetIndex > furthestStepIndex) {
      return
    }
    setCurrentStep(target)
    setStepError(null)
  }

  const validateStep = (step: StepKey = currentStep) => {
    if (step === 'names') {
      if (!formState.client_first_name.trim() || !formState.client_second_name.trim()) {
        setStepError('Please add both the first and second name to continue.')
        return false
      }
    }
    if (step === 'contact') {
      const hasEmail = formState.client_email.trim()
      const emailLooksValid = /\S+@\S+\.\S+/.test(formState.client_email.trim())
      if (!hasEmail || !emailLooksValid) {
        setStepError('Add a valid contact email.')
        return false
      }
      if (!formState.client_primary_phone.number.trim()) {
        setStepError('Primary phone is required.')
        return false
      }
    }
    if (step === 'address') {
      if (!formState.client_address) {
        setStepError('Pick a delivery address to continue.')
        return false
      }
    }
    if (step === 'terms') {
      if (!formState.acceptTerms) {
        setStepError('Please accept the delivery rules before submitting.')
        return false
      }
    }
    setStepError(null)
    return true
  }

  const handleNext = () => {
    if (!validateStep()) {
      return
    }
    const nextIndex = currentIndex + 1
    if (nextIndex >= FORM_STEPS.length) {
      return
    }
    setFurthestStepIndex((prev) => Math.max(prev, nextIndex))
    setCurrentStep(FORM_STEPS[nextIndex].key)
  }

  const handleBack = () => {
    if (currentIndex === 0) {
      return
    }
    const prevIndex = currentIndex - 1
    setCurrentStep(FORM_STEPS[prevIndex].key)
    setStepError(null)
  }

  const handleSubmit = () => {
    if (!validateStep('terms')) {
      return
    }

    onSubmitResponse(mapFormStateToPayload(formState))
    showMessage({
      status: 200,
      message: 'Delivery request captured. You can dispatch it once you are ready.',
    })
    setFormState(buildInitialFormState())
    setCurrentStep('names')
    setFurthestStepIndex(0)
    setStepError(null)
    if (collapseOnSubmit) {
      onClose?.()
    }
  }

  useEffect(() => {
    if (incomingPayload) {
      setFormState((prev) => applyPayloadToFormState(prev, incomingPayload))
      setCurrentStep('names')
      setFurthestStepIndex(0)
    }
  }, [incomingPayload])

  const renderStepContent = () => {
    switch (currentStep) {
      case 'names':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Client first name" required>
              <InputField
                placeholder="Jane"
                value={formState.client_first_name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, client_first_name: event.target.value }))
                }
              />
            </Field>
            <Field label="Client second name" required>
              <InputField
                placeholder="Doe"
                value={formState.client_second_name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, client_second_name: event.target.value }))
                }
              />
            </Field>
          </div>
        )
      case 'contact':
        return (
          <div className="grid grid-cols-1 gap-4 ">
            <Field label="Client email" required>
              <InputField
                type="email"
                placeholder="client@email.com"
                value={formState.client_email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, client_email: event.target.value }))
                }
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PhoneField
                label="Primary phone"
                value={formState.client_primary_phone}
                onChange={(next) =>
                  setFormState((prev) => ({ ...prev, client_primary_phone: next }))
                }
                required
              />
              <PhoneField
                label="Secondary phone (optional)"
                value={formState.client_secondary_phone}
                onChange={(next) =>
                  setFormState((prev) => ({ ...prev, client_secondary_phone: next }))
                }
              />
            </div>
          </div>
        )
      case 'address':
        return (
          <div className="space-y-4">
            <Field label="Client address" required>
              <AddressAutocomplete
                placeholder="Search address"
                onAddressSelected={(address) =>
                  setFormState((prev) => ({
                    ...prev,
                    client_address: address,
                  }))
                }
                onAddressCleared={() =>
                  setFormState((prev) => ({
                    ...prev,
                    client_address: null,
                  }))
                }
                existingAddress={formState.client_address}
                leadingIcon={<LocationIcon className="app-icon h-4 w-4 text-[var(--color-muted)]" />}
                enableManualPicker
              />
            </Field>
            <Field label="Note for the driver">
              <TextAreaField
                placeholder="Gate code, preferred entrance, drop-off instructions..."
                value={formState.note}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        )
      case 'terms':
      default:
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)]/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-[var(--color-text)]">Rules of delivery</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-muted)]">
                <li>Driver will wait up to 10 minutes once onsite.</li>
                <li>Keep the primary phone reachable for drop-off confirmation.</li>
                <li>A proof-of-delivery photo may be captured when requested.</li>
                <li>Provide gate codes or special instructions in the note above.</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm shadow-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                checked={formState.acceptTerms}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    acceptTerms: event.target.checked,
                  }))
                }
              />
              <span className="text-[var(--color-text)]">
                I reviewed and accept the delivery rules on behalf of the client.
              </span>
            </label>
          </div>
        )
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white/85 p-5 shadow-lg backdrop-blur">
      

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] transition hover:text-[var(--color-primary)] disabled:opacity-50"
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          <BackArrowIcon className="app-icon h-4 w-4" />
          Back
        </button>
        {/* <p className="text-xs font-medium text-[var(--color-muted)]">
          Step {currentIndex + 1} of {FORM_STEPS.length}
        </p> */}
      </div>

      <StepProgress currentIndex={currentIndex} furthestIndex={furthestStepIndex} onStepClick={goToStep} />

      {stepError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{stepError}</div>
      ) : null}

      <div className="space-y-4 pt-7">{renderStepContent()}</div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-8">
        <div className="flex items-center gap-2">
          <BasicButton
            params={{
              variant: 'ghost',
              onClick: () => {
                setFormState(buildInitialFormState())
                setCurrentStep('names')
                setFurthestStepIndex(0)
                setStepError(null)
              },
            }}
          >
            Reset
          </BasicButton>
          {isLastStep ? (
            <BasicButton
              params={{
                variant: 'primary',
                onClick: handleSubmit,
              }}
            >
              Submit request
            </BasicButton>
          ) : (
            <BasicButton
              params={{
                variant: 'primary',
                onClick: handleNext,
              }}
            >
              Next
            </BasicButton>
          )}
        </div>
      </div>
    </div>
  )
}

function StepProgress({
  currentIndex,
  furthestIndex,
  onStepClick,
}: {
  currentIndex: number
  furthestIndex: number
  onStepClick: (step: StepKey) => void
}) {
  const progressWidth = useMemo(() => {
    const denominator = Math.max(FORM_STEPS.length - 1, 1)
    const progressIndex = Math.max(furthestIndex, currentIndex)
    return `${(progressIndex / denominator) * 100}%`
  }, [currentIndex, furthestIndex])

  return (
    <div className="space-y-3 ">
      <div className="relative flex flex-col ">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-border)]" />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-primary)] transition-all duration-300"
          style={{ width: progressWidth }}
        />
        <div className="relative flex items-center justify-between gap-2">
          {FORM_STEPS.map((step, index) => {
            const isCurrent = index === currentIndex
            const isCompleted = index < currentIndex || index < furthestIndex
            const isClickable = index <= furthestIndex
            const circleClasses = [
              'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition shadow-sm',
              isCurrent
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                : isCompleted
                ? 'border-[var(--color-primary)] bg-white text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-white text-[var(--color-muted)]',
              isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
            ].join(' ')

            return (
              <button
                key={step.key}
                type="button"
                className="flex flex-col items-center gap-4 text-center"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
              >
                <span className={circleClasses}>
                  {isCompleted && !isCurrent ? <CheckMarkIcon className="app-icon h-4 w-4" /> : index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[var(--color-text)]">{step.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    {step.helper}
                  </span>

                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
