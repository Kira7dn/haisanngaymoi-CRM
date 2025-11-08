export interface DecodeLocationRequest {
  token: string;
  accessToken: string;
}

export interface DecodeLocationResponse {
  location: { lat: number; lng: number };
  address: string | null;
}

export class DecodeLocationUseCase {
  async execute(request: DecodeLocationRequest): Promise<DecodeLocationResponse> {
    // Call Zalo API logic
    // Then reverse geocode
    // Placeholder
    return {
      location: { lat: 0, lng: 0 },
      address: null,
    };
  }
}
