export interface DecodePhoneRequest {
  token: string;
  accessToken: string;
}

export interface DecodePhoneResponse {
  phone: string;
}

export class DecodePhoneUseCase {
  async execute(request: DecodePhoneRequest): Promise<DecodePhoneResponse> {
    // Call Zalo API logic
    // Placeholder
    return { phone: "" };
  }
}
