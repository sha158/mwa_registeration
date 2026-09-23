import { Spinner } from './Spinner'

export function PageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center text-brand">
      <Spinner className="size-8" label="Loading" />
    </div>
  )
}
