import { useLoaderData } from 'react-router'
import type { memberStepLoader } from '@/app/loaders'
import { MemberForm } from '@/features/registration/components/MemberForm'

export default function MemberStepPage() {
  const { memberNumber } = useLoaderData<typeof memberStepLoader>()
  // Keyed so each member gets a fresh form instance seeded from the draft store.
  return <MemberForm key={memberNumber} memberNumber={memberNumber} />
}
