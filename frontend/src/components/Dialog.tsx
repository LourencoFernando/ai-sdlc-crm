import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertDialog, Dialog as RDialog } from 'radix-ui';
import { X } from 'lucide-react';

const CloseContext = createContext<() => void>(() => {});

/** Closes the dialog, asking first if the form has changes. Use it for Cancel buttons. */
export function useRequestClose(): () => void {
  return useContext(CloseContext);
}

/** Put on the control that should get focus when the dialog opens, instead of the first focusable one. */
export const AUTOFOCUS = { 'data-autofocus': true } as const;

/**
 * A centered dialog. With `dirty`, closing by Cancel, Escape, the close button or the backdrop
 * asks "Discard your changes?" first, and leaving the page shows the browser's own warning.
 */
export function Dialog({
  open,
  onClose,
  title,
  dirty = false,
  size,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  dirty?: boolean;
  size?: 'wide' | 'narrow';
  children: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestClose = () => (dirty ? setConfirming(true) : onClose());

  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [open, dirty]);

  return (
    <RDialog.Root open={open} onOpenChange={(o) => !o && requestClose()}>
      <RDialog.Portal>
        <RDialog.Overlay className="dialog-backdrop" />
        <RDialog.Content
          ref={contentRef}
          className={`dialog ${size ?? ''}`}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => focusAutofocusControl(e, contentRef.current)}
        >
          <div className="dialog-head">
            <RDialog.Title className="dialog-title">{title}</RDialog.Title>
            <button type="button" className="icon-btn" aria-label="Close" onClick={requestClose}>
              <X aria-hidden="true" />
            </button>
          </div>
          <CloseContext.Provider value={requestClose}>{children}</CloseContext.Provider>
        </RDialog.Content>
      </RDialog.Portal>
      <AlertDialog.Root open={confirming} onOpenChange={setConfirming}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-backdrop" />
          <AlertDialog.Content className="dialog narrow">
            <AlertDialog.Title className="dialog-title">Discard your changes?</AlertDialog.Title>
            <AlertDialog.Description>What you typed in this form will be lost.</AlertDialog.Description>
            <div className="dialog-actions">
              <AlertDialog.Cancel className="btn btn-outline">Keep editing</AlertDialog.Cancel>
              <AlertDialog.Action
                className="btn btn-danger"
                onClick={() => {
                  setConfirming(false);
                  onClose();
                }}
              >
                Discard
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </RDialog.Root>
  );
}

function focusAutofocusControl(event: Event, content: HTMLElement | null) {
  const control = content?.querySelector<HTMLElement>('[data-autofocus]');
  if (!control) return;
  event.preventDefault();
  control.focus();
}
