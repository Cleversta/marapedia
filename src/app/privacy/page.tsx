// app/privacy/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Marapedia',
  description: 'Marapedia privacy policy — how we collect, use, and protect your personal information.',
}

const sections = [
  {
    number: '1',
    icon: '📋',
    title: 'Information We Collect',
    content: [
      { type: 'p', text: 'When you register for an account, we collect your username, email address, and optionally your full name and profile photo.' },
      { type: 'p', text: 'When you contribute articles or translations, we store the content you submit along with your user ID and the timestamps of your contributions.' },
      { type: 'p', text: 'We automatically collect basic usage data such as which articles are viewed, to maintain view counts. We do not track individual users across sessions.' },
    ],
  },
  {
    number: '2',
    icon: '⚙️',
    title: 'How We Use Your Information',
    content: [
      { type: 'p', text: 'We use your information to:' },
      {
        type: 'ul', items: [
          'Create and manage your Marapedia account.',
          'Display your username alongside articles and contributions you have made.',
          'Allow editors and administrators to review and manage content.',
          'Send important account-related emails such as password resets.',
          'Improve the encyclopedia and understand how content is being used.',
        ],
      },
    ],
  },
  {
    number: '3',
    icon: '🚫',
    title: 'Information We Do Not Collect',
    content: [
      { type: 'p', text: 'Marapedia does not collect payment information, precise location data, or device identifiers beyond what is necessary to serve the application.' },
      { type: 'p', text: 'We do not serve advertisements and do not share your data with advertisers.' },
      { type: 'p', text: 'We do not sell, rent, or trade your personal information to any third party.' },
    ],
  },
  {
    number: '4',
    icon: '🔒',
    title: 'Data Storage & Security',
    content: [
      { type: 'p', text: 'Your data is stored securely using Supabase, a trusted backend platform. All data is encrypted in transit using HTTPS.' },
      { type: 'p', text: 'Passwords are never stored in plain text. We use industry-standard authentication practices.' },
      { type: 'p', text: 'While we take reasonable measures to protect your information, no system is completely secure. We encourage you to use a strong, unique password for your account.' },
    ],
  },
  {
    number: '5',
    icon: '🌐',
    title: 'Public Content',
    content: [
      { type: 'p', text: 'All articles, translations, and contributions you publish on Marapedia are public. Your username will be displayed alongside your contributions.' },
      { type: 'p', text: 'Content you contribute may be edited, improved, or moderated by other community members and administrators in accordance with our content guidelines.' },
    ],
  },
  {
    number: '6',
    icon: '👤',
    title: 'Your Rights',
    content: [
      { type: 'p', text: 'You have the right to:' },
      {
        type: 'ul', items: [
          'Access the personal information we hold about you.',
          'Request correction of inaccurate information.',
          'Request deletion of your account and associated personal data.',
          'Withdraw consent for optional data uses at any time.',
        ],
      },
      { type: 'p', text: 'To exercise any of these rights, contact us at contact@marapedia.org.' },
    ],
  },
  {
    number: '7',
    icon: '🍪',
    title: 'Cookies',
    content: [
      { type: 'p', text: 'Marapedia uses only essential cookies required for authentication and session management. We do not use tracking or advertising cookies.' },
    ],
  },
  {
    number: '8',
    icon: '👶',
    title: "Children's Privacy",
    content: [
      { type: 'p', text: "Marapedia is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can delete it." },
    ],
  },
  {
    number: '9',
    icon: '📝',
    title: 'Changes to This Policy',
    content: [
      { type: 'p', text: 'We may update this privacy policy from time to time. When we do, we will update the effective date at the top of this page. Continued use of Marapedia after changes constitutes acceptance of the updated policy.' },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <span className="inline-block text-xs uppercase tracking-widest text-green-700 font-medium mb-3 px-3 py-1 border border-green-200 rounded-full bg-white/60">
            Last Updated: April 2026
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-green-950 mb-4 leading-tight">
            Privacy <span className="text-green-700">Policy</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            We respect your privacy and are committed to protecting your personal information.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">

        {/* Sections */}
        {sections.map((section) => (
          <section key={section.number}>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {section.number}
              </span>
              <span>{section.icon}</span>
              {section.title}
            </h2>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed pl-9">
              {section.content.map((block, i) => {
                if (block.type === 'p') {
                  return <p key={i}>{block.text}</p>
                }
                if (block.type === 'ul') {
                  return (
                    <ul key={i} className="space-y-1.5">
                      {block.items!.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )
                }
                return null
              })}
            </div>
            {section.number !== '9' && (
              <hr className="mt-10 border-gray-100" />
            )}
          </section>
        ))}

        {/* Contact box */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 text-xl">
            📧
          </div>
          <div>
            <h3 className="font-display font-bold text-gray-900 mb-1">
              Questions about this policy?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Contact us at{' '}
              <a href="mailto:contact@marapedia.org"
                className="text-green-700 hover:underline font-medium">
                contact@marapedia.org
              </a>{' '}
              and we will be happy to help.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center pt-4">
          <Link href="/about"
            className="text-sm text-gray-400 hover:text-green-700 transition-colors">
            ← Back to About Marapedia
          </Link>
        </div>

      </div>
    </div>
  )
}