import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { NotFound } from './NotFound';
import { Placeholder } from './Placeholder';
import { OrganizationsPage } from '../features/organizations/OrganizationsPage';
import { OrganizationPage } from '../features/organizations/OrganizationPage';
import { ContactsPage } from '../features/contacts/ContactsPage';
import { ContactPage } from '../features/contacts/ContactPage';
import { DealsPage } from '../features/deals/DealsPage';
import { DealPage } from '../features/deals/DealPage';
import { PipelinePage } from '../features/pipeline/PipelinePage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Placeholder title="Dashboard" /> },
      { path: '/organizations', element: <OrganizationsPage /> },
      { path: '/organizations/:id', element: <OrganizationPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/contacts/:id', element: <ContactPage /> },
      { path: '/deals', element: <DealsPage /> },
      { path: '/deals/:id', element: <DealPage /> },
      { path: '/pipeline', element: <PipelinePage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
