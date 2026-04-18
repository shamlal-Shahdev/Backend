import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GeocodeService } from './geocode.service';

@ApiTags('Geocode')
@Controller({ path: 'geocode', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Throttle({ default: { limit: 90, ttl: 60000 } })
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode lat/lon via Nominatim (server proxy)' })
  async reverse(
    @Query('lat') latStr: string,
    @Query('lon') lonStr: string,
  ): Promise<{ displayName: string | null }> {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { displayName: null };
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { displayName: null };
    }
    const displayName = await this.geocodeService.reverse(lat, lon);
    return { displayName };
  }

  @Get('search')
  @ApiOperation({ summary: 'Forward geocode search via Nominatim (server proxy)' })
  async search(
    @Query('q') q: string,
  ): Promise<{
    lat: number | null;
    lon: number | null;
    displayName: string | null;
  }> {
    if (!q?.trim()) {
      return { lat: null, lon: null, displayName: null };
    }
    const hit = await this.geocodeService.search(q);
    if (!hit) {
      return { lat: null, lon: null, displayName: null };
    }
    return {
      lat: hit.lat,
      lon: hit.lon,
      displayName: hit.displayName,
    };
  }
}
