import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService, User as AuthUser, LoginResponse } from '../services/authService'; // Assuming User type is exported from authService
import { TokenManager } from '../services/api'; // For direct token access if needed

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (loginResponseData: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatusOnAppLoad: () => Promise<void>;
  // We might add a specific refresh function here if needed for components,
  // but the core refresh logic will be within checkAuthStatusOnAppLoad or triggered by API errors.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(TokenManager.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true for initial check

  // Function to update state after successful authentication
  const _setAuthenticatedState = (user: AuthUser, newAccessToken: string, newRefreshToken?: string) => {
    TokenManager.setUser(user); // User should be stored by validateToken or login
    TokenManager.setToken(newAccessToken);
    if (newRefreshToken) { // Only set refresh token if a new one is provided
      TokenManager.setRefreshToken(newRefreshToken);
    }
    // first_time_login is part of the User object, so TokenManager.setUser handles it.
    // If it needs separate handling via TokenManager.setFirstTimeLogin, that should occur
    // where loginResponseData is processed (e.g. in the login function).

    console.log('[AuthContext] _setAuthenticatedState: User:', user, 'Token:', newAccessToken, 'RefreshToken:', newRefreshToken);
    setCurrentUser(user);
    setToken(newAccessToken);
    setIsAuthenticated(true);
    setIsLoading(false);
    console.log('Auth state set: User authenticated.');
  };

  const _clearAuthState = async (shouldNotifyServer: boolean = true) => {
    if (shouldNotifyServer) {
      try {
        await authService.logout(); // Notifies server, then authService.logout clears local tokens.
      } catch (e) {
        console.error("Error during server logout, clearing local tokens anyway.", e)
        TokenManager.clearTokens(); // Ensure local cleanup if server call fails
      }
    } else {
        TokenManager.clearTokens(); // Just clear local tokens
    }
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    console.log('Auth state cleared: User unauthenticated.');
  };

  const login = async (loginResponseData: LoginResponse) => {
    setIsLoading(true);
    // This function is called with the direct response from a login attempt.
    // It sets up the application state based on that successful login.
    console.log('[AuthContext] login: Received loginResponseData:', loginResponseData);
    if (!loginResponseData || !loginResponseData.token || !loginResponseData.refreshToken) {
      console.error('[AuthContext] login: Invalid loginResponseData received.', loginResponseData);
      setIsLoading(false);
      return;
    }
    TokenManager.setToken(loginResponseData.token);
    TokenManager.setRefreshToken(loginResponseData.refreshToken);
    TokenManager.setUser(loginResponseData.user); // User object from login
    TokenManager.setFirstTimeLogin(loginResponseData.first_time_login === 1); // Explicitly set first_time_login
    console.log(`[AuthContext] login: Stored token: ${loginResponseData.token.substring(0, 20)}...`);
    console.log(`[AuthContext] login: Stored refreshToken: ${loginResponseData.refreshToken.substring(0, 20)}...`);

    _setAuthenticatedState(loginResponseData.user, loginResponseData.token, loginResponseData.refreshToken);
  };

  const logout = async () => {
    setIsLoading(true);
    await _clearAuthState(true); // true to notify server
  };

  const checkAuthStatusOnAppLoad = async () => {
    console.log('[AuthContext] checkAuthStatusOnAppLoad: Starting...');
    setIsLoading(true);
    const currentAccessToken = TokenManager.getToken();
    console.log(`[AuthContext] checkAuthStatusOnAppLoad: Retrieved access token from TokenManager: ${currentAccessToken ? currentAccessToken.substring(0,20)+'...' : 'null'}`);

    if (!currentAccessToken) {
      console.log('[AuthContext] checkAuthStatusOnAppLoad: No access token found locally.');
      await _clearAuthState(false); // No server call needed, just clear local state
      return;
    }

    try {
      console.log('Validating access token...');
      // authService.validateTokenAndFetchUser calls GET /api/auth/me
      // It also updates TokenManager.setUser() with the fresh user data.
      const validationResponse = await authService.validateTokenAndFetchUser();
      // The currentAccessToken is still valid. No new refresh token from this step.
      _setAuthenticatedState(validationResponse.user, currentAccessToken);
      console.log('Access token validated successfully.');
    } catch (validationError: any) {
      console.warn('Access token validation failed:', validationError.message);
      // Check if the error is a 401, otherwise it might be a network error etc.
      // The modified HttpClient should throw an error with a status property for 401s.
      if (validationError.status === 401) { // Assuming error has a status property
        console.log('[AuthContext] checkAuthStatusOnAppLoad: Access token validation returned 401. Attempting token refresh...');
        const currentRefreshToken = TokenManager.getRefreshToken();
        console.log(`[AuthContext] checkAuthStatusOnAppLoad: Retrieved refresh token from TokenManager: ${currentRefreshToken ? currentRefreshToken.substring(0,20)+'...' : 'null'}`);
        if (currentRefreshToken) {
          try {
            // authService.refreshAccessToken calls POST /api/auth/refresh
            // It updates TokenManager with new access and refresh tokens.
            const refreshApiResponse = await authService.refreshAccessToken(currentRefreshToken);
            console.log('Token refresh successful. Re-validating new token to fetch user...');
            // After successful refresh, we get new tokens. Validate the new access token to get user.
            // authService.validateTokenAndFetchUser will use the NEW token set by refreshAccessToken.
            const postRefreshValidationResponse = await authService.validateTokenAndFetchUser();
            _setAuthenticatedState(postRefreshValidationResponse.user, TokenManager.getToken()!, TokenManager.getRefreshToken()!);
            console.log('Post-refresh validation successful.');
          } catch (refreshOrPostRefreshError) {
            console.error('Token refresh or subsequent validation failed:', refreshOrPostRefreshError);
            await _clearAuthState(true); // Clear all, including notifying server as tokens are now definitively bad.
          }
        } else {
          console.log('No refresh token available to attempt refresh.');
          await _clearAuthState(true); // No refresh token, so session is lost. Notify server.
        }
      } else {
        // Not a 401, could be network error. Don't clear tokens yet, allow for retry perhaps.
        // Or, if this is on app load, treat as unauthenticated for now.
        console.error("Non-401 error during token validation:", validationError);
        await _clearAuthState(false); // Clear local state, server state unknown.
      }
    }
  };

  useEffect(() => {
    // checkAuthStatusOnAppLoad(); // This will be called from App.tsx to control its timing relative to other setups.
    // For now, let's ensure isLoading is false if no token exists from the start.
    if (!token) {
        setIsLoading(false);
    }
  }, []); // Ran once on mount

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        token,
        isLoading,
        login,
        logout,
        checkAuthStatusOnAppLoad,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
