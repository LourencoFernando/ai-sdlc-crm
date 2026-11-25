import { useId, useMemo, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { X } from 'lucide-react';

export interface ComboOption {
  value: number;
  label: string;
}

/**
 * A searchable select: type to filter, arrows to move, Enter to choose, Escape to close.
 * `noneLabel` adds a choice for "none" (such as "No organization").
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder,
  noneLabel,
  invalid,
  describedBy,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: {
  id?: string;
  options: ComboOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  noneLabel?: string;
  invalid?: boolean;
  describedBy?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const selected = options.find((o) => o.value === value) ?? null;

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return noneLabel && !q ? [{ value: -1, label: noneLabel }, ...matching] : matching;
  }, [options, query, noneLabel]);

  function choose(option: ComboOption | undefined) {
    if (!option) return;
    onChange(option.value === -1 ? null : option.value);
    setQuery('');
    setOpen(false);
  }

  function openList() {
    setOpen(true);
    const index = choices.findIndex((c) => c.value === (value ?? -1));
    setActive(Math.max(0, index));
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="combo">
          <input
            ref={inputRef}
            id={id}
            className="input"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={invalid || ariaInvalid || undefined}
            aria-describedby={describedBy ?? ariaDescribedBy}
            aria-activedescendant={open && choices[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder={selected ? selected.label : placeholder}
            value={open ? query : (selected?.label ?? '')}
            onFocus={openList}
            onClick={openList}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!open) openList();
                else setActive((a) => Math.min(a + 1, choices.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter' && open) {
                e.preventDefault();
                choose(choices[active]);
              } else if (e.key === 'Escape' && open) {
                e.preventDefault();
                e.stopPropagation();
                setQuery('');
                setOpen(false);
              } else if (e.key === 'Tab') {
                setQuery('');
                setOpen(false);
              }
            }}
          />
          {selected && noneLabel && !open && (
            <button
              type="button"
              className="icon-btn combo-clear"
              aria-label="Clear"
              onClick={() => {
                onChange(null);
                inputRef.current?.focus();
              }}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          className="combo-pop"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (e.target instanceof Node && inputRef.current?.parentElement?.contains(e.target)) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Close the list only, not the dialog around it.
            e.preventDefault();
            setOpen(false);
            inputRef.current?.focus();
          }}
        >
          <ul className="combo-list" id={listId} role="listbox">
            {choices.length === 0 && <li className="combo-empty">No matches</li>}
            {choices.map((option, i) => (
              <li
                key={option.value}
                id={`${listId}-${i}`}
                role="option"
                className="combo-option"
                aria-selected={option.value === (value ?? -1)}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                // Chosen on press, keeping focus in the input; keyboard users choose with Enter there.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
