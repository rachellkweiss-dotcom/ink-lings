'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { SupportModal } from './support-modal';

interface SupportContextType {
  openSupport: (opts?: {
    ticketType?: 'help' | 'bug' | 'account_deletion';
    deletionMeta?: { registrationMethod?: string; userFirstName?: string };
  }) => void;
  closeSupport: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTicketType, setDefaultTicketType] = useState<'help' | 'bug' | 'account_deletion' | undefined>();
  const [deletionMeta, setDeletionMeta] = useState<{ registrationMethod?: string; userFirstName?: string } | undefined>();

  const openSupport = useCallback((opts?: {
    ticketType?: 'help' | 'bug' | 'account_deletion';
    deletionMeta?: { registrationMethod?: string; userFirstName?: string };
  }) => {
    setDefaultTicketType(opts?.ticketType);
    setDeletionMeta(opts?.deletionMeta);
    setIsOpen(true);
  }, []);

  const closeSupport = useCallback(() => {
    setIsOpen(false);
    setDefaultTicketType(undefined);
    setDeletionMeta(undefined);
  }, []);

  return (
    <SupportContext.Provider value={{ openSupport, closeSupport }}>
      {children}
      <SupportModal
        isOpen={isOpen}
        onClose={closeSupport}
        defaultTicketType={defaultTicketType}
        deletionMeta={deletionMeta}
      />
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}
