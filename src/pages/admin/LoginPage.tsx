import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { EVENT } from '@/config/event'
import { authService, ServiceError, usingMockServices } from '@/services'

const schema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
})
type LoginValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const redirectedFrom = params.get('next')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  async function onSubmit({ email, password }: LoginValues) {
    setFailure(null)
    try {
      await authService.signIn(email, password)
      const next = redirectedFrom?.startsWith('/admin') ? redirectedFrom : '/admin'
      navigate(next, { replace: true })
    } catch (error) {
      const code = error instanceof ServiceError ? error.code : 'UNKNOWN'
      setFailure(
        code === 'INVALID_CREDENTIALS'
          ? 'Incorrect email or password.'
          : code === 'FORBIDDEN'
            ? 'This account does not have organiser access.'
            : "Couldn't sign in. Check your connection and try again.",
      )
    }
  }

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="size-16 p-1 shadow-card" />
          <p className="mt-4 text-overline font-bold tracking-wider text-gold uppercase">{EVENT.shortName}</p>
          <h1 className="text-title font-semibold text-ink">Admin Portal</h1>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-5 p-5 sm:p-6">
          {redirectedFrom && !failure && <Alert>Please sign in to continue.</Alert>}
          {failure && (
            <Alert tone="danger" live>
              {failure}
            </Alert>
          )}
          <Field label="Email" error={errors.email?.message}>
            {(a11y) => <Input {...a11y} {...register('email')} type="email" autoComplete="username" inputMode="email" />}
          </Field>
          <Field label="Password" error={errors.password?.message}>
            {(a11y) => (
              <div className="relative">
                <Input
                  {...a11y}
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-control text-ink-subtle hover:text-brand"
                >
                  {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
                </button>
              </div>
            )}
          </Field>
          <Button type="submit" loading={isSubmitting} icon={<LogIn aria-hidden className="size-5" />}>
            Sign In
          </Button>
        </form>
        {usingMockServices && (
          <p className="mt-4 text-center text-caption text-ink-subtle">
            Development mock login: admin@mwa.test / mwa-admin
          </p>
        )}
      </div>
    </main>
  )
}
