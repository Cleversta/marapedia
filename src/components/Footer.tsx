import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <h3 className="font-display text-lg font-bold mb-2">Mara<span className="text-green-700">pedia</span></h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              A free, community-built encyclopedia preserving the history, culture, language, and traditions of the Mara people.
            </p>
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Supported languages:</p>
              <div className="flex gap-2 flex-wrap">
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