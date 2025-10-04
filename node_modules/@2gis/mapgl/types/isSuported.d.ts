import { MapSupportOptions } from './types';
/**
 * Tests whether the current browser supports MapGL. Use our
 * raster map implementation https://api.2gis.ru/doc/maps/en/quickstart/
 * if not.
 *
 * @param options MapSupportOptions
 */
export declare function isSupported(options?: MapSupportOptions): boolean;
/**
 * Tests whether the current browser supports MapGL and returns the reason in a string
 *
 * @param options MapSupportOptions
 */
export declare function notSupportedReason(options?: MapSupportOptions): string | undefined;
