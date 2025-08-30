import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../store/useAuthStore';
import { z } from 'zod';

// Define a schema to validate the search params from the URL
const googleCallbackSearchSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute('/auth/google/callback')({
  // This function validates the URL search params
  validateSearch: (search) => googleCallbackSearchSchema.parse(search),
  component: GoogleCallbackComponent,
});

function GoogleCallbackComponent() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  // Get the validated token from the URL
  const { token } = Route.useSearch();

  React.useEffect(() => {
    if (token) {
      // Store the token in Zustand
      login(token);
      // Redirect to the dashboard
      navigate({ to: '/dashboard', replace: true });
    }
  }, [token, login, navigate]);

  return (
    <div className="p-4 text-center">
      <p>Finalizing your login...</p>
      {/* You can add your loader component here */}
    </div>
  );
}