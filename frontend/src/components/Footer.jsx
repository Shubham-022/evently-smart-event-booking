import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Twitter, Github, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const links = {
  Platform:   [{ l: 'Browse Events', h: '/events' }, { l: 'Categories', h: '#categories' }, { l: 'Schedule', h: '#schedule' }, { l: 'Pricing', h: '#pricing' }],
  Company:    [{ l: 'About Us', h: '#about' }, { l: 'Careers', h: '#' }, { l: 'Press', h: '#' }, { l: 'Blog', h: '#' }],
  Support:    [{ l: 'Help Center', h: '#' }, { l: 'FAQ', h: '#faq' }, { l: 'Contact Us', h: '#' }, { l: 'Privacy Policy', h: '#' }],
};

const socials = [
  { icon: Twitter,   href: '#', label: 'Twitter' },
  { icon: Github,    href: '#', label: 'GitHub' },
  { icon: Linkedin,  href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-darker/80">
      <div className="container-max section-padding pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center glow-purple-sm group-hover:scale-110 transition-transform">
                <Zap size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-2xl">
                <span className="text-white">Event</span><span className="text-gradient">ly</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              Your premier platform for discovering and booking extraordinary events
              across the globe — powered by real-time technology.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-lavender hover:border-brand-purple/40 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([col, items]) => (
            <div key={col}>
              <h4 className="font-semibold text-white mb-4 text-sm tracking-wide">{col}</h4>
              <ul className="space-y-3">
                {items.map(({ l, h }) => (
                  <li key={l}>
                    <Link
                      to={h.startsWith('#') ? '/' : h}
                      className="text-sm text-gray-400 hover:text-brand-lavender transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap gap-6 mb-10 py-6 border-y border-brand-border">
          {[
            { icon: Mail,    text: 'hello@evently.com' },
            { icon: Phone,   text: '+1 (555) 000-1234' },
            { icon: MapPin,  text: 'San Francisco, CA' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-400">
              <Icon size={14} className="text-brand-violet" />
              {text}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Evently. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built with ❤️ for extraordinary experiences
          </p>
        </div>
      </div>
    </footer>
  );
}
