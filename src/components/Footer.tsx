import Link from 'next/link'
import { CATEGORIES } from '@/lib/utils'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold mb-2">Mara<span className="text-green-700">pedia</span></h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              A free, community-built encyclopedia preserving the history, culture, language, and traditions of the Mara people.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-700">Categories</h4>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.map(cat => (
                <Link key={cat.value} href={`/category/${cat.value}`} className="text-sm text-gray-500 hover:text-green-700">
                  {cat.icon} {cat.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-700">Contribute</h4>
            <div className="flex flex-col gap-1">
              <Link href="/register" className="text-sm text-gray-500 hover:text-green-700">Create account</Link>
              <Link href="/articles/create" className="text-sm text-gray-500 hover:text-green-700">Write an article</Link>
              <Link href="/search" className="text-sm text-gray-500 hover:text-green-700">Search articles</Link>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400">Supported languages:</p>
              <div className="flex gap-2 mt-1">
                {['Mara', 'English', 'Myanmar', 'Mizo'].map(lang => (
                  <span key={lang} className="text-xs px-2 py-0.5 border border-gray-200 rounded-full text-gray-500">{lang}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Marapedia — Free Mara Encyclopedia</span>
          <span>Content available under community license</span>
        </div>
      </div>
    </footer>
  )
}
