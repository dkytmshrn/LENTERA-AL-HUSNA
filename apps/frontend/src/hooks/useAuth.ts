import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticatedClient } from '@/lib/api';

/**
 * Hook for pages that require authentication (e.g., dashboard)
 * Redirects to login if no token found
 */
export function useProtectedRoute() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticated = isAuthenticatedClient();

    if (!authenticated) {
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook for auth pages (login, register, forgot-password)
 * Redirects to dashboard if already authenticated
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const authenticated = isAuthenticatedClient();

    if (authenticated) {
      router.replace('/dashboard');
    } else {
      setIsReady(true);
    }
  }, [router]);

  return isReady;
}

/**
 * Hook to check if user has valid session
 * Returns user data if authenticated
 */
export function useAuth() {
  const isAuthenticated = isAuthenticatedClient();
  return {
    isAuthenticated,
    accessToken: isAuthenticated ? 'cookie-authenticated' : null,
  };
}
