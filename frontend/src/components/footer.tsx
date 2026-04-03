import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    Browse: [
      { label: 'All Movies', href: '/movies' },
      { label: 'Categories', href: '/categories' },
      { label: 'Search', href: '/search' },
    ],
    Help: [
      { label: 'FAQ', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
    Connect: [
      { label: 'Twitter', href: '#', icon: 'twitter' },
      { label: 'Facebook', href: '#', icon: 'facebook' },
      { label: 'Instagram', href: '#', icon: 'instagram' },
      { label: 'YouTube', href: '#', icon: 'youtube' },
    ],
  }

  const socialIcons = {
    twitter: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    facebook: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    instagram: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 4.849-.149 3.225-1.664 4.771-4.919 4.92-.058 1.644-.069 4.849-.07 3.26-.149 4.771-4.919 4.92-.058-1.266-.057-1.645-.07-4.849-.149-3.227 1.664-4.771-4.919-4.92.059-1.265.069-1.644.07-4.849.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741.014 3.668.072 4.948.2.618 6.78-6.979 6.98.059-1.28.073-1.689.073-4.948-.072-4.354-.2-6.78-2.618-6.979-6.98.059-1.28.073-1.689.073-4.948.072-4.354-.2-.617-6.78-2.618-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 4 0 010-8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    youtube: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.015 3.015 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814a3.015 3.015 0 00-2.122-2.136c-1.871.505-9.376-.505-9.376-.505s-7.505 0-9.377.505a3.015 3.015 0 00-.502-6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.015 3.015 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0-9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814a3.015 3.015 0 00-2.122-2.136c1.871.505 9.376.505 9.376.505s7.505 0-9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  }

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 flex items-center justify-center bg-[#e50914] rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                Movie<span className="text-[#e50914]">Hub</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Discover fresh releases, featured picks, and a cleaner way to browse what to watch next.
            </p>
          </div>

          {/* Browse Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Browse</h3>
            <ul className="space-y-2.5">
              {footerLinks.Browse.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-[#e50914] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Help</h3>
            <ul className="space-y-2.5">
              {footerLinks.Help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-[#e50914] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Connect</h3>
            <div className="flex flex-wrap gap-3">
              {footerLinks.Connect.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#e50914] hover:text-white transition-all hover:scale-110"
                  aria-label={link.label}
                >
                  {socialIcons[link.icon as keyof typeof socialIcons]}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <p>
            © {currentYear} MovieHub. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="status-dot flex-shrink-0"></span>
            <span>System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
