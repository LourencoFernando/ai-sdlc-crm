export interface ControlProps {
  id: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

/** A labelled field with its error under it, in Alert red. The control gets the id and ARIA links. */
export function Field({
  label,
  error,
  optional,
  hint,
  className = '',
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  hint?: ReactNode;
  className?: string;
  /** The control, or a function given the props to put on it (for controls inside a Controller). */
  children: ReactElement<Record<string, unknown>> | ((props: ControlProps) => ReactElement);
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const props: ControlProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };
  const control =
    typeof children === 'function'
      ? children(props)
      : isValidElement(children)
        ? cloneElement(
            children,
            typeof children.type === 'function'
              ? ({ ...props, invalid: Boolean(error), describedBy: error ? errorId : undefined } as Record<
                  string,
                  unknown
                >)
              : ({ ...props } as Record<string, unknown>),
          )
        : children;
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={id}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      {control}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
