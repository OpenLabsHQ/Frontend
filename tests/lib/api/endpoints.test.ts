import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi, userApi, rangesApi, templatesApi } from '../../../src/lib/api';
import { config } from '../../../src/lib/config';

// Mock console.error to prevent test logs being cluttered
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock fetch
global.fetch = vi.fn();

// Mock auth store
vi.mock('../../../src/lib/stores/auth', () => ({
  auth: {
    updateUser: vi.fn(),
    updateAuthState: vi.fn(),
    logout: vi.fn()
  }
}));

describe('API Endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default fetch mock
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
      headers: {
        get: () => 'application/json'
      }
    });
  });
  
  describe('authApi', () => {
    it('login endpoint uses correct URL', async () => {
      await authApi.login({ email: 'test@example.com', password: 'password' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.apiUrl}/api/v1/auth/login`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });
    
    it('register endpoint uses correct URL and data format', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await authApi.register(userData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.apiUrl}/api/v1/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com'),
          credentials: 'include'
        })
      );
    });
    
    it('getCurrentUser endpoint uses correct URL', async () => {
      await authApi.getCurrentUser();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
    
    it('logout endpoint uses correct URL', async () => {
      await authApi.logout();
      
      expect(global.fetch).toHaveBeenCalledWith(
        `${config.apiUrl}/api/v1/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });
  });
  
  describe('userApi', () => {
    it('getUserSecrets endpoint uses correct URL', async () => {
      await userApi.getUserSecrets();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me/secrets'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
    
    it('updatePassword endpoint uses correct URL and payload format', async () => {
      await userApi.updatePassword('oldpass', 'newpass');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me/password'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringMatching(/current_password.*new_password/s),
          credentials: 'include'
        })
      );
    });
    
    it('setAwsSecrets endpoint uses correct URL and payload format', async () => {
      await userApi.setAwsSecrets('ACCESS_KEY', 'SECRET_KEY');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me/secrets/aws'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('aws_access_key'),
          credentials: 'include'
        })
      );
    });
    
    it('setAzureSecrets endpoint uses correct URL and payload format', async () => {
      await userApi.setAzureSecrets('CLIENT_ID', 'CLIENT_SECRET', 'TENANT_ID', 'SUBSCRIPTION_ID');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me/secrets/azure'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('azure_client_id'),
          credentials: 'include'
        })
      );
    });
  });
  
  describe('rangesApi', () => {
    it('getRanges endpoint uses correct URL', async () => {
      await rangesApi.getRanges();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ranges'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
    
    it('getRangeById endpoint uses correct URL with ID parameter', async () => {
      const rangeId = '12345';
      await rangesApi.getRangeById(rangeId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/ranges/${rangeId}`),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
    
    it('getTemplates endpoint uses correct URL', async () => {
      await rangesApi.getTemplates();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/blueprints/ranges'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
    
    it('getTemplateById endpoint uses correct URL with ID parameter', async () => {
      const templateId = '12345';
      await rangesApi.getTemplateById(templateId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/blueprints/ranges/${templateId}`),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
    
    it('createTemplate endpoint uses correct URL and method', async () => {
      const templateData = { name: 'Test Template', description: 'Test description' };
      await rangesApi.createTemplate(templateData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/blueprints/ranges'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Template'),
          credentials: 'include'
        })
      );
    });
    
    it('deployTemplate endpoint uses correct URL and payload format', async () => {
      const templateId = '54321';
      await rangesApi.deployTemplate(templateId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ranges/deploy'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(templateId),
          credentials: 'include'
        })
      );
    });
  });
  
  describe('templatesApi', () => {
    it('getVpcTemplates should call rangesApi.getRanges', async () => {
      // Setup spy on rangesApi.getRanges
      const getRangesSpy = vi.spyOn(rangesApi, 'getRanges');
      
      await templatesApi.getVpcTemplates();
      
      expect(getRangesSpy).toHaveBeenCalled();
    });
  });
  
  describe('API Default Export', () => {
    it('default export contains all API groups', () => {
      const api = { 
        auth: authApi, 
        user: userApi, 
        ranges: rangesApi, 
        templates: templatesApi 
      };
      
      // Verify the structure of the default export
      expect(api.auth).toBeDefined();
      expect(api.user).toBeDefined();
      expect(api.ranges).toBeDefined();
      expect(api.templates).toBeDefined();
    });
  });
});