'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupport } from '@/components/support-context';

export default function ContactPage() {
  const { openSupport } = useSupport();
  const router = useRouter();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;

    openSupport({
      onClose: () => {
        // Navigate home when the modal is closed
        router.push('/');
      },
    });
  }, [openSupport, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10" />
  );
}
