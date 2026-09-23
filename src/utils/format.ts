const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const longDateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
})

/** yyyy-mm-dd calendar dates are formatted without timezone shifting. */
const fromIsoDay = (iso: string) => new Date(`${iso}T12:00:00+05:30`)
const toDate = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? fromIsoDay(value) : new Date(value))

export const formatDate = (value: string) => dateFmt.format(toDate(value))
export const formatLongDate = (value: string) => longDateFmt.format(toDate(value))
export const formatDateTime = (value: string) => dateTimeFmt.format(new Date(value))

/** 9845128940 → +91 98451 28940 */
export function formatMobile(digits: string): string {
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
