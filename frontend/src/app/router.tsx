import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { NotFound } from './NotFound';
import { Placeholder } from './Placeholder';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Placeholder title="Dashboard" /> },
      { path: '/organizations', element: <Placeholder title="Organizations" /> },
      { path: '/organizations/:id', element: <Placeholder title="Organization" /> },
      { path: '/contacts', element: <Placeholder title="Contacts" /> },
      { path: '/contacts/:id', element: <Placeholder title="Contact" /> },
      { path: '/deals', element: <Placeholder title="Deals" /> },
      { path: '/deals/:id', element: <Placeholder title="Deal" /> },
      { path: '/pipeline', element: <Placeholder title="Pipeline" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
