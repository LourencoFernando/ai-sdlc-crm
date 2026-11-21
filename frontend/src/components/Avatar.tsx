import { initials } from '../lib/format';

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span className={`avatar ${large ? 'avatar-lg' : ''}`} aria-hidden="true" title={name}>
      {initials(name)}
    </span>
  );
}
