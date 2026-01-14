'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  username: string;
}

export function AppHeader({ username }: AppHeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/trips', label: 'Dashboard' },
    { href: '/trips', label: 'My Trips' },
    { href: '/activity', label: 'Activity' },
    { href: '/settings', label: 'Settings' },
  ];

  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/trips" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Plane className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Travel Agentic Planner</h1>
                <p className="text-xs text-gray-500">AI-Powered Trip Planning</p>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href === '/trips' && pathname.startsWith('/trips'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm ${
                    isActive
                      ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900 transition'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-gray-900"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{username}</p>
                <p className="text-xs text-gray-500">@{username.toLowerCase().replace(/\s+/g, '')}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs sm:text-sm">{initials}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
