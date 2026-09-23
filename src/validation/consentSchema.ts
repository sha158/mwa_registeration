import { z } from 'zod'

const mustAgree = z.boolean().refine((v) => v, 'Please confirm to continue.')

export const consentSchema = z.object({
  eligibility: mustAgree,
  accuracy: mustAgree,
  dataUse: mustAgree,
})

export type ConsentValues = z.input<typeof consentSchema>

export const CONSENT_COPY: Record<keyof ConsentValues, string> = {
  eligibility: 'I confirm that all three participants meet the competition eligibility requirements.',
  accuracy: 'I confirm that the information provided is correct.',
  dataUse:
    'I consent to the submitted information being used for MWA competition registration and administration.',
}
