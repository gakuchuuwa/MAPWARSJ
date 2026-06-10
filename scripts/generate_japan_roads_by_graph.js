import fs from 'fs';
import path from 'path';

// Load Cities Coordinates
const CITIES_COORDS = {
  city_kyoto: [135.77, 35.01],
  city_nara: [135.85, 34.55],
  city_kamakura: [139.54, 35.31],
  city_edo: [139.85, 35.75],
  city_dazaifu: [130.52, 33.51],
  city_hiraizumi: [141.11, 38.98],
  city_izumo: [132.75, 35.36],
  city_satsuma: [130.55, 31.59],
  city_shinotachi: [140.84, 41.82],
  city_tsushima: [129.30, 34.30],
  city_okou: [133.64, 33.58],
  city_yoshida: [132.71, 34.67],
  city_kasugayama: [138.20, 37.15],
  city_kofu: [138.57, 35.67],
  city_kiyosu: [136.84, 35.22]
};

// 14 Japanese roads to generate
const JAPAN_ROADS = [
  {
    name: "奈良街道",
    id: "road_nara_kaido",
    type: "road",
    start: "city_kyoto",
    end: "city_nara",
    waypoints: [
      [135.78, 34.93],
      [135.80, 34.78],
      [135.82, 34.65]
    ]
  },
  {
    name: "東海道（西）",
    id: "road_tokaido_west",
    type: "road",
    start: "city_kyoto",
    end: "city_kiyosu",
    waypoints: [
      [135.87, 35.00],
      [136.17, 35.02],
      [136.50, 34.97],
      [136.70, 35.05],
      [136.82, 35.13]
    ]
  },
  {
    name: "東海道（東）",
    id: "road_tokaido_east",
    type: "road",
    start: "city_kiyosu",
    end: "city_kamakura",
    waypoints: [
      [137.39, 34.77],
      [137.73, 34.71],
      [138.39, 34.97],
      [139.10, 35.23],
      [139.35, 35.31]
    ]
  },
  {
    name: "鎌倉街道",
    id: "road_kamakura_kaido",
    type: "road",
    start: "city_kamakura",
    end: "city_edo",
    waypoints: [
      [139.62, 35.34],
      [139.69, 35.45],
      [139.74, 35.63]
    ]
  },
  {
    name: "甲州街道",
    id: "road_koshu_kaido",
    type: "road",
    start: "city_edo",
    end: "city_kofu",
    waypoints: [
      [139.34, 35.66],
      [139.17, 35.63],
      [138.94, 35.61],
      [138.81, 35.62],
      [138.68, 35.65]
    ]
  },
  {
    name: "奥州街道",
    id: "road_oshu_kaido",
    type: "road",
    start: "city_edo",
    end: "city_hiraizumi",
    waypoints: [
      [139.88, 35.91],
      [139.88, 36.56],
      [140.21, 37.05],
      [140.88, 38.27],
      [141.15, 39.70]
    ]
  },
  {
    name: "蝦夷渡航路",
    id: "road_ezo_route",
    type: "path",
    start: "city_hiraizumi",
    end: "city_shinotachi",
    waypoints: [
      [140.75, 40.82],
      [140.35, 41.05],
      [140.30, 41.25],
      [140.55, 41.53],
      [140.73, 41.72]
    ]
  },
  {
    name: "北陸道",
    id: "road_hokurikudo",
    type: "road",
    start: "city_kyoto",
    end: "city_kasugayama",
    waypoints: [
      [136.27, 35.32],
      [136.06, 35.65],
      [136.63, 36.57],
      [137.21, 36.70],
      [137.87, 37.05]
    ]
  },
  {
    name: "山陽道",
    id: "road_sanyodo",
    type: "road",
    start: "city_kyoto",
    end: "city_yoshida",
    waypoints: [
      [135.50, 34.85],
      [134.69, 34.83],
      [133.93, 34.66],
      [133.35, 34.49],
      [132.76, 34.48]
    ]
  },
  {
    name: "山陽道（延長）",
    id: "road_sanyodo_ext",
    type: "road",
    start: "city_yoshida",
    end: "city_dazaifu",
    waypoints: [
      [132.46, 34.39],
      [131.47, 34.18],
      [130.94, 33.96],
      [130.88, 33.88],
      [130.68, 33.63]
    ]
  },
  {
    name: "山陰道",
    id: "road_sanindo",
    type: "path",
    start: "city_kyoto",
    end: "city_izumo",
    waypoints: [
      [135.50, 35.02],
      [134.85, 35.30],
      [134.23, 35.50],
      [133.33, 35.43],
      [132.90, 35.40]
    ]
  },
  {
    name: "西海道",
    id: "road_saikaido",
    type: "road",
    start: "city_dazaifu",
    end: "city_satsuma",
    waypoints: [
      [130.55, 33.32],
      [130.71, 32.80],
      [130.72, 32.35],
      [130.56, 31.91],
      [130.55, 31.73]
    ]
  },
  {
    name: "南海道",
    id: "road_nankaido",
    type: "path",
    start: "city_yoshida",
    end: "city_okou",
    waypoints: [
      [132.46, 34.39],
      [132.50, 34.15],
      [132.77, 33.84],
      [133.20, 33.72],
      [133.53, 33.56]
    ]
  },
  {
    name: "壱岐対馬航路",
    id: "road_iki_tsushima_route",
    type: "path",
    start: "city_dazaifu",
    end: "city_tsushima",
    waypoints: [
      [130.40, 33.60],
      [130.20, 33.55],
      [129.88, 33.75],
      [129.50, 34.10]
    ]
  }
];

// Utility: Haversine distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const lonDiff = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(lonDiff / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Utility: Path Length
function calculatePathLength(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  return total;
}

// Graph Builder Variables
const geoNodes = [];
const geoAdj = new Map();

// Snap keys
const SNAP_TOLERANCE = 0.05;
function snapKey(lat, lng) {
  const rLat = Math.round(lat / SNAP_TOLERANCE) * SNAP_TOLERANCE;
  const rLng = Math.round(lng / SNAP_TOLERANCE) * SNAP_TOLERANCE;
  return `${rLat.toFixed(3)}_${rLng.toFixed(3)}`;
}

const nodeMap = new Map();
function getOrCreateNode(lat, lng) {
  const key = snapKey(lat, lng);
  if (nodeMap.has(key)) return nodeMap.get(key);

  const id = geoNodes.length;
  geoNodes.push({ id, lat, lng });
  geoAdj.set(id, []);
  nodeMap.set(key, id);
  return id;
}

function addEdge(fromId, toId, coords, weightDiscount = 1.0) {
  if (fromId === toId) return;
  const weight = calculatePathLength(coords) * weightDiscount;
  if (!isFinite(weight) || weight < 0.01) return;

  const edge = { from: fromId, to: toId, weight, coords };
  geoAdj.get(fromId).push(edge);

  const rev = {
    from: toId, to: fromId, weight,
    coords: [...coords].reverse()
  };
  geoAdj.get(toId).push(rev);
}

// Build Graph from GeoJSON
console.log('📖 Loading GeoJSON road graph...');
const geojsonPath = 'public/assets/roads_filtered.geojson';
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

console.log('🏗️ Building graph...');
const processLineString = (coords) => {
  if (coords.length < 2) return;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    const fromId = getOrCreateNode(lat1, lng1);
    const toId = getOrCreateNode(lat2, lng2);
    addEdge(fromId, toId, [coords[i], coords[i + 1]]);
  }
};

const features = geojson.features || [];
for (const feature of features) {
  const geom = feature.geometry;
  if (geom?.type === 'LineString') {
    processLineString(geom.coordinates);
  } else if (geom?.type === 'MultiLineString') {
    for (const line of geom.coordinates) processLineString(line);
  }
}

// Add bridge edges
function addBridgeEdges(tolerance) {
  const grid = new Map();
  for (const node of geoNodes) {
    const cx = Math.floor(node.lng / tolerance);
    const cy = Math.floor(node.lat / tolerance);
    const key = `${cx}_${cy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(node.id);
  }

  let bridgeCount = 0;
  for (const node of geoNodes) {
    const adj = geoAdj.get(node.id);
    const connectedTo = new Set(adj?.map(e => e.to) || []);

    const cx = Math.floor(node.lng / tolerance);
    const cy = Math.floor(node.lat / tolerance);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighbors = grid.get(`${cx + dx}_${cy + dy}`);
        if (!neighbors) continue;

        for (const otherId of neighbors) {
          if (otherId === node.id || connectedTo.has(otherId)) continue;

          const other = geoNodes[otherId];
          const dLat = node.lat - other.lat;
          const dLng = (node.lng - other.lng) * Math.cos(node.lat * Math.PI / 180);
          const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);

          if (distDeg < tolerance) {
            const distKm = haversine(node.lat, node.lng, other.lat, other.lng);
            const weight = distKm * 1.5;
            if (!isFinite(weight) || weight < 0.01) continue;

            const coords = [
              [node.lng, node.lat], [other.lng, other.lat]
            ];

            const edge = { from: node.id, to: otherId, weight, coords };
            geoAdj.get(node.id).push(edge);

            const rev = {
              from: otherId, to: node.id, weight,
              coords: [[other.lng, other.lat], [node.lng, node.lat]]
            };
            geoAdj.get(otherId).push(rev);

            connectedTo.add(otherId);
            bridgeCount++;
          }
        }
      }
    }
  }
  console.log(`🔗 [GraphBuilder] Added ${bridgeCount} bridge edges`);
}

addBridgeEdges(0.03);
console.log(`🛣️ Graph built with ${geoNodes.length} nodes.`);

// Dijkstra Algorithm
function dijkstraGeo(startId, endId) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const heap = [];

  const heapPush = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].dist <= heap[i].dist) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };

  const heapPop = () => {
    if (heap.length === 0) return undefined;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1, right = 2 * i + 2;
        if (left < heap.length && heap[left].dist < heap[smallest].dist) smallest = left;
        if (right < heap.length && heap[right].dist < heap[smallest].dist) smallest = right;
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top;
  };

  dist.set(startId, 0);
  heapPush({ nodeId: startId, dist: 0 });

  while (heap.length > 0) {
    const item = heapPop();
    const current = item.nodeId;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endId) break;

    const edges = geoAdj.get(current) || [];
    for (const edge of edges) {
      if (visited.has(edge.to)) continue;
      const newDist = (dist.get(current) ?? Infinity) + edge.weight;
      if (newDist < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, { nodeId: current, edge });
        heapPush({ nodeId: edge.to, dist: newDist });
      }
    }
  }

  if (!prev.has(endId)) return null;

  const edgeList = [];
  let current = endId;
  while (prev.has(current)) {
    const { nodeId: prevNode, edge } = prev.get(current);
    edgeList.unshift(edge);
    current = prevNode;
  }

  const coordinates = [];
  for (let i = 0; i < edgeList.length; i++) {
    const edgeCoords = edgeList[i].coords;
    const startIdx = i === 0 ? 0 : 1;
    for (let j = startIdx; j < edgeCoords.length; j++) {
      coordinates.push(edgeCoords[j]);
    }
  }

  return { coordinates, totalDistance: dist.get(endId) || 0 };
}

// BFS Component Explorer for Bridging
function getAllReachableNodes(startId) {
  const dists = new Map();
  const pq = [];

  dists.set(startId, { dist: 0, prev: -1 });
  pq.push({ id: startId, dist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: d } = pq.shift();

    if (d > (dists.get(u)?.dist ?? Infinity)) continue;

    const adj = geoAdj.get(u) || [];
    for (const edge of adj) {
      const v = edge.to;
      const newDist = d + edge.weight;
      if (newDist < (dists.get(v)?.dist ?? Infinity)) {
        dists.set(v, { dist: newDist, prev: u });
        pq.push({ id: v, dist: newDist });
      }
    }
  }
  return dists;
}

function reconstructPath(map, startId, endId) {
  const path = [];
  let curr = endId;
  while (curr !== -1 && curr !== startId) {
    path.push([geoNodes[curr].lng, geoNodes[curr].lat]);
    curr = map.get(curr)?.prev ?? -1;
  }
  path.push([geoNodes[startId].lng, geoNodes[startId].lat]);
  return path.reverse();
}

function findSmartBridgedPath(startId, endId) {
  const startReachable = getAllReachableNodes(startId);
  const endReachable = getAllReachableNodes(endId);

  if (startReachable.size === 0 || endReachable.size === 0) return null;

  const cellSize = 0.1;
  const grid = new Map();

  for (const nodeId of endReachable.keys()) {
    const node = geoNodes[nodeId];
    const key = `${Math.floor(node.lat / cellSize)}_${Math.floor(node.lng / cellSize)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(nodeId);
  }

  let bestPair = null;
  let minTotalPenalty = Infinity;

  for (const [uId, uInfo] of startReachable) {
    const uNode = geoNodes[uId];
    const cx = Math.floor(uNode.lat / cellSize);
    const cy = Math.floor(uNode.lng / cellSize);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const key = `${cx + dx}_${cy + dy}`;
        const targetNodes = grid.get(key);
        if (!targetNodes) continue;

        for (const vId of targetNodes) {
          const vNode = geoNodes[vId];

          const dLat = uNode.lat - vNode.lat;
          const dLng = (uNode.lng - vNode.lng) * Math.cos(uNode.lat * Math.PI / 180);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111;

          const vInfo = endReachable.get(vId);
          const totalPenalty = uInfo.dist + (dist * 1.2) + vInfo.dist;

          if (totalPenalty < minTotalPenalty) {
            minTotalPenalty = totalPenalty;
            bestPair = { u: uId, v: vId, dist };
          }
        }
      }
    }
  }

  if (!bestPair) return null;

  const pathStart = reconstructPath(startReachable, startId, bestPair.u);
  const pathEnd = reconstructPath(endReachable, endId, bestPair.v).reverse();

  const coords = [];
  pathStart.forEach(c => coords.push(c));
  pathEnd.forEach(c => coords.push(c));

  return {
    coordinates: coords,
    totalDistance: minTotalPenalty,
    bridgeDist: bestPair.dist
  };
}

// Find K Nearest Geo Nodes
function findKNearestGeoNodes(lat, lng, k) {
  const candidates = [];
  for (const node of geoNodes) {
    const dLat = node.lat - lat;
    const dLng = (node.lng - lng) * Math.cos(lat * Math.PI / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    candidates.push({ id: node.id, dist });
  }
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, k);
}

// Fallback straight line
function generateStraightLinePath(lat1, lng1, lat2, lng2) {
  const dist = haversine(lat1, lng1, lat2, lng2);
  const numSegments = Math.max(2, Math.ceil(dist / 50));
  const coords = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    coords.push([lng, lat]);
  }
  return coords;
}

// pointToLineDist & simplifyCoords
function pointToLineDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2);

  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  return Math.sqrt((p[0] - projX) ** 2 + (p[1] - projY) ** 2);
}

function simplifyCoords(coords, tolerance) {
  if (coords.length <= 2) return coords;

  let maxDist = 0;
  let maxIdx = 0;
  const start = coords[0];
  const end = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const dist = pointToLineDist(coords[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyCoords(coords.slice(0, maxIdx + 1), tolerance);
    const right = simplifyCoords(coords.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

// Remove Backtracks
function removeBacktracks(points, maxAngleDeg = 100) {
  if (points.length < 3) return points;

  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (len1 < 1e-10 || len2 < 1e-10) continue;

    const dot = dx1 * dx2 + dy1 * dy2;
    const cosAngle = dot / (len1 * len2);

    const maxAngleRad = maxAngleDeg * Math.PI / 180;
    const cosThreshold = Math.cos(maxAngleRad);

    if (cosAngle < cosThreshold) {
      continue;
    }
    result.push(curr);
  }
  result.push(points[points.length - 1]);
  return result;
}

// Route single segment
function routeSegment(startLngLat, endLngLat) {
  const startCandidates = findKNearestGeoNodes(startLngLat[1], startLngLat[0], 5);
  const endCandidates = findKNearestGeoNodes(endLngLat[1], endLngLat[0], 5);

  let bestPath = null;
  let bestDist = Infinity;

  for (const sc of startCandidates) {
    for (const ec of endCandidates) {
      const path = dijkstraGeo(sc.id, ec.id);
      if (!path) continue;
      if (path.totalDistance < bestDist) {
        bestPath = path;
        bestDist = path.totalDistance;
      }
    }
  }

  if (bestPath) {
    // Return standard path
    return [startLngLat, ...bestPath.coordinates, endLngLat];
  }

  // Try smart bridge
  console.log(`🌉 Trying smart bridge between [${startLngLat}] and [${endLngLat}]...`);
  const bridged = findSmartBridgedPath(startCandidates[0].id, endCandidates[0].id);
  if (bridged) {
    return [startLngLat, ...bridged.coordinates, endLngLat];
  }

  // Fallback straight line
  console.log(`🚧 Bridge failed. Fallback to straight line for [${startLngLat}] to [${endLngLat}]`);
  const straight = generateStraightLinePath(startLngLat[1], startLngLat[0], endLngLat[1], endLngLat[0]);
  return straight;
}

// Main Generation Loop
const generatedRoadFeatures = [];

for (const road of JAPAN_ROADS) {
  console.log(`\n🚗 Routing Road: ${road.name} (${road.start} -> ${road.end})`);
  const startCoord = CITIES_COORDS[road.start];
  const endCoord = CITIES_COORDS[road.end];
  
  if (!startCoord || !endCoord) {
    console.error(`❌ Coordinates missing for ${road.start} or ${road.end}`);
    continue;
  }

  // Build the list of stops along the way
  const stops = [startCoord, ...road.waypoints, endCoord];
  let fullCoords = [];

  // Route stop by stop
  for (let i = 0; i < stops.length - 1; i++) {
    const segmentCoords = routeSegment(stops[i], stops[i + 1]);
    
    // Add to full coords, avoiding duplicating the joint point
    if (fullCoords.length === 0) {
      fullCoords.push(...segmentCoords);
    } else {
      fullCoords.push(...segmentCoords.slice(1));
    }
  }

  // Clean consecutive duplicates
  const cleanedCoords = [];
  if (fullCoords.length > 0) cleanedCoords.push(fullCoords[0]);
  for (let i = 1; i < fullCoords.length; i++) {
    const last = cleanedCoords[cleanedCoords.length - 1];
    const curr = fullCoords[i];
    if (Math.abs(last[0] - curr[0]) > 1e-6 || Math.abs(last[1] - curr[1]) > 1e-6) {
      cleanedCoords.push(curr);
    }
  }

  // Simplify coords (tolerance ~200m)
  const simplified = simplifyCoords(cleanedCoords, 0.002);

  // Remove sharp backtracks
  const finalCoords = removeBacktracks(simplified, 80);

  // Ensure first and last coordinates exactly match cities coordinates up to 4 decimal places
  finalCoords[0] = [Number(startCoord[0].toFixed(4)), Number(startCoord[1].toFixed(4))];
  finalCoords[finalCoords.length - 1] = [Number(endCoord[0].toFixed(4)), Number(endCoord[1].toFixed(4))];

  console.log(`✅ Completed ${road.name}: ${finalCoords.length} points, length: ${calculatePathLength(finalCoords).toFixed(1)} km`);

  generatedRoadFeatures.push({
    type: "Feature",
    properties: {
      name: road.name,
      type: road.type,
      id: road.id,
      startConnection: road.start,
      endConnection: road.end
    },
    geometry: {
      type: "LineString",
      coordinates: finalCoords
    }
  });
}

// Let's load the Chinese "上党-阏与" road from the existing file to preserve it perfectly
console.log('\n🏺 Loading existing VectorRoadData.ts to preserve Chinese road...');
const currentDataPath = 'src/data/VectorRoadData.ts';
const currentData = fs.readFileSync(currentDataPath, 'utf8');

// Parse the Chinese road from the current file
// We can use a regex or custom parser to isolate the first feature in features array
const shangdangStartIdx = currentData.indexOf('name: "上党-阏与"');
// Let's just find the feature block for 上党-阏与
const shangdangMatch = currentData.match(/\{\s*type:\s*"Feature",\s*properties:\s*\{\s*name:\s*"上党-阏与"[^}]+\},\s*geometry:\s*\{\s*type:\s*"LineString",\s*coordinates:\s*\[[^\]]+\]\s*\}\s*\}/s);

let shangdangFeatureStr = '';
if (shangdangMatch) {
  shangdangFeatureStr = shangdangMatch[0];
  console.log('✅ Found and preserved the "上党-阏与" Chinese road!');
} else {
  // Let's try searching with single quotes too
  const shangdangMatch2 = currentData.match(/\{\s*type:\s*'Feature',\s*properties:\s*\{\s*name:\s*'上党-阏与'[^}]+\},\s*geometry:\s*\{\s*type:\s*'LineString',\s*coordinates:\s*\[[^\]]+\]\s*\}\s*\}/s);
  if (shangdangMatch2) {
    shangdangFeatureStr = shangdangMatch2[0];
    console.log('✅ Found and preserved the "上党-阏与" Chinese road (single quotes)!');
  } else {
    // Hardcode fallback for "上党-阏与" if it cannot be parsed (but we saw it's there!)
    console.error('❌ Could not parse the Chinese road from existing file! Using hardcoded fallback.');
    shangdangFeatureStr = `{
            type: "Feature",
            properties: {
                name: "上党-阏与",
                type: "road",
                id: "road_city_shangdang_city_eyu_1771384588059",
                startConnection: "city_shangdang",
                endConnection: "city_heshun"
            },
            geometry: {
                type: "LineString",
                coordinates: [
                    [112.8711, 36.1264],
                    [112.880408, 36.115971],
                    [113.0867385864258, 36.18250209066106],
                    [113.131997, 36.219082],
                    [113.197988, 36.318068],
                    [113.214486, 36.334565],
                    [113.251606, 36.33869],
                    [113.296974, 36.355188],
                    [113.321721, 36.384058],
                    [113.32997, 36.404681],
                    [113.317596, 36.454174],
                    [113.325845, 36.470671],
                    [113.350592, 36.474796],
                    [113.379463, 36.503667],
                    [113.457827, 36.528413],
                    [113.4788, 36.5416]
                ]
            }
        }`;
  }
}

// Build the new VectorRoadData.ts content
const newContent = `export interface VectorRoadFeature {
    type: 'Feature';
    properties: {
        name: string;
        type: 'plank' | 'path' | 'road';
        color?: string;
        id: string;
        startYear?: number;
        endYear?: number;
        startConnection?: string;
        endConnection?: string;
    };
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}

export const VECTOR_ROAD_DATA: { type: 'FeatureCollection', features: VectorRoadFeature[] } = {
    type: 'FeatureCollection',
    features: [
        ${shangdangFeatureStr},
        ${generatedRoadFeatures.map(f => JSON.stringify(f, null, 8)).join(',\n        ')}
    ]
};
`;

fs.writeFileSync(currentDataPath, newContent, 'utf8');
console.log('\n🎉 Successfully updated src/data/VectorRoadData.ts with authentic Dijkstra-routed roads!');
