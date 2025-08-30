// import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions:{
    queries:{
      refetchOnWindowFocus:false
    }
  }
});

// 🚩 Important: define context type, but don’t pass actual instance here
const router = createRouter({
  routeTree,
  context: {
    queryClient // 👈 type only, no real value
  },
});

// 👇 Register extends the context type globally
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={router}
          context={{ queryClient }} // 👈 provide real instance here
        />
        
      </QueryClientProvider>
  );
}
