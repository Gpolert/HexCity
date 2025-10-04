import { Map } from '../map';
import { SourceAttributes, RasterTileSourceOptions } from '../types';
/**
 * Class for creating raster tile source on the map
 */
export declare class RasterTileSource {
    private options;
    /**
     * Example:
     * ```js
     * const source = new RasterTileSource(map, {
     *      url: (x, y, zoom) => `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
     *      attributes: { foo: 'asd' },
     *      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
     * });
     * ```
     * @param map The map instance
     * @param options Spatial data source options
     */
    constructor(map: Map, options: RasterTileSourceOptions);
    /**
     * Destroys the source
     */
    destroy(): void;
    /**
     * Set the source attributes
     */
    setAttributes(attributes: SourceAttributes): this;
    /**
     * Get the source attributes
     */
    getAttributes(): SourceAttributes;
}
