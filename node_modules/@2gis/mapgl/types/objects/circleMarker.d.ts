import { Map } from '../map';
import { CircleMarkerOptions } from '../types';
import { Evented } from '../utils/evented';
import { DynamicObjectEventTable } from '../types/events';
/**
 * Class for creating a circleMarker on the map
 *
 * The CircleMarker differs from the Circle in that it has radius in pixels so its instance displays the same on any zoom level
 */
export declare class CircleMarker extends Evented<DynamicObjectEventTable<CircleMarker>> {
    /**
     * User specific data. Empty by default
     */
    userData: any;
    private options;
    /**
     * Example:
     * ```js
     * const circleMarker = new mapgl.CircleMarker(map, {
     *     coordinates: map.getCenter(),
     *     radius: 500,
     * });
     * ```
     * @param map The map instance
     * @param options CircleMarker options
     */
    constructor(map: Map, options: CircleMarkerOptions);
    /**
     * Destroys the circleMarker
     */
    destroy(): void;
    private _emitPointerEvent;
}
