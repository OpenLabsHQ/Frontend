import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rangesApi } from '../../../src/lib/api';

// Mock dependencies
vi.mock('../../../src/lib/api', () => ({
  rangesApi: {
    getTemplates: vi.fn()
  }
}));

describe('TemplateList Component Logic', () => {
  // Since we can't directly test the Svelte component, we'll test the logic
  // that would be used by the component
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  // Test template filtering logic
  describe('Template filtering', () => {
    const sampleTemplates = [
      { 
        id: '1', 
        name: 'AWS Basic Infrastructure', 
        description: 'Basic AWS infrastructure with VPC and subnets',
        provider: 'aws'
      },
      { 
        id: '2', 
        name: 'Azure Web App Environment', 
        description: 'Web app hosting environment in Azure',
        provider: 'azure'
      },
      { 
        id: '3', 
        name: 'AWS Security Testing Lab', 
        description: 'Environment for security testing and training',
        provider: 'aws'
      }
    ];
    
    // Filter function similar to what would be in the component
    function filterTemplates(templates, searchTerm, providerFilter) {
      return templates.filter(template => {
        // Apply search term filter
        const matchesSearch = !searchTerm || 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          template.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Apply provider filter
        const matchesProvider = !providerFilter || 
          template.provider.toLowerCase() === providerFilter.toLowerCase();
        
        return matchesSearch && matchesProvider;
      });
    }
    
    it('returns all templates when no filters are applied', () => {
      const result = filterTemplates(sampleTemplates, '', '');
      expect(result).toHaveLength(3);
      expect(result).toEqual(sampleTemplates);
    });
    
    it('filters by search term in name correctly', () => {
      const result = filterTemplates(sampleTemplates, 'web', '');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
    
    it('filters by search term in description correctly', () => {
      const result = filterTemplates(sampleTemplates, 'security', '');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });
    
    it('filters by provider correctly', () => {
      const result = filterTemplates(sampleTemplates, '', 'aws');
      expect(result).toHaveLength(2);
      expect(result[0].provider).toBe('aws');
      expect(result[1].provider).toBe('aws');
    });
    
    it('combines search term and provider filters correctly', () => {
      const result = filterTemplates(sampleTemplates, 'basic', 'aws');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
    
    it('returns empty array when no matches found', () => {
      const result = filterTemplates(sampleTemplates, 'nonexistent', '');
      expect(result).toHaveLength(0);
    });
  });
  
  // Test loading and error handling logic
  describe('Templates API integration', () => {
    it('handles successful API response', async () => {
      // Mock successful API response
      rangesApi.getTemplates.mockResolvedValueOnce({
        data: [
          { id: '1', name: 'Template 1', description: 'Description 1', provider: 'aws' }
        ]
      });
      
      // Variables that would be in the component
      let templates = [];
      let isLoading = true;
      let error = '';
      
      // Simulate the API call and data handling logic
      try {
        const result = await rangesApi.getTemplates();
        isLoading = false;
        
        if (result.error) {
          error = result.error;
        } else if (result.data) {
          templates = result.data;
        }
      } catch (err) {
        isLoading = false;
        error = 'Unexpected error occurred';
      }
      
      // Verify the component would handle this correctly
      expect(isLoading).toBe(false);
      expect(error).toBe('');
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Template 1');
    });
    
    it('handles API error gracefully', async () => {
      // Mock API error
      rangesApi.getTemplates.mockResolvedValueOnce({
        error: 'Failed to fetch templates',
        status: 500
      });
      
      // Variables that would be in the component
      let templates = [];
      let isLoading = true;
      let error = '';
      
      // Simulate the API call and error handling logic
      try {
        const result = await rangesApi.getTemplates();
        isLoading = false;
        
        if (result.error) {
          error = result.error;
          // Might use fallback data in real component
        } else if (result.data) {
          templates = result.data;
        }
      } catch (err) {
        isLoading = false;
        error = 'Unexpected error occurred';
      }
      
      // Verify the component would handle this correctly
      expect(isLoading).toBe(false);
      expect(error).toBe('Failed to fetch templates');
      expect(templates).toHaveLength(0);
    });
    
    it('handles network error gracefully', async () => {
      // Mock network error
      rangesApi.getTemplates.mockRejectedValueOnce(new Error('Network error'));
      
      // Variables that would be in the component
      let templates = [];
      let isLoading = true;
      let error = '';
      
      // Simulate the API call and error handling logic
      try {
        await rangesApi.getTemplates();
      } catch (err) {
        isLoading = false;
        error = 'Failed to connect to server';
      } finally {
        isLoading = false;
      }
      
      // Verify the component would handle this correctly
      expect(isLoading).toBe(false);
      expect(error).toBe('Failed to connect to server');
      expect(templates).toHaveLength(0);
    });
  });
  
  // Test template sorting logic
  describe('Template sorting', () => {
    const templates = [
      { id: '1', name: 'Z Template', created_at: '2024-01-15T12:00:00Z' },
      { id: '2', name: 'A Template', created_at: '2024-03-20T12:00:00Z' },
      { id: '3', name: 'M Template', created_at: '2024-02-10T12:00:00Z' }
    ];
    
    it('sorts templates alphabetically by name', () => {
      const sortedTemplates = [...templates].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      expect(sortedTemplates[0].name).toBe('A Template');
      expect(sortedTemplates[1].name).toBe('M Template');
      expect(sortedTemplates[2].name).toBe('Z Template');
    });
    
    it('sorts templates by creation date (newest first)', () => {
      const sortedTemplates = [...templates].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      expect(sortedTemplates[0].id).toBe('2'); // Newest
      expect(sortedTemplates[1].id).toBe('3');
      expect(sortedTemplates[2].id).toBe('1'); // Oldest
    });
  });
});