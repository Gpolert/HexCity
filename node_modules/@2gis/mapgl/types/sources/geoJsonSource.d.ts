import { Map } from '../map';
import { SourceAttributes, GeoJsonSourceOptions } from '../types';
import { Feature, FeatureCollection } from 'geojson';
/**
 * Class for creating GeoJSON data source in the map.
 */
export declare class GeoJsonSource {
    private options;
    /**
     * Example:
     * ```js
     * const source = new GeoJsonSource(map, {
     *    data: {
     *        type: 'FeatureCollection',
     *        features: [
     *            {
     *                type: 'Feature',
     *                properties: {},
     *                geometry: {
     *                    type: 'Point',
     *                    coordinates: [82.92186, 55.03029],
     *                },
     *             },
     *        ],
     *    },
     * });
     * ```
     * @param map The map instance
     * @param options Spatial data source options
     */
    constructor(map: Map, options: GeoJsonSourceOptions);
    /**
     * Destroys the source
     */
    destroy(): void;
    /**
     * Sets the source attributes
     */
    setAttributes(attributes: SourceAttributes): this;
    /**
     * Gets the source attributes
     */
    getAttributes(): SourceAttributes;
    /**
     * Sets source data
     */
    setData(data: FeatureCollection | Feature): Promise<void>;
}
