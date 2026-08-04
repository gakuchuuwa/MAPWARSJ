
/**
 * Centralized Z-Index configuration for Map Layers.
 * Leaflet Default Panes:
 * - tilePane: 200
 * - overlayPane: 400 (Polygons, Lines)
 * - shadowPane: 500
 * - markerPane: 600 (Markers)
 * - tooltipPane: 650
 * - popupPane: 700
 */
export const MAP_LAYER_ZINDEX = {
    // Terrain & Base
    GRID_LINES: 300,
    TERRITORY_POLYGON: 350,  // Below standard overlay? Default is 400.

    // 海陆分界调试图层：压在势力色块之上（否则被涂满的地方看不清岸线），
    // 但低于道路/据点/军团，开着也不挡战况
    LAND_SEA_DEBUG: 360,

    // Infrastructure
    CONNECTIONS: 450,        // Above territory, below markers

    // Objects
    CITY_MARKER: 600,        // Default MarkerPane

    // Units Low (Siege Battle - Behind City)
    UNITS_LOW: 580,

    // Units (Custom Pane 'unitsPane')
    // Must be above City Markers (600) but below Tooltips (650) to avoid blocking UI?
    // User wants Units ABOVE Cities.
    UNITS: 620,

    // Effects
    BATTLE_EFFECT: 630,      // Above units

    // Labels
    // City Labels are often implemented as Tooltips or custom markers.
    // If they are markers with offset, they live in markerPane (600) + offset.
    // If we want a strict layer, we should put them in a separate pane.
    CITY_LABEL: 640,

    // UI Highlights
    SELECTION_HIGHLIGHT: 645,

    // High Priority
    // Tooltips are 650
    // Popups are 700
} as const;

export const MAP_PANES = {
    LAND_SEA_DEBUG: 'landSeaDebugPane',
    UNITS: 'unitsPane',
    UNITS_LOW: 'unitsLowPane',
    EFFECTS: 'effectsPane',
    LABELS: 'labelsPane',
    UI: 'uiPane'
} as const;
