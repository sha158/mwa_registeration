import { MapPinOff } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { StateMessage } from '@/components/ui/States'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-form px-4 py-16">
      <h1 className="sr-only">Page not found</h1>
      <StateMessage
        icon={<MapPinOff />}
        title="Page not found"
        description="The link may be broken or the page may have moved."
        action={<ButtonLink to="/">Go to registration home</ButtonLink>}
      />
    </div>
  )
}
