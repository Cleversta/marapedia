import { Suspense } from 'react'
import SearchClient from './SearchClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Searching...</div>}>
      <SearchClient />
    </Suspense>
  )
}