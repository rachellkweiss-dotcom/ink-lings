'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GratitudeChallengeEnrolledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-orange-50 dark:from-blue-900/10 dark:via-amber-900/10 dark:to-orange-900/10" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      {/* Header */}
      <div className="w-full pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Link href="/auth">
              <Image
                src="/ink_links_logo_final_final.png"
                alt="Ink-lings Logo"
                width={390}
                height={156}
                priority
                className="h-24 w-auto"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-12">
        {/* Success Message */}
        <Card className="bg-green-50 dark:bg-green-900/30 border-2 border-green-500 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-8 h-8 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200">
                  2026 Gratitude Challenge
                </h1>
                <svg className="w-8 h-8 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 font-semibold mb-6">
                The Year of Gratitude
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-1">
                  You&apos;re enrolled!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Welcome to the 2026 Gratitude Challenge! Starting January 1st, you&apos;ll receive daily gratitude prompts separate from your normal ink-lings schedule.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instagram CTA */}
        <Card className="bg-gradient-to-br from-blue-100 via-amber-100 to-orange-100 dark:from-blue-900/30 dark:via-amber-900/30 dark:to-orange-900/30 border-2 border-blue-600 dark:border-blue-500 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg className="w-8 h-8 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
                Join us on Instagram
              </h2>
            </div>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-4">
              Follow us <a href="https://instagram.com/ink_lings_journal" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">@ink_lings_journal</a>
            </p>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
              We&apos;ll be posting daily and we&apos;ll be sharing our answers. You can too, or you don&apos;t have to. But if you do, use the hashtag{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">#ink-lings2026gratitude</span>{' '}
              so we can follow too!
            </p>
            <a 
              href="https://instagram.com/ink_lings_journal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-medium px-6 py-2">
                Follow @ink_lings_journal
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

