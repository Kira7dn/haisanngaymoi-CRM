import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notifyOrderWebhook } from '../webhook'
import type { Order } from '@/core/domain/order'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  // Reset environment
  delete process.env.EXTERNAL_WEBHOOK_URL
})

afterEach(() => {
  vi.clearAllMocks()
  delete process.env.EXTERNAL_WEBHOOK_URL
})

describe('Webhook Notification', () => {
  const mockOrder: Order = {
    id: 123, // number
    customerId: 'user-123',
    status: 'completed',
    items: [],
    delivery: {
      address: '123 Test St',
      name: 'Test User',
      phone: '123456789',
      location: { lat: 21.0278, lon: 105.8342 }
    },
    total: 100000,
    note: 'Test order',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('Basic notification (no external webhook)', () => {
    it('should log successful payment notification', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await notifyOrderWebhook(mockOrder)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[notifyOrderWebhook] Payment processed successfully',
        expect.objectContaining({
          orderId: 123, // number
          status: 'completed',
        })
      )

      consoleLogSpy.mockRestore()
    })

    it('should not make external requests when webhook URL not configured', async () => {
      await notifyOrderWebhook(mockOrder)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('External webhook notification', () => {
    beforeEach(() => {
      process.env.EXTERNAL_WEBHOOK_URL = 'https://external-webhook.example.com/webhook'
    })

    it('should send successful webhook to external URL', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockResponse = {
        ok: true,
        status: 200,
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      await notifyOrderWebhook(mockOrder)

      expect(mockFetch).toHaveBeenCalledWith('https://external-webhook.example.com/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"type":"payment_success"'),
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[notifyOrderWebhook] External webhook sent successfully',
        { orderId: 123 }
      )

      consoleLogSpy.mockRestore()
    })

    it('should handle external webhook failure with response body', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: vi.fn().mockResolvedValue('Invalid webhook data'),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      await notifyOrderWebhook(mockOrder)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[notifyOrderWebhook] External webhook failed',
        expect.objectContaining({
          status: 400,
          statusText: 'Bad Request',
          body: 'Invalid webhook data',
          orderId: 123,
        })
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle external webhook failure without response body', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockRejectedValue(new Error('Cannot read response')),
      } as any

      mockFetch.mockResolvedValueOnce(mockResponse)

      await notifyOrderWebhook(mockOrder)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[notifyOrderWebhook] External webhook failed',
        expect.objectContaining({
          status: 500,
          statusText: 'Internal Server Error',
          body: undefined,
          orderId: 123,
        })
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle network errors when sending external webhook', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      await notifyOrderWebhook(mockOrder)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[notifyOrderWebhook] Error sending external webhook',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Network timeout',
          }),
          orderId: 123,
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Environment variable handling', () => {
    it('should handle empty EXTERNAL_WEBHOOK_URL', async () => {
      process.env.EXTERNAL_WEBHOOK_URL = ''

      await notifyOrderWebhook(mockOrder)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle whitespace-only EXTERNAL_WEBHOOK_URL', async () => {
      process.env.EXTERNAL_WEBHOOK_URL = '   '

      await notifyOrderWebhook(mockOrder)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
