import { describe, it, expect } from 'vitest';
import type { Station, Location } from '@/core/domain/station';

describe('Station Domain', () => {
  it('should define a valid location', () => {
    const location: Location = {
      lat: 20.9927,
      lng: 107.7645,
    };

    expect(location.lat).toBe(20.9927);
    expect(location.lng).toBe(107.7645);
  });

  it('should define a valid station with required fields', () => {
    const station: Station = {
      id: 1,
      name: 'Cô Tô Central Station',
      address: '123 Harbor Road, Cô Tô Island',
      location: {
        lat: 20.9927,
        lng: 107.7645,
      },
    };

    expect(station.id).toBe(1);
    expect(station.name).toBe('Cô Tô Central Station');
    expect(station.address).toBe('123 Harbor Road, Cô Tô Island');
    expect(station.location.lat).toBe(20.9927);
    expect(station.location.lng).toBe(107.7645);
  });

  it('should define a station with all optional fields', () => {
    const station: Station = {
      id: 2,
      name: 'North Station',
      address: '456 North Beach',
      location: {
        lat: 21.0285,
        lng: 105.8542,
      },
      image: 'https://example.com/north-station.jpg',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };

    expect(station.image).toBe('https://example.com/north-station.jpg');
    expect(station.createdAt).toBeInstanceOf(Date);
    expect(station.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow station without optional image field', () => {
    const station: Station = {
      id: 3,
      name: 'South Station',
      address: '789 South Beach',
      location: {
        lat: 20.5,
        lng: 107.0,
      },
    };

    expect(station.image).toBeUndefined();
    expect(station.createdAt).toBeUndefined();
    expect(station.updatedAt).toBeUndefined();
  });
});
