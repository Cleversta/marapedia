import Link from 'next/link'

const FOOTER_LINKS = {
  Marapedia: [
    { label: 'About Marapedia', href: '/about' },
    { label: 'How to Contribute', href: '/about#contribute' },
    { label: 'Contact Us', href: '/about#contact' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
  Browse: [
    { label: 'History', href: '/category/history' },
    { label: "Songs & Lyrics", href: '/category/songs' },
    { label: 'Poems', href: '/category/poems' },
    { label: 'Famous People', href: '/category/people' },
    { label: 'Villages & Places', href: '/category/places' },
    { label: 'Culture', href: '/category/culture' },
  ],
  Contribute: [
    { label: 'Write an Article', href: '/articles/create' },
    { label: 'Register', href: '/register' },
    { label: 'Sign In', href: '/login' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-xl font-bold mb-2">
              Mara<span className="text-green-700">pedia</span>
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              A free, community-built encyclopedia preserving the history, culture, language, and traditions of the Mara people — for generations to come.
            </p>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Available in:</p>
              <div className="flex gap-1.5 flex-wrap">
                {['Mara', 'English', 'Myanmar', 'Mizo'].map(lang => (
                  <span key={lang} className="text-xs px-2 py-0.5 border border-gray-200 rounded-full text-gray-500 bg-gray-50">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{section}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-green-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Marapedia — The Free Mara Encyclopedia</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-green-700 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy</Link>
            <Link href="/about#contact" className="hover:text-green-700 transition-colors">Contact</Link>
            <span>Content available under community license</span>
          </div>
        </div>
      </div>
    </footer>
  )
}