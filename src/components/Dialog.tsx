import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  label: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modaler Dialog auf Basis des nativen <dialog>: Fokusfalle, ESC und inerter Hintergrund inklusive. */
export function Dialog({ open, label, className, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const programmatic = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) { programmatic.current = true; d.close(); }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={label}
      onClose={() => {
        if (programmatic.current) { programmatic.current = false; return; }
        onClose();
      }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open ? children : null}
    </dialog>
  );
}
