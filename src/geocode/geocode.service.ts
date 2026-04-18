import { Injectable, Logger } from '@nestjs/common';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const MAX_LOCATION_LEN = 500;

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  private nominatimHeaders(): Record<string, string> {
    const userAgent =
      process.env.NOMINATIM_USER_AGENT ||
      'WattsUp-Energy/1.0 (contact via app support)';
    return {
      'User-Agent': userAgent,
      'Accept-Language': 'en',
      Accept: 'application/json',
    };
  }

  private emailQuery(): string {
    const email = process.env.NOMINATIM_EMAIL?.trim();
    return email ? `&email=${encodeURIComponent(email)}` : '';
  }

  async reverse(lat: number, lon: number): Promise<string | null> {
    const url = `${NOMINATIM}/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}${this.emailQuery()}`;
    try {
      const res = await fetch(url, { headers: this.nominatimHeaders() });
      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(`Nominatim reverse HTTP ${res.status}: ${text.slice(0, 300)}`);
        return null;
      }
      const data = JSON.parse(text) as { display_name?: string; error?: string };
      if (data.error) return null;
      const name = data.display_name;
      return name ? name.slice(0, MAX_LOCATION_LEN) : null;
    } catch (e) {
      this.logger.warn(`Nominatim reverse error: ${e}`);
      return null;
    }
  }

  async search(
    query: string,
  ): Promise<{ lat: number; lon: number; displayName: string } | null> {
    const q = query.trim();
    if (q.length < 2) return null;
    const url = `${NOMINATIM}/search?format=json&q=${encodeURIComponent(q)}&limit=1${this.emailQuery()}`;
    try {
      const res = await fetch(url, { headers: this.nominatimHeaders() });
      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(`Nominatim search HTTP ${res.status}: ${text.slice(0, 300)}`);
        return null;
      }
      const arr = JSON.parse(text) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const hit = arr[0];
      return {
        lat: parseFloat(hit.lat),
        lon: parseFloat(hit.lon),
        displayName: hit.display_name.slice(0, MAX_LOCATION_LEN),
      };
    } catch (e) {
      this.logger.warn(`Nominatim search error: ${e}`);
      return null;
    }
  }
}
