import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiGet } from '../api-client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('API Client', () => {
  describe('apiGet', () => {
    it('should make GET request with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      const result = await apiGet<{ data: string }>('/api/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        cache: 'no-store',
        method: 'GET',
      })

      expect(result).toEqual({ data: 'test' })
    })

    it('should merge additional request options', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      const init = { headers: { 'X-Test': 'value' } }
      await apiGet('/api/test', init)

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        cache: 'no-store',
        method: 'GET',
        headers: { 'X-Test': 'value' },
      })
    })

    it('should throw error for non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Not Found'),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      await expect(apiGet('/api/test')).rejects.toThrow('Request failed 404: Not Found')
    })

    it('should handle response text error gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockRejectedValue(new Error('Text read failed')),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      await expect(apiGet('/api/test')).rejects.toThrow('Request failed 500: <no-body>')
    })

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      await expect(apiGet('/api/test')).rejects.toThrow('Invalid JSON')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      await expect(apiGet('/api/test')).rejects.toThrow('Network failure')
    })
  })
})
