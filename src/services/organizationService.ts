import { httpClient, ApiResponse, PaginatedResponse, apiUtils } from './api';
import { authService } from './authService';

// Organization related types
export interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrganizationData {
  name: string;
  email: string;
  address?: string;
  phone?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
}

export interface OrganizationFilters {
  search?: string;
  name?: string;
  email?: string;
}

export interface AddUserByEmailData {
  email: string;
}

export interface AddUserByEmailResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    organisation_id: number;
    first_time_login: number;
    refresh_token: string | null;
  };
}

// Organization service class
class OrganizationService {
  /**
   * Get all organizations with pagination and filters
   */
  async getOrganizations(
    page: number = 1,
    limit: number = 20,
    filters?: OrganizationFilters
  ): Promise<PaginatedResponse<Organization>> {
    try {
      const params = apiUtils.createPaginationParams(page, limit, filters?.search);
      
      // Add filter parameters
      if (filters) {
        if (filters.name) params.name = filters.name;
        if (filters.email) params.email = filters.email;
      }

      const response = await httpClient.get<Organization[]>('/organisations', apiUtils.formatParams(params));
      
      if (response.success) {
        return response as PaginatedResponse<Organization>;
      }
      
      throw new Error(response.message || 'Failed to fetch organizations');
    } catch (error) {
      console.error('Get organizations error:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: number): Promise<Organization> {
    try {
      const response = await httpClient.get<Organization>(`/organisations/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch organization');
    } catch (error) {
      console.error('Get organization error:', error);
      throw error;
    }
  }

  /**
   * Create new organization and automatically join the user to it
   */
  async createOrganization(organizationData: CreateOrganizationData): Promise<Organization> {
    try {
      console.log('Creating organization with data:', organizationData);
      const response = await httpClient.post<Organization>('/organisations', organizationData);
      
      if (response.success && response.data) {
        console.log('Organization created successfully:', response.data);
        
        // After creating the organization, assign the current user to it
        await this.assignUserToOrganization(response.data.id);
        
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create organization');
    } catch (error) {
      console.error('Create organization error:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(id: number, organizationData: UpdateOrganizationData): Promise<Organization> {
    try {
      console.log('Updating organization', id, 'with data:', organizationData);
      
      // Prepare the payload with the ID included as per your API
      const payload = {
        id,
        ...organizationData,
      };
      
      const response = await httpClient.put<Organization>(`/organisations/${id}`, payload);
      
      if (response.success && response.data) {
        console.log('Organization updated successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update organization');
    } catch (error) {
      console.error('Update organization error:', error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: number): Promise<void> {
    try {
      console.log('Deleting organization:', id);
      const response = await httpClient.delete(`/organisations/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete organization');
      }
      
      console.log('Organization deleted successfully');
    } catch (error) {
      console.error('Delete organization error:', error);
      throw error;
    }
  }

  /**
   * Add user to organization by email
   */
  async addUserByEmail(organizationId: number, email: string): Promise<AddUserByEmailResponse> {
    try {
      console.log('Adding user by email to organization', organizationId, ':', email);
      
      const payload: AddUserByEmailData = { email };
      const response = await httpClient.post<AddUserByEmailResponse>(
        `/organisations/${organizationId}/add-user-by-email`, 
        payload
      );
      
      if (response.success && response.data) {
        console.log('User added to organization successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to add user to organization');
    } catch (error) {
      console.error('Add user by email error:', error);
      
      // Handle specific validation errors
      if (error?.response?.status === 422) {
        const errorMessage = error.response.data?.message || 'Validation failed';
        const validationErrors = error.response.data?.errors;
        
        if (validationErrors) {
          // Handle field-specific validation errors
          const errorList = Object.values(validationErrors).flat();
          throw new Error(errorList.join(', '));
        }
        
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  /**
   * Assign current user to an organization using the assign-organisation endpoint
   */
  async assignUserToOrganization(organizationId: number): Promise<void> {
    try {
      const currentUser = authService.getStoredUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('Assigning user', currentUser.id, 'to organization', organizationId);
      
      // Use the assign-organisation endpoint
      const assignData = {
        organisation_id: organizationId,
      };

      const response = await httpClient.put(`/users/${currentUser.id}/assign-organisation`, assignData);
      
      if (response.success && response.data) {
        // Update the stored user data
        authService.updateStoredUser(response.data);
        console.log('Successfully assigned user to organization');
      } else {
        throw new Error(response.message || 'Failed to assign user to organization');
      }
    } catch (error) {
      console.error('Assign user to organization error:', error);
      throw error;
    }
  }

  /**
   * Join an organization by updating the current user's organisation_id
   * @deprecated Use assignUserToOrganization instead
   */
  async joinOrganization(organizationId: number): Promise<void> {
    return this.assignUserToOrganization(organizationId);
  }

  /**
   * Search organizations
   */
  async searchOrganizations(query: string, limit: number = 10): Promise<Organization[]> {
    try {
      const response = await httpClient.get<Organization[]>('/organisations/search', {
        q: query,
        limit: limit.toString(),
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to search organizations');
    } catch (error) {
      console.error('Search organizations error:', error);
      throw error;
    }
  }

  /**
   * Get current user's organization
   */
  async getCurrentUserOrganization(): Promise<Organization | null> {
    try {
      const currentUser = authService.getStoredUser();
      if (!currentUser || !currentUser.organisation_id) {
        return null;
      }

      const response = await httpClient.get<Organization>(`/organisations/${currentUser.organisation_id}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user organization error:', error);
      return null;
    }
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(id: number): Promise<any[]> {
    try {
      const response = await httpClient.get<any[]>(`/organisations/${id}/members`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Get organization members error:', error);
      return [];
    }
  }

  /**
   * Invite user to organization
   */
  async inviteUserToOrganization(id: number, email: string, role: string = 'member'): Promise<void> {
    try {
      const response = await httpClient.post(`/organisations/${id}/invite`, { email, role });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Invite user error:', error);
      throw error;
    }
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(id: number, userId: number): Promise<void> {
    try {
      const response = await httpClient.delete(`/organisations/${id}/members/${userId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Remove user error:', error);
      throw error;
    }
  }

  /**
   * Update user role in organization
   */
  async updateUserRole(id: number, userId: number, role: string): Promise<void> {
    try {
      const response = await httpClient.put(`/organisations/${id}/members/${userId}`, { role });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }
}

// Create and export service instance
export const organizationService = new OrganizationService();

// Export for convenience
export default organizationService;