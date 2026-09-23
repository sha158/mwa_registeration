import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Send, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { StepActions } from '@/features/registration/components/StepActions'
import { StepperCard } from '@/features/registration/components/Stepper'
import { ReviewMemberCard } from '@/features/registration/components/ReviewMemberCard'
import { SubmitErrorAlert } from '@/features/registration/components/SubmitErrorAlert'
import { MEMBER_NUMBERS, useRegistrationStore } from '@/features/registration/store'
import { registrationService } from '@/services'
import type { MemberInput, SubmitError } from '@/types/domain'
import { CONSENT_COPY, consentSchema, type ConsentValues } from '@/validation/consentSchema'
import { toMemberInput } from '@/validation/memberSchema'

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'failed'; error: SubmitError }

const BLOCKING: SubmitError['error'][] = ['REGISTRATION_FULL', 'REGISTRATION_CLOSED']

export default function ReviewPage() {
  const navigate = useNavigate()
  const drafts = useRegistrationStore((s) => s.members)
  const completeRegistration = useRegistrationStore((s) => s.completeRegistration)
  const [state, setState] = useState<SubmitState>({ status: 'idle' })

  const members = MEMBER_NUMBERS.map((n) => {
    const draft = drafts[n]
    return draft ? toMemberInput(draft) : null
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsentValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: { eligibility: false, accuracy: false, dataUse: false },
  })

  const [m1, m2, m3] = members
  if (!m1 || !m2 || !m3) {
    // Loader guarantees completeness; this guards against a draft edited in another tab.
    return <Alert tone="warning" title="Team details incomplete">Please go back and complete every member.</Alert>
  }
  const team: [MemberInput, MemberInput, MemberInput] = [m1, m2, m3]

  async function submit() {
    setState({ status: 'submitting' })
    let result
    try {
      result = await registrationService.submitRegistration({
        members: team,
        consent: { eligibility: true, accuracy: true, dataUse: true },
      })
    } catch {
      result = { ok: false, error: 'NETWORK_ERROR' } as const
    }
    if (result.ok) {
      completeRegistration(result)
      navigate('/register/success', { replace: true })
    } else {
      setState({ status: 'failed', error: result })
    }
  }

  const submitting = state.status === 'submitting'
  const blocked = state.status === 'failed' && BLOCKING.includes(state.error.error)

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4 sm:gap-6">
      <StepperCard step={4} title="Review your team">
        <Alert>Check all 3 members carefully. Details can't be edited after submission.</Alert>
      </StepperCard>

      <div className="flex flex-col gap-3 sm:gap-4">
        {team.map((member, i) => (
          <ReviewMemberCard key={MEMBER_NUMBERS[i]} member={member} memberNumber={MEMBER_NUMBERS[i] ?? 1} />
        ))}
      </div>

      <fieldset className="card flex flex-col gap-1 p-4 sm:p-5" disabled={submitting || blocked}>
        <legend className="sr-only">Declaration and consent</legend>
        <h2 aria-hidden className="mb-1 flex items-center gap-2 text-heading font-semibold text-ink">
          <ShieldCheck className="size-5 text-brand" />
          Declaration
        </h2>
        {(Object.keys(CONSENT_COPY) as (keyof ConsentValues)[]).map((key) => (
          <Checkbox key={key} label={CONSENT_COPY[key]} error={errors[key]?.message} {...register(key)} />
        ))}
      </fieldset>

      {state.status === 'failed' && <SubmitErrorAlert error={state.error} onRetry={() => void handleSubmit(submit)()} />}

      <StepActions
        note={<p className="text-center text-caption text-ink-subtle sm:text-right">Your slot is confirmed only after successful submission.</p>}
      >
        <ButtonLink
          to="/register/member/3"
          variant="secondary"
          icon={<ArrowLeft aria-hidden className="size-5" />}
          className="shrink-0"
          aria-label="Back to member 3"
        >
          <span className="hidden sm:inline">Back</span>
        </ButtonLink>
        <Button
          type="submit"
          loading={submitting}
          disabled={blocked}
          className="flex-1 sm:flex-none"
          iconRight={!submitting && <Send aria-hidden className="size-5" />}
        >
          {submitting ? 'Submitting Registration…' : 'Submit Registration'}
        </Button>
      </StepActions>
    </form>
  )
}
