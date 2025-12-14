import { InkLingsApp } from '@/components/ink-lings-app';
import { Toaster } from '@/components/ui/sonner';

export default function Onboarding() {
  return (
    <>
      <InkLingsApp initialPhase="onboarding" />
      <Toaster />
    </>
  );
}


