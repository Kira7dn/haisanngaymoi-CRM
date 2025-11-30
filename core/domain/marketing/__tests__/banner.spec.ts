import { describe, it, expect } from 'vitest';
import type { Banner } from '@/core/domain/banner';

describe('Banner Domain', () => {
  it('should define a valid banner', () => {
    const banner: Banner = {
      id: 1,
      url: 'https://example.com/banner1.jpg',
    };

    expect(banner.id).toBe(1);
    expect(banner.url).toBe('https://example.com/banner1.jpg');
  });

  it('should define multiple banners', () => {
    const banners: Banner[] = [
      { id: 1, url: 'https://example.com/banner1.jpg' },
      { id: 2, url: 'https://example.com/banner2.jpg' },
      { id: 3, url: 'https://example.com/banner3.jpg' },
    ];

    expect(banners).toHaveLength(3);
    expect(banners[0].id).toBe(1);
    expect(banners[1].url).toBe('https://example.com/banner2.jpg');
  });
});
