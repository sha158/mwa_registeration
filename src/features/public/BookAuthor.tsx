import { BOOK } from '@/config/event'

/** Author of the prescribed book with the Arabic honorific, marked up for correct shaping. */
export function BookAuthor() {
  return (
    <>
      {BOOK.author} (
      <span lang="ar" dir="rtl">
        {BOOK.authorHonorific}
      </span>
      )
    </>
  )
}
