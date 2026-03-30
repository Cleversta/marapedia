import { Suspense } from 'react'
import CreateArticlePage from './CreateArticleClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading...</div>}>
      <CreateArticlePage />
    </Suspense>
  )
}