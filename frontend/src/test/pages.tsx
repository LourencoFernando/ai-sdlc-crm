import type { ReactElement } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { FormsProvider } from '../app/forms';
import { renderApp } from './render';

/** Where the app is now, so tests can check where a link or a delete took them. */
export function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

/** Renders a page at `path` under its route `pattern`, with the record forms and delete dialogs available. */
export function renderPage(page: ReactElement, { pattern, path }: { pattern: string; path: string }) {
  return renderApp(
    <FormsProvider>
      <Routes>
        <Route path={pattern} element={page} />
        <Route path="*" element={<p>Somewhere else</p>} />
      </Routes>
      <CurrentPath />
    </FormsProvider>,
    { path },
  );
}
