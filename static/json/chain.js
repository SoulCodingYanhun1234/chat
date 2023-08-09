{
    "Box3EventChannel": `declare type Box3EventChannel<EventType> = (handler: (event: EventType) => void) => Box3EventHandlerToken;`,
        "Box3TickEvent": `declare class Box3TickEvent {
/**
 * Tick at which the event was fired
 */
tick: number;
/**
 * Last tick which was handled
 */
prevTick: number;
/**
 * If we had to skip any ticks due to the scripts lagging
 */
skip: boolean;
/**
 * Wall clock time between ticks
 */
elapsedTimeMS: number;
}`
}