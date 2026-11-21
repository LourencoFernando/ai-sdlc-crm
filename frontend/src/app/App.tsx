import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Tooltip } from 'radix-ui';
import { createQueryClient } from './query-client';
import { ToastProvider } from './toasts';
import { router } from './router';

export function App() {
  const [client] = useState(createQueryClient);
  return (
    <QueryClientProvider client={client}>
      <Tooltip.Provider delayDuration={300}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}
