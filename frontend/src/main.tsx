import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [stages, setStages] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/meta')
      .then((r) => r.json())
      .then((m: { stages: { label: string }[] }) => setStages(m.stages.map((s) => s.label)));
  }, []);
  return <h1>Accountable {stages.join(', ')}</h1>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
