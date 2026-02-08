'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SupportModal, type TicketType } from './support-modal';

interface SupportContextType {
  openSupport: (opts?: {
    ticketType?: TicketType;
    deletionMeta?: { registrationMethod?: string; userFirstName?: string };
    onClose?: () => void;
  }) => void;
  closeSupport: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTicketType, setDefaultTicketType] = useState<TicketType | undefined>();
  const [deletionMeta, setDeletionMeta] = useState<{ registrationMethod?: string; userFirstName?: string } | undefined>();
  const onCloseCallbackRef = useRef<(() => void) | undefined>(undefined);

  const openSupport = useCallback((opts?: {
    ticketType?: TicketType;
    deletionMeta?: { registrationMethod?: string; userFirstName?: string };
    onClose?: () => void;
  }) => {
    setDefaultTicketType(opts?.ticketType);
    setDeletionMeta(opts?.deletionMeta);
    onCloseCallbackRef.current = opts?.onClose;
    setIsOpen(true);
  }, []);

  const closeSupport = useCallback(() => {
    setIsOpen(false);
    setDefaultTicketType(undefined);
    setDeletionMeta(undefined);
    onCloseCallbackRef.current?.();
    onCloseCallbackRef.current = undefined;
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
