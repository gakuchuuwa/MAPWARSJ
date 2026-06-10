"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cities_v2_1 = require("../src/data/cities_v2");
var RegionSystem_1 = require("../src/systems/RegionSystem");
var counts = {};
cities_v2_1.CITIES_V2.forEach(function (c) {
    var r = (0, RegionSystem_1.getCityRegion)({ latitude: c.lat, longitude: c.lng, region: c.region });
    counts[r] = (counts[r] || 0) + 1;
});
console.log(JSON.stringify(counts, null, 2));
