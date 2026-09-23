import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, BadgeCheck, Briefcase, GraduationCap, IdCard, Scale, UserRound } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/Card'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { DISTRICTS, EVENT, LIMITS } from '@/config/event'
import { checkAge } from '@/domain/age'
import type { MemberNumber } from '@/types/domain'
import { createMemberSchema, emptyMemberForm } from '@/validation/memberSchema'
import { otherMobiles, useRegistrationStore } from '../store'
import { AadhaarUpload } from './AadhaarUpload'
import { StepActions } from './StepActions'
import { StepperCard } from './Stepper'

const YES_NO = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
]

export function MemberForm({ memberNumber: n }: { memberNumber: MemberNumber }) {
  const navigate = useNavigate()
  const members = useRegistrationStore((s) => s.members)
  const saveMember = useRegistrationStore((s) => s.saveMember)
  const isLead = n === 1
  const isLast = n === LIMITS.teamSize

  // Schema depends on the other members' mobiles, read once when the step mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schema = useMemo(() => createMemberSchema({ otherMobiles: otherMobiles(members, n) }), [n])

  const {
    register,
    control,
    handleSubmit,
    trigger,
    subscribe,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: members[n] ?? emptyMemberForm,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  // Keep the draft in the store as the user types, so Back / reload never loses input.
  useEffect(
    () => subscribe({ formState: { values: true }, callback: ({ values }) => saveMember(n, values) }),
    [subscribe, saveMember, n],
  )

  const [dateOfBirth, participantStatus, studyingInMadrasa, isAalim] = useWatch({
    control,
    name: ['dateOfBirth', 'participantStatus', 'studyingInMadrasa', 'isAalim'],
  })
  const age = dateOfBirth ? checkAge(dateOfBirth) : null
  const ineligible = age?.status === 'too-old' || age?.status === 'too-young' || studyingInMadrasa === 'yes' || isAalim === 'yes'
  const eligibilityConfirmed = age?.status === 'eligible' && studyingInMadrasa === 'no' && isAalim === 'no'

  const validateNow = { onChange: (e: { target: { name: string } }) => void trigger(e.target.name as 'isAalim') }
  const autofill = (token: string) => (isLead ? token : 'off')

  const onValid = () => navigate(isLast ? '/register/review' : `/register/member/${n + 1}`)

  return (
    <form noValidate onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4 sm:gap-6">
      <StepperCard step={n} title={isLead ? 'Member 1 · Team Lead' : `Member ${n}`}>
        <Alert>
          {isLead
            ? `You'll enter details for all ${LIMITS.teamSize} team members. The Team Lead is the primary contact.`
            : `Enter details for the ${n === 2 ? 'second' : 'third'} team member.`}
        </Alert>
      </StepperCard>

      <SectionCard icon={<UserRound />} title="Personal details" titleId="personal">
        <Field label="Full name (as on Aadhaar)" required error={errors.fullName?.message}>
          {(a11y) => <Input {...a11y} {...register('fullName')} autoComplete={autofill('name')} autoCapitalize="words" />}
        </Field>

        <Field
          label="Mobile number"
          required
          error={errors.mobileNumber?.message}
          hint={isLead ? 'Organisers will contact the team on this number.' : undefined}
        >
          {(a11y) => (
            <div className="flex gap-2">
              <span className="control flex w-auto shrink-0 items-center font-semibold text-ink-muted" aria-hidden>
                +91
              </span>
              <Input
                {...a11y}
                {...register('mobileNumber')}
                type="tel"
                inputMode="numeric"
                autoComplete={autofill('tel-national')}
                placeholder="98765 43210"
                maxLength={14}
              />
            </div>
          )}
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Field
              label="Date of birth"
              required
              aside={`Age ${LIMITS.minAge}–${LIMITS.maxAge}`}
              error={errors.dateOfBirth?.message}
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  {...register('dateOfBirth', validateNow)}
                  type="date"
                  min="1950-01-01"
                  max={EVENT.date}
                  autoComplete={autofill('bday')}
                />
              )}
            </Field>
            {age?.status === 'eligible' && (
              <p role="status" className="flex items-center gap-2 rounded-control bg-success-bg px-3 py-2 text-caption font-semibold text-success">
                <BadgeCheck aria-hidden className="size-4" />
                Age on competition day: {age.age} years · Eligible
              </p>
            )}
          </div>
          <Field label="District" required error={errors.district?.message}>
            {(a11y) => (
              <Select {...a11y} {...register('district')}>
                <option value="" disabled>
                  Select district
                </option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Residential address" required error={errors.residentialAddress?.message}>
          {(a11y) => (
            <Textarea
              {...a11y}
              {...register('residentialAddress')}
              autoComplete={autofill('street-address')}
              placeholder="House / street, area, town, PIN code"
            />
          )}
        </Field>
      </SectionCard>

      <SectionCard icon={<GraduationCap />} title="Education or work" titleId="occupation">
        <ChoiceGroup
          legend="Currently"
          required
          appearance="segmented"
          inputProps={register('participantStatus', validateNow)}
          error={errors.participantStatus?.message}
          options={[
            { value: 'student', label: 'Student', icon: <GraduationCap aria-hidden className="size-[18px]" /> },
            { value: 'working', label: 'Working', icon: <Briefcase aria-hidden className="size-[18px]" /> },
          ]}
        />
        {participantStatus === 'student' && (
          <div key="student" className="grid gap-5 motion-safe:animate-fade-in md:grid-cols-2">
            <Field label="Course / study details" required error={errors.courseDetails?.message}>
              {(a11y) => <Input {...a11y} {...register('courseDetails')} placeholder="e.g. B.Com, 2nd year" />}
            </Field>
            <Field label="Institution" required error={errors.institution?.message}>
              {(a11y) => <Input {...a11y} {...register('institution')} placeholder="College or university" />}
            </Field>
          </div>
        )}
        {participantStatus === 'working' && (
          <div key="working" className="grid gap-5 motion-safe:animate-fade-in md:grid-cols-2">
            <Field label="Occupation" required error={errors.occupation?.message}>
              {(a11y) => <Input {...a11y} {...register('occupation')} placeholder="e.g. Accountant" />}
            </Field>
            <Field label="Employer / company" required error={errors.employer?.message}>
              {(a11y) => <Input {...a11y} {...register('employer')} autoComplete={autofill('organization')} />}
            </Field>
          </div>
        )}
      </SectionCard>

      <SectionCard icon={<Scale />} title="Eligibility" titleId="eligibility">
        <ChoiceGroup
          legend="Currently studying in a Madrasa?"
          required
          options={YES_NO}
          inputProps={register('studyingInMadrasa', validateNow)}
          error={errors.studyingInMadrasa?.message}
        />
        <ChoiceGroup
          legend="Are you an Aalim?"
          required
          options={YES_NO}
          inputProps={register('isAalim', validateNow)}
          error={errors.isAalim?.message}
        />
        {eligibilityConfirmed && (
          <Alert tone="success" live>
            Member {n} meets the eligibility criteria.
          </Alert>
        )}
      </SectionCard>

      <SectionCard icon={<IdCard />} title="Aadhaar card" titleId="aadhaar">
        <p className="-mt-2 text-small text-ink-muted">Upload the side showing name, photo and date of birth.</p>
        <Controller
          control={control}
          name="aadhaar"
          render={({ field, fieldState }) => (
            <AadhaarUpload
              memberNumber={n}
              value={field.value ?? null}
              onChange={(ref) => {
                field.onChange(ref)
                void trigger('aadhaar')
              }}
              onBlur={field.onBlur}
              focusRef={field.ref}
              error={fieldState.error?.message}
            />
          )}
        />
      </SectionCard>

      <StepActions
        note={
          ineligible && (
            <p role="alert" className="text-small font-medium text-danger-strong sm:text-right">
              Member {n} is not eligible. Review the highlighted answers.
            </p>
          )
        }
      >
        <ButtonLink
          to={isLead ? '/' : `/register/member/${n - 1}`}
          variant="secondary"
          icon={<ArrowLeft aria-hidden className="size-5" />}
          className="shrink-0"
          aria-label={isLead ? 'Back to overview' : `Back to member ${n - 1}`}
        >
          <span className="hidden sm:inline">Back</span>
        </ButtonLink>
        <Button
          type="submit"
          disabled={ineligible}
          className="flex-1 sm:flex-none"
          iconRight={<ArrowRight aria-hidden className="size-5" />}
        >
          {isLast ? 'Review team' : `Continue to Member ${n + 1}`}
        </Button>
      </StepActions>
    </form>
  )
}
