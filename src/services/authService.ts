import { httpClient, TokenManager, ApiResponse } from './api';

// Authentication related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  organisation_id: number | null;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  first_time_login: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  organisation_id: number;
  first_time_login: number;
  refresh_token: string; // User interface might not need this if refresh tokens are handled separately
}

// Specific response type for GET /api/auth/me
export interface UserValidationResponse {
  user: User;
}

// Specific response type for POST /api/auth/refresh
export interface TokenRefreshApiResponse {
  token: string;
  refreshToken: string;
}


export interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Authentication service class
class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<LoginResponse>('/login', credentials);
      
      if (response.success && response.data) {
        // Store tokens and user data
        TokenManager.setToken(response.data.token);
        TokenManager.setRefreshToken(response.data.refreshToken);
        TokenManager.setFirstTimeLogin(response.data.first_time_login === 1);
        TokenManager.setUser(response.data.user);
        
        console.log('Login successful:', {
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          firstTimeLogin: response.data.first_time_login,
          user: response.data.user
        });
        
        return response.data;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<LoginResponse>('/signup', userData);
      
      if (response.success && response.data) {
        // Store tokens and user data
        TokenManager.setToken(response.data.token);
        TokenManager.setRefreshToken(response.data.refreshToken);
        TokenManager.setFirstTimeLogin(response.data.first_time_login === 1);
        TokenManager.setUser(response.data.user);
        
        return response.data;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await httpClient.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server call fails
    } finally {
      // Clear specific tokens and user data managed by TokenManager
      TokenManager.clearTokens();

      // Clear all other localStorage items for this site
      localStorage.clear();

      // Clear all site cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      // First try to get from local storage
      const localUser = TokenManager.getUser();
      if (localUser) {
        return localUser;
      }

      // If not in local storage, fetch from server
      const response = await httpClient.get<User>('/user');
      
      if (response.success && response.data) {
        TokenManager.setUser(response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get user profile');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Get user's organization information
   */
  async getUserOrganization(): Promise<Organization | null> {
    try {
      const user = this.getStoredUser();
      if (!user || !user.organisation_id) {
        return null;
      }

      const response = await httpClient.get<Organization>(`/organisations/${user.organisation_id}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get user organization error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await httpClient.put<User>('/user/profile', userData);
      
      if (response.success && response.data) {
        TokenManager.setUser(response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    try {
      const response = await httpClient.post('/user/change-password', passwordData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      const response = await httpClient.post('/password/forgot', data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to request password reset');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordReset): Promise<void> {
    try {
      const response = await httpClient.post('/password/reset', data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await httpClient.post('/email/verify', { token });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      const response = await httpClient.post('/email/resend');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Validate current access token and fetch user details.
   * Calls GET /api/auth/me as per prompt.
   */
  async validateTokenAndFetchUser(): Promise<UserValidationResponse> {
    try {
      // The httpClient.get will throw an error for non-ok responses (like 401)
      // The actual response from GET /api/auth/me is { user: { ... } }
      // The httpClient wraps this in its own ApiResponse, so we expect:
      // { success: true, data: { user: { ... } } }
      const response = await httpClient.get<{ user: User }>('/auth/me');
      
      if (response.success && response.data && response.data.user) {
        // Store the fetched user data, as this is the most up-to-date version
        TokenManager.setUser(response.data.user);
        return { user: response.data.user };
      }

      throw new Error(response.message || 'User validation failed or user data missing in response');
    } catch (error) {
      console.error('Validate token and fetch user error:', error);
      throw error; // Re-throw to be handled by AuthContext
    }
  }

  /**
   * Refresh authentication token using the /api/auth/refresh endpoint.
   * Expects { "refresh_token": "value" } in body.
   * Expects { "token": "new_access_token", "refreshToken": "new_refresh_token" } in response.
   */
  async refreshAccessToken(currentRefreshTokenValue: string): Promise<TokenRefreshApiResponse> {
    try {
      console.log(`[authService] refreshAccessToken: Attempting to refresh with refreshToken (first 20 chars): ${currentRefreshTokenValue ? currentRefreshTokenValue.substring(0,20)+'...' : 'null or empty'}`);
      if (!currentRefreshTokenValue) {
        throw new Error('No refresh token provided to refreshAccessToken function.');
      }

      // The httpClient.post will throw an error for non-ok responses
      // The actual response from POST /api/auth/refresh is { token: "...", refreshToken: "..." }
      // The httpClient wraps this, so we expect:
      // { success: true, data: { token: "...", refreshToken: "..." } }
      const response = await httpClient.post<TokenRefreshApiResponse>('/auth/refresh', {
        refresh_token: currentRefreshTokenValue, // Ensure this matches API expectation
      });
      
      if (response.success && response.data && response.data.token && response.data.refreshToken) {
        // Update stored tokens with the new ones
        TokenManager.setToken(response.data.token);
        TokenManager.setRefreshToken(response.data.refreshToken);
        
        // Note: The prompt's /api/auth/refresh endpoint does NOT return user info.
        // The user info currently in TokenManager might be stale if not updated by validateTokenAndFetchUser.
        // AuthContext will need to decide if it needs to re-fetch user info after a successful refresh.
        return response.data; // Returns { token, refreshToken }
      }
      
      throw new Error(response.message || 'Token refresh failed or token data missing in response');
    } catch (error) {
      console.error('Refresh Access Token error:', error);
      // It's crucial that if refresh fails, old tokens (especially refresh token) might be invalidated by the server.
      // AuthContext will call clearTokens() if this fails.
      throw error; // Re-throw to be handled by AuthContext
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return TokenManager.getToken();
  }

  /**
   * Check if this is user's first time login
   */
  isFirstTimeLogin(): boolean {
    return TokenManager.getFirstTimeLogin();
  }

  /**
   * Get current user from local storage
   */
  getStoredUser(): User | null {
    return TokenManager.getUser();
  }

  /**
   * Update stored user data
   */
  updateStoredUser(userData: Partial<User>): void {
    const currentUser = this.getStoredUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      TokenManager.setUser(updatedUser);
    }
  }

  /**
   * Get user display name (fallback to email if name not available)
   */
  getUserDisplayName(): string {
    const user = this.getStoredUser();
    if (!user) return 'User';
    return user.name || user.email || 'User';
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    const user = this.getStoredUser();
    if (!user) return 'U';
    
    if (user.name) {
      return user.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    return user.email.charAt(0).toUpperCase();
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<User> {
    try {
      const response = await httpClient.upload<User>('/user/avatar', file);
      
      if (response.success && response.data) {
        TokenManager.setUser(response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to upload avatar');
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  }
}

// Create and export service instance
export const authService = new AuthService();

// Export for convenience
export default authService;