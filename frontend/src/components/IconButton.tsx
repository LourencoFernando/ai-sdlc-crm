import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Tooltip } from 'radix-ui';

/** A round icon button with a tooltip and an accessible name. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode; danger?: boolean }
>(function IconButton({ label, children, danger, className = '', ...rest }, ref) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button ref={ref} type="button" aria-label={label} className={`icon-btn ${danger ? 'danger' : ''} ${className}`} {...rest}>
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" sideOffset={6}>
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
