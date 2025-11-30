import type { VnpayIpnParams, VnpayIpnResult } from "@/infrastructure/adapters/external/payment/vnpay-gateway";

export interface VnpayGateway {
  /**
   * Validate VNPay IPN signature
   */
  validateSignature(params: VnpayIpnParams): Promise<boolean>;

  /**
   * Extract order ID from VNPay order info
   */
  extractOrderId(orderInfo: string): number | null;

  /**
   * Parse VNPay IPN response to determine payment result
   */
  parsePaymentResult(params: VnpayIpnParams): VnpayIpnResult;
}
