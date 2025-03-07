import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rangesApi } from '../../../src/lib/api';
import { goto } from '$app/navigation';
import { auth } from '../../../src/lib/stores/auth';

// Mock dependencies
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('../../../src/lib/api', () => ({
  rangesApi: {
    getTemplateById: vi.fn(),
    deployTemplate: vi.fn()
  }
}));

vi.mock('../../../src/lib/stores/auth', () => {
  const authStore = {
    subscribe: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    updateUser: vi.fn(),
    updateAuthState: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false
  };
  
  return {
    auth: {
      ...authStore,
      subscribe: (cb) => {
        cb(authStore);
        return () => {};
      }
    }
  };
});

describe('Template Detail Page', () => {
  const templateId = 'template-123';
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Default to authenticated user
    auth.isAuthenticated = true;
  });
  
  describe('Page load and data fetching', () => {
    it('loads template data correctly when API call succeeds', async () => {
      // Mock successful API response
      rangesApi.getTemplateById.mockResolvedValueOnce({
        data: {
          id: templateId,
          name: 'Test Template',
          description: 'A test template',
          vpc: {
            cidr_block: '10.0.0.0/16'
          },
          subnets: [
            { name: 'public', cidr_block: '10.0.1.0/24' },
            { name: 'private', cidr_block: '10.0.2.0/24' }
          ],
          hosts: [
            { name: 'web-server', subnet: 'public' }
          ]
        }
      });
      
      // Simulate the page load function (from +page.ts)
      const load = ({ params }) => {
        return {
          templateId: params.id
        };
      };
      
      // Get the template ID from the load function
      const pageData = load({ params: { id: templateId } });
      expect(pageData.templateId).toBe(templateId);
      
      // Simulate the component's template loading logic
      let template = null;
      let isLoading = true;
      let error = '';
      
      try {
        const result = await rangesApi.getTemplateById(pageData.templateId);
        isLoading = false;
        
        if (result.error) {
          error = result.error;
        } else if (result.data) {
          template = result.data;
        }
      } catch (err) {
        isLoading = false;
        error = 'An unexpected error occurred';
      }
      
      // Verify template loaded correctly
      expect(isLoading).toBe(false);
      expect(error).toBe('');
      expect(template).not.toBeNull();
      expect(template.id).toBe(templateId);
      expect(template.vpc).toBeDefined();
      expect(template.subnets).toHaveLength(2);
      expect(template.hosts).toHaveLength(1);
    });
    
    it('handles API error when template is not found', async () => {
      // Mock 404 API response
      rangesApi.getTemplateById.mockResolvedValueOnce({
        error: 'The requested information could not be found.',
        status: 404
      });
      
      // Simulate the component's template loading logic
      let template = null;
      let isLoading = true;
      let error = '';
      
      try {
        const result = await rangesApi.getTemplateById(templateId);
        isLoading = false;
        
        if (result.error) {
          error = result.error;
        } else if (result.data) {
          template = result.data;
        }
      } catch (err) {
        isLoading = false;
        error = 'An unexpected error occurred';
      }
      
      // Verify error handling
      expect(isLoading).toBe(false);
      expect(error).toBe('The requested information could not be found.');
      expect(template).toBeNull();
    });
  });
  
  describe('Template deployment', () => {
    it('deploys template successfully', async () => {
      // Mock successful deployment
      rangesApi.deployTemplate.mockResolvedValueOnce({
        data: {
          id: 'deployment-123',
          status: 'pending'
        }
      });
      
      // Simulate deployment function
      let deploymentResult = null;
      let deploymentError = '';
      let isDeploying = true;
      
      try {
        const result = await rangesApi.deployTemplate(templateId);
        isDeploying = false;
        
        if (result.error) {
          deploymentError = result.error;
        } else if (result.data) {
          deploymentResult = result.data;
          // After successful deployment, would navigate to ranges page
          goto('/ranges');
        }
      } catch (err) {
        isDeploying = false;
        deploymentError = 'Failed to deploy template';
      }
      
      // Verify deployment was successful
      expect(isDeploying).toBe(false);
      expect(deploymentError).toBe('');
      expect(deploymentResult).not.toBeNull();
      expect(deploymentResult.id).toBe('deployment-123');
      expect(goto).toHaveBeenCalledWith('/ranges');
    });
    
    it('handles API error during deployment', async () => {
      // Mock error during deployment
      rangesApi.deployTemplate.mockResolvedValueOnce({
        error: 'Failed to deploy template. API server error.',
        status: 500
      });
      
      // Simulate deployment function
      let deploymentResult = null;
      let deploymentError = '';
      let isDeploying = true;
      
      try {
        const result = await rangesApi.deployTemplate(templateId);
        isDeploying = false;
        
        if (result.error) {
          deploymentError = result.error;
        } else if (result.data) {
          deploymentResult = result.data;
          goto('/ranges');
        }
      } catch (err) {
        isDeploying = false;
        deploymentError = 'Failed to deploy template';
      }
      
      // Verify error handling
      expect(isDeploying).toBe(false);
      expect(deploymentError).toBe('Failed to deploy template. API server error.');
      expect(deploymentResult).toBeNull();
      expect(goto).not.toHaveBeenCalled();
    });
  });
});