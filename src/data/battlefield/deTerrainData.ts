/**
 * 🔴 自动生成文件 · 勿手改
 * 来源：由 scratch/de_terrain_manifest.json 与 scratch/de_terrain_blend.json 静态导出
 * 生成命令：用于 M3 战术模式 WebGL 地面层静态数据导入（避免运行时异步网络请求 scratch/ 目录）
 */

export interface DeTerrainManifestItem {
    terrain_id: number;
    name: string;
    name_2?: string;
    is_water?: number;
    overlay_mask_name?: string;
    blend_priority?: number;
    [key: string]: any;
}

export const DE_TERRAIN_MANIFEST: Record<number, DeTerrainManifestItem> = {
  "0": {
    "terrain_id": 0,
    "name_2": "g_grs",
    "name": "Grass",
    "string_id": 10621,
    "blend_priority": 111,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "1": {
    "terrain_id": 1,
    "name_2": "g_wtr",
    "name": "Water, Shallow",
    "string_id": 10624,
    "blend_priority": 166,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 4,
    "colors": [
      19,
      19,
      19
    ]
  },
  "2": {
    "terrain_id": 2,
    "name_2": "g_bch",
    "name": "Beach",
    "string_id": 10647,
    "blend_priority": 131,
    "blend_type": 2,
    "overlay_mask_name": "beach_soft.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "3": {
    "terrain_id": 3,
    "name_2": "g_ds3",
    "name": "Dirt 3",
    "string_id": 10622,
    "blend_priority": 86,
    "blend_type": 0,
    "overlay_mask_name": "dirt.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "4": {
    "terrain_id": 4,
    "name_2": "g_sha",
    "name": "Shallows",
    "string_id": 10627,
    "blend_priority": 139,
    "blend_type": 4,
    "overlay_mask_name": "neutral_33.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "5": {
    "terrain_id": 5,
    "name_2": "g_for",
    "name": "Underbrush",
    "string_id": 10650,
    "blend_priority": 2,
    "blend_type": 0,
    "overlay_mask_name": "leaves.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "6": {
    "terrain_id": 6,
    "name_2": "g_des",
    "name": "Dirt",
    "string_id": 10648,
    "blend_priority": 83,
    "blend_type": 0,
    "overlay_mask_name": "dirt.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "7": {
    "terrain_id": 7,
    "name_2": "g_fm1",
    "name": "Farm1",
    "string_id": 5149,
    "blend_priority": 186,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      160,
      159,
      158
    ]
  },
  "8": {
    "terrain_id": 8,
    "name_2": "g_fm2",
    "name": "Farm2",
    "string_id": 4711,
    "blend_priority": 188,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      160,
      159,
      158
    ]
  },
  "9": {
    "terrain_id": 9,
    "name_2": "g_gr3",
    "name": "Grass 3",
    "string_id": 4712,
    "blend_priority": 120,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "10": {
    "terrain_id": 10,
    "name_2": "g_for",
    "name": "Forest",
    "string_id": 10623,
    "blend_priority": 96,
    "blend_type": 0,
    "overlay_mask_name": "leaves.png",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "11": {
    "terrain_id": 11,
    "name_2": "g_ds2",
    "name": "Dirt 2",
    "string_id": 4713,
    "blend_priority": 85,
    "blend_type": 0,
    "overlay_mask_name": "dirt.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "12": {
    "terrain_id": 12,
    "name_2": "g_gr2",
    "name": "Grass 2",
    "string_id": 4714,
    "blend_priority": 119,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "13": {
    "terrain_id": 13,
    "name_2": "g_pal",
    "name": "Palm Desert",
    "string_id": 10625,
    "blend_priority": 93,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "14": {
    "terrain_id": 14,
    "name_2": "g_pal",
    "name": "Desert",
    "string_id": 4715,
    "blend_priority": 89,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "15": {
    "terrain_id": 15,
    "name_2": "g_wtr",
    "name": "Water, Old",
    "string_id": 4716,
    "blend_priority": 177,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 1,
    "colors": [
      19,
      19,
      19
    ]
  },
  "16": {
    "terrain_id": 16,
    "name_2": "g_grs",
    "name": "Old Grass",
    "string_id": 4717,
    "blend_priority": 123,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "17": {
    "terrain_id": 17,
    "name_2": "g_for",
    "name": "Jungle",
    "string_id": 10664,
    "blend_priority": 107,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "18": {
    "terrain_id": 18,
    "name_2": "g_for",
    "name": "Bamboo",
    "string_id": 10649,
    "blend_priority": 98,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "19": {
    "terrain_id": 19,
    "name_2": "g_for",
    "name": "Pine Forest",
    "string_id": 10628,
    "blend_priority": 108,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "20": {
    "terrain_id": 20,
    "name_2": "g_for",
    "name": "Forest, Oak Bush",
    "string_id": 10626,
    "blend_priority": 101,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "21": {
    "terrain_id": 21,
    "name_2": "g_snf",
    "name": "Snow Forest",
    "string_id": 10665,
    "blend_priority": 162,
    "blend_type": 7,
    "overlay_mask_name": "",
    "is_water": 160,
    "colors": [
      197,
      235,
      53
    ]
  },
  "22": {
    "terrain_id": 22,
    "name_2": "g_wt2",
    "name": "Water, Deep",
    "string_id": 10629,
    "blend_priority": 176,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 2,
    "colors": [
      1,
      1,
      1
    ]
  },
  "23": {
    "terrain_id": 23,
    "name_2": "g_wt3",
    "name": "Water, Medium",
    "string_id": 10644,
    "blend_priority": 178,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 1,
    "colors": [
      3,
      3,
      3
    ]
  },
  "24": {
    "terrain_id": 24,
    "name_2": "g_rd1",
    "name": "Road",
    "string_id": 10645,
    "blend_priority": 146,
    "blend_type": 5,
    "overlay_mask_name": "road.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "25": {
    "terrain_id": 25,
    "name_2": "g_rd2",
    "name": "Road, Broken",
    "string_id": 10646,
    "blend_priority": 147,
    "blend_type": 5,
    "overlay_mask_name": "road_broken.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "26": {
    "terrain_id": 26,
    "name_2": "g_ic2",
    "name": "Ice Navigable",
    "string_id": 10651,
    "blend_priority": 71,
    "blend_type": 6,
    "overlay_mask_name": "ice.png",
    "is_water": 72,
    "colors": [
      240,
      240,
      240
    ]
  },
  "27": {
    "terrain_id": 27,
    "name_2": "g_ds2",
    "name": "Foundation",
    "string_id": 4718,
    "blend_priority": 141,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "28": {
    "terrain_id": 28,
    "name_2": "g_wtr",
    "name": "Water, Bridge",
    "string_id": 4719,
    "blend_priority": 175,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 32,
    "colors": [
      19,
      19,
      19
    ]
  },
  "29": {
    "terrain_id": 29,
    "name_2": "g_fc1",
    "name": "Farm Cnst1",
    "string_id": 4720,
    "blend_priority": 180,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      160,
      159,
      158
    ]
  },
  "30": {
    "terrain_id": 30,
    "name_2": "g_fc2",
    "name": "Farm Cnst2",
    "string_id": 4721,
    "blend_priority": 182,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      160,
      159,
      158
    ]
  },
  "31": {
    "terrain_id": 31,
    "name_2": "g_fc3",
    "name": "Farm Cnst3",
    "string_id": 4722,
    "blend_priority": 184,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      160,
      159,
      158
    ]
  },
  "32": {
    "terrain_id": 32,
    "name_2": "g_sno",
    "name": "Snow",
    "string_id": 10666,
    "blend_priority": 153,
    "blend_type": 7,
    "overlay_mask_name": "snow.png",
    "is_water": 160,
    "colors": [
      55,
      236,
      54
    ]
  },
  "33": {
    "terrain_id": 33,
    "name_2": "o_snd",
    "name": "                    OBSOLETE (Snow Dirt)",
    "string_id": 10668,
    "blend_priority": 155,
    "blend_type": 7,
    "overlay_mask_name": "snow.png",
    "is_water": 0,
    "colors": [
      176,
      107,
      120
    ]
  },
  "34": {
    "terrain_id": 34,
    "name_2": "o_sng",
    "name": "                    OBSOLETE (Snow Grass)",
    "string_id": 10667,
    "blend_priority": 158,
    "blend_type": 7,
    "overlay_mask_name": "snow.png",
    "is_water": 0,
    "colors": [
      55,
      236,
      54
    ]
  },
  "35": {
    "terrain_id": 35,
    "name_2": "g_ice",
    "name": "Ice",
    "string_id": 4723,
    "blend_priority": 72,
    "blend_type": 6,
    "overlay_mask_name": "ice.png",
    "is_water": 96,
    "colors": [
      240,
      240,
      240
    ]
  },
  "36": {
    "terrain_id": 36,
    "name_2": "g_snd",
    "name": "Snow Foundat",
    "string_id": 4724,
    "blend_priority": 164,
    "blend_type": 7,
    "overlay_mask_name": "snow.png",
    "is_water": 160,
    "colors": [
      176,
      107,
      120
    ]
  },
  "37": {
    "terrain_id": 37,
    "name_2": "g_ice_beach",
    "name": "Ice, Beach",
    "string_id": 4725,
    "blend_priority": 75,
    "blend_type": 6,
    "overlay_mask_name": "ice.png",
    "is_water": 80,
    "colors": [
      240,
      240,
      240
    ]
  },
  "38": {
    "terrain_id": 38,
    "name_2": "o_sr1",
    "name": "                    OBSOLETE (Road, Snow)",
    "string_id": 10677,
    "blend_priority": 195,
    "blend_type": 5,
    "overlay_mask_name": "road.png",
    "is_water": 0,
    "colors": [
      176,
      107,
      120
    ]
  },
  "39": {
    "terrain_id": 39,
    "name_2": "o_sr2",
    "name": "                    OBSOLETE (Road, Fungus)",
    "string_id": 10678,
    "blend_priority": 196,
    "blend_type": 5,
    "overlay_mask_name": "road_broken.png",
    "is_water": 0,
    "colors": [
      176,
      107,
      192
    ]
  },
  "40": {
    "terrain_id": 40,
    "name_2": "g_rck",
    "name": "Rock 1",
    "string_id": 21212,
    "blend_priority": 151,
    "blend_type": 5,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "41": {
    "terrain_id": 41,
    "name_2": "g_gr5",
    "name": "Savannah",
    "string_id": 4727,
    "blend_priority": 128,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "42": {
    "terrain_id": 42,
    "name_2": "g_ds4",
    "name": "Dirt 4",
    "string_id": 4728,
    "blend_priority": 87,
    "blend_type": 0,
    "overlay_mask_name": "dirt.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "43": {
    "terrain_id": 43,
    "name_2": "o_rd3",
    "name": "                    OBSOLETE (Road, Desert)",
    "string_id": 4729,
    "blend_priority": 150,
    "blend_type": 5,
    "overlay_mask_name": "road.png",
    "is_water": 0,
    "colors": [
      176,
      107,
      120
    ]
  },
  "44": {
    "terrain_id": 44,
    "name_2": "o_gr4",
    "name": "                    OBSOLETE (Moorland)",
    "string_id": 4730,
    "blend_priority": 121,
    "blend_type": 0,
    "overlay_mask_name": "dirt.png",
    "is_water": 0,
    "colors": [
      55,
      236,
      54
    ]
  },
  "45": {
    "terrain_id": 45,
    "name_2": "g_pal1",
    "name": "Desert, Cracked",
    "string_id": 4731,
    "blend_priority": 88,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "46": {
    "terrain_id": 46,
    "name_2": "g_qs",
    "name": "Desert, Quicksand",
    "string_id": 4732,
    "blend_priority": 81,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "47": {
    "terrain_id": 47,
    "name_2": "g_bla",
    "name": "Black",
    "string_id": 4733,
    "blend_priority": 198,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      128,
      128,
      128
    ]
  },
  "48": {
    "terrain_id": 48,
    "name_2": "g_des",
    "name": "Dragon Forest",
    "string_id": 4734,
    "blend_priority": 106,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "49": {
    "terrain_id": 49,
    "name_2": "g_ds4",
    "name": "Baobab Forest",
    "string_id": 4735,
    "blend_priority": 105,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "50": {
    "terrain_id": 50,
    "name_2": "g_gr5",
    "name": "Acacia Forest",
    "string_id": 4736,
    "blend_priority": 110,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "51": {
    "terrain_id": 51,
    "name_2": "g_bc4",
    "name": "Beach, White Vegetation",
    "string_id": 4737,
    "blend_priority": 126,
    "blend_type": 2,
    "overlay_mask_name": "beach.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "52": {
    "terrain_id": 52,
    "name_2": "g_bc2",
    "name": "Beach, Vegetation",
    "string_id": 4738,
    "blend_priority": 130,
    "blend_type": 2,
    "overlay_mask_name": "beach.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "53": {
    "terrain_id": 53,
    "name_2": "g_bc3",
    "name": "Beach, White",
    "string_id": 4739,
    "blend_priority": 129,
    "blend_type": 2,
    "overlay_mask_name": "beach.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "54": {
    "terrain_id": 54,
    "name_2": "g_sh3",
    "name": "Mangrove Shallows",
    "string_id": 4740,
    "blend_priority": 142,
    "blend_type": 4,
    "overlay_mask_name": "neutral_33.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "55": {
    "terrain_id": 55,
    "name_2": "g_sh3",
    "name": "Mangrove Forest",
    "string_id": 4741,
    "blend_priority": 144,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      197,
      235,
      53
    ]
  },
  "56": {
    "terrain_id": 56,
    "name_2": "g_fo2",
    "name": "Rainforest",
    "string_id": 4742,
    "blend_priority": 97,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "57": {
    "terrain_id": 57,
    "name_2": "g_wt4",
    "name": "Water, Deep Ocean",
    "string_id": 4743,
    "blend_priority": 179,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 2,
    "colors": [
      1,
      1,
      1
    ]
  },
  "58": {
    "terrain_id": 58,
    "name_2": "g_wt5",
    "name": "Water, Azure",
    "string_id": 4744,
    "blend_priority": 165,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 4,
    "colors": [
      4,
      4,
      4
    ]
  },
  "59": {
    "terrain_id": 59,
    "name_2": "g_sh2",
    "name": "Shallows, Azure",
    "string_id": 4745,
    "blend_priority": 145,
    "blend_type": 4,
    "overlay_mask_name": "neutral_33.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "60": {
    "terrain_id": 60,
    "name_2": "g_gr6",
    "name": "Jungle Grass",
    "string_id": 4746,
    "blend_priority": 124,
    "blend_type": 0,
    "overlay_mask_name": "jungle.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "61": {
    "terrain_id": 61,
    "name_2": "o_rd4",
    "name": "                    OBSOLETE (Road, Jungle)",
    "string_id": 4747,
    "blend_priority": 152,
    "blend_type": 5,
    "overlay_mask_name": "road.png",
    "is_water": 0,
    "colors": [
      176,
      107,
      120
    ]
  },
  "62": {
    "terrain_id": 62,
    "name_2": "o_fo2",
    "name": "                    OBSOLETE (Leaves, Jungle)",
    "string_id": 4748,
    "blend_priority": 68,
    "blend_type": 0,
    "overlay_mask_name": "leaves_jungle.png",
    "is_water": 0,
    "colors": [
      55,
      236,
      54
    ]
  },
  "63": {
    "terrain_id": 63,
    "name_2": "g_rm1",
    "name": "RFarm1",
    "string_id": 4749,
    "blend_priority": 193,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      160,
      159,
      158
    ]
  },
  "64": {
    "terrain_id": 64,
    "name_2": "g_rm2",
    "name": "RFarm2",
    "string_id": 4750,
    "blend_priority": 194,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      160,
      159,
      158
    ]
  },
  "65": {
    "terrain_id": 65,
    "name_2": "g_rc1",
    "name": "RFarm Cnst1",
    "string_id": 4751,
    "blend_priority": 190,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      160,
      159,
      158
    ]
  },
  "66": {
    "terrain_id": 66,
    "name_2": "g_rc2",
    "name": "RFarm Cnst2",
    "string_id": 4752,
    "blend_priority": 191,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      160,
      159,
      158
    ]
  },
  "67": {
    "terrain_id": 67,
    "name_2": "g_rc3",
    "name": "RFarm Cnst3",
    "string_id": 4753,
    "blend_priority": 192,
    "blend_type": 1,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      160,
      159,
      158
    ]
  },
  "68": {
    "terrain_id": 68,
    "name_2": "g_r01",
    "name": "Reserved",
    "string_id": 4754,
    "blend_priority": 114,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "69": {
    "terrain_id": 69,
    "name_2": "g_kf1",
    "name": "Very Evil Fog",
    "string_id": 4755,
    "blend_priority": 0,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      128,
      128,
      128
    ]
  },
  "70": {
    "terrain_id": 70,
    "name_2": "g_gravel_default",
    "name": "Gravel Default",
    "string_id": 4756,
    "blend_priority": 95,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "71": {
    "terrain_id": 71,
    "name_2": "g_underbrush_leaves",
    "name": "Underbrush, Leaves",
    "string_id": 4757,
    "blend_priority": 1,
    "blend_type": 0,
    "overlay_mask_name": "leaves.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "72": {
    "terrain_id": 72,
    "name_2": "g_snf",
    "name": "Underbrush, Snow",
    "string_id": 4758,
    "blend_priority": 3,
    "blend_type": 0,
    "overlay_mask_name": "snow_underbrush.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "73": {
    "terrain_id": 73,
    "name_2": "g_sno",
    "name": "Snow Light",
    "string_id": 4759,
    "blend_priority": 159,
    "blend_type": 7,
    "overlay_mask_name": "snow_light.png",
    "is_water": 160,
    "colors": [
      55,
      236,
      54
    ]
  },
  "74": {
    "terrain_id": 74,
    "name_2": "g_sno",
    "name": "Snow Deep",
    "string_id": 4760,
    "blend_priority": 156,
    "blend_type": 7,
    "overlay_mask_name": "snow_strong.png",
    "is_water": 160,
    "colors": [
      55,
      236,
      54
    ]
  },
  "75": {
    "terrain_id": 75,
    "name_2": "g_sr2",
    "name": "          NEW Road, Fungus",
    "string_id": 4761,
    "blend_priority": 197,
    "blend_type": 5,
    "overlay_mask_name": "road_broken.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "76": {
    "terrain_id": 76,
    "name_2": "g_gr4",
    "name": "Dirt Mud",
    "string_id": 4762,
    "blend_priority": 122,
    "blend_type": 0,
    "overlay_mask_name": "dirt.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "77": {
    "terrain_id": 77,
    "name_2": "g_fo2",
    "name": "          NEW Leaves, Jungle",
    "string_id": 4763,
    "blend_priority": 69,
    "blend_type": 0,
    "overlay_mask_name": "leaves_jungle.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "78": {
    "terrain_id": 78,
    "name_2": "g_rd5",
    "name": "          NEW Road, Gravel (Desert)",
    "string_id": 4764,
    "blend_priority": 148,
    "blend_type": 5,
    "overlay_mask_name": "road_gravel.png",
    "is_water": 32,
    "colors": [
      176,
      107,
      120
    ]
  },
  "79": {
    "terrain_id": 79,
    "name_2": "g_bch",
    "name": "Beach (Non-Navigable)",
    "string_id": 4765,
    "blend_priority": 132,
    "blend_type": 2,
    "overlay_mask_name": "beach.png",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "80": {
    "terrain_id": 80,
    "name_2": "g_beach_wet",
    "name": "Beach, Wet (Non-Navigable)",
    "string_id": 4766,
    "blend_priority": 133,
    "blend_type": 2,
    "overlay_mask_name": "beach.png",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "81": {
    "terrain_id": 81,
    "name_2": "g_gravel_wet",
    "name": "Beach, Gravel Wet (Non-Navigable)",
    "string_id": 4767,
    "blend_priority": 135,
    "blend_type": 2,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "82": {
    "terrain_id": 82,
    "name_2": "g_rock_wet",
    "name": "Beach, Rock Wet (Non-Navigable)",
    "string_id": 4768,
    "blend_priority": 137,
    "blend_type": 2,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "83": {
    "terrain_id": 83,
    "name_2": "g_gr6",
    "name": "Jungle Grass (Rainforest)",
    "string_id": 4799,
    "blend_priority": 125,
    "blend_type": 0,
    "overlay_mask_name": "jungle.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "84": {
    "terrain_id": 84,
    "name_2": "o_mod",
    "name": "Moddable Grass",
    "string_id": 4770,
    "blend_priority": 115,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "85": {
    "terrain_id": 85,
    "name_2": "o_mod",
    "name": "Moddable Grass",
    "string_id": 4771,
    "blend_priority": 116,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "86": {
    "terrain_id": 86,
    "name_2": "o_mod",
    "name": "Moddable Grass",
    "string_id": 4772,
    "blend_priority": 117,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "87": {
    "terrain_id": 87,
    "name_2": "o_mod",
    "name": "Moddable Grass",
    "string_id": 4772,
    "blend_priority": 118,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "88": {
    "terrain_id": 88,
    "name_2": "g_for",
    "name": "Forest, Mediterranean",
    "string_id": 4774,
    "blend_priority": 109,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "89": {
    "terrain_id": 89,
    "name_2": "g_for",
    "name": "Forest, Bush",
    "string_id": 4775,
    "blend_priority": 102,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "90": {
    "terrain_id": 90,
    "name_2": "g_sha",
    "name": "Forest, Reeds (Shallows)",
    "string_id": 4796,
    "blend_priority": 77,
    "blend_type": 4,
    "overlay_mask_name": "water.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "91": {
    "terrain_id": 91,
    "name_2": "g_beach_wet",
    "name": "Forest, Reeds (Beach)",
    "string_id": 4797,
    "blend_priority": 103,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 16,
    "colors": [
      197,
      235,
      53
    ]
  },
  "92": {
    "terrain_id": 92,
    "name_2": "g_for",
    "name": "Forest, Reeds",
    "string_id": 4798,
    "blend_priority": 104,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "93": {
    "terrain_id": 93,
    "name_2": "o_mod",
    "name": "Moddable Shallows",
    "string_id": 4779,
    "blend_priority": 78,
    "blend_type": 4,
    "overlay_mask_name": "water.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "94": {
    "terrain_id": 94,
    "name_2": "o_mod",
    "name": "Moddable Shallows",
    "string_id": 4780,
    "blend_priority": 80,
    "blend_type": 4,
    "overlay_mask_name": "water.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "95": {
    "terrain_id": 95,
    "name_2": "g_wt_green",
    "name": "Water, Green",
    "string_id": 4781,
    "blend_priority": 169,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 4,
    "colors": [
      19,
      19,
      19
    ]
  },
  "96": {
    "terrain_id": 96,
    "name_2": "g_wt_brown",
    "name": "Water, Brown",
    "string_id": 4782,
    "blend_priority": 171,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 4,
    "colors": [
      19,
      19,
      19
    ]
  },
  "97": {
    "terrain_id": 97,
    "name_2": "o_mod",
    "name": "Moddable Normal Water",
    "string_id": 4783,
    "blend_priority": 172,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 1,
    "colors": [
      19,
      19,
      19
    ]
  },
  "98": {
    "terrain_id": 98,
    "name_2": "o_mod",
    "name": "Moddable Normal Water",
    "string_id": 4784,
    "blend_priority": 173,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 1,
    "colors": [
      19,
      19,
      19
    ]
  },
  "99": {
    "terrain_id": 99,
    "name_2": "o_mod",
    "name": "Moddable Deep Water",
    "string_id": 4785,
    "blend_priority": 174,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 2,
    "colors": [
      19,
      19,
      19
    ]
  },
  "100": {
    "terrain_id": 100,
    "name_2": "g_gr7",
    "name": "Dry Grass",
    "string_id": 4786,
    "blend_priority": 127,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "101": {
    "terrain_id": 101,
    "name_2": "g_qs2",
    "name": "Bogland",
    "string_id": 4787,
    "blend_priority": 84,
    "blend_type": 4,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      227,
      227,
      227
    ]
  },
  "102": {
    "terrain_id": 102,
    "name_2": "g_ds5",
    "name": "Desert, Gravel",
    "string_id": 4788,
    "blend_priority": 92,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      137,
      124,
      88
    ]
  },
  "103": {
    "terrain_id": 103,
    "name_2": "o_rd5",
    "name": "                    OBSOLETE (Road, Gravel)",
    "string_id": 4789,
    "blend_priority": 149,
    "blend_type": 5,
    "overlay_mask_name": "road_gravel.png",
    "is_water": 0,
    "colors": [
      176,
      107,
      120
    ]
  },
  "104": {
    "terrain_id": 104,
    "name_2": "g_for",
    "name": "Forest, Autumn",
    "string_id": 4790,
    "blend_priority": 99,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "105": {
    "terrain_id": 105,
    "name_2": "g_snf",
    "name": "Forest, Snow Autumn",
    "string_id": 4791,
    "blend_priority": 163,
    "blend_type": 7,
    "overlay_mask_name": "snow_underbrush.png",
    "is_water": 160,
    "colors": [
      197,
      235,
      53
    ]
  },
  "106": {
    "terrain_id": 106,
    "name_2": "g_snf",
    "name": "Dead Forest",
    "string_id": 4792,
    "blend_priority": 161,
    "blend_type": 7,
    "overlay_mask_name": "snow_underbrush.png",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "107": {
    "terrain_id": 107,
    "name_2": "g_beach_wet",
    "name": "Beach, Wet",
    "string_id": 4793,
    "blend_priority": 134,
    "blend_type": 2,
    "overlay_mask_name": "beach_soft.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "108": {
    "terrain_id": 108,
    "name_2": "g_gravel_wet",
    "name": "Beach, Gravel Wet",
    "string_id": 4794,
    "blend_priority": 136,
    "blend_type": 2,
    "overlay_mask_name": "beach_soft.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "109": {
    "terrain_id": 109,
    "name_2": "g_rock_wet",
    "name": "Beach, Rock Wet",
    "string_id": 4795,
    "blend_priority": 138,
    "blend_type": 2,
    "overlay_mask_name": "beach_soft.png",
    "is_water": 16,
    "colors": [
      137,
      124,
      88
    ]
  },
  "110": {
    "terrain_id": 110,
    "name_2": "g_for",
    "name": "Forest, Birch",
    "string_id": 4800,
    "blend_priority": 100,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "111": {
    "terrain_id": 111,
    "name_2": "g_sh4",
    "name": "Swamp",
    "string_id": 4801,
    "blend_priority": 140,
    "blend_type": 4,
    "overlay_mask_name": "",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "112": {
    "terrain_id": 112,
    "name_2": "g_gr2",
    "name": "Forest, Palm Grass",
    "string_id": 4802,
    "blend_priority": 94,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "113": {
    "terrain_id": 113,
    "name_2": "g_fo2",
    "name": "Forest, Lush Bamboo",
    "string_id": 4803,
    "blend_priority": 91,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "114": {
    "terrain_id": 114,
    "name_2": "g_wt_yellow",
    "name": "Water, Yellow Shallow",
    "string_id": 4804,
    "blend_priority": 167,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 4,
    "colors": [
      19,
      19,
      19
    ]
  },
  "115": {
    "terrain_id": 115,
    "name_2": "g_sh5",
    "name": "Shallows, Yellow",
    "string_id": 4805,
    "blend_priority": 143,
    "blend_type": 4,
    "overlay_mask_name": "neutral_33.png",
    "is_water": 8,
    "colors": [
      227,
      227,
      227
    ]
  },
  "116": {
    "terrain_id": 116,
    "name_2": "g_wt_yellow2",
    "name": "Water, Yellow Deep",
    "string_id": 4806,
    "blend_priority": 170,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 1,
    "colors": [
      19,
      19,
      19
    ]
  },
  "117": {
    "terrain_id": 117,
    "name_2": "g_pm1",
    "name": "Pasture1",
    "string_id": 4807,
    "blend_priority": 187,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "118": {
    "terrain_id": 118,
    "name_2": "g_pm2",
    "name": "Pasture2",
    "string_id": 4808,
    "blend_priority": 189,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      160,
      159,
      158
    ]
  },
  "119": {
    "terrain_id": 119,
    "name_2": "g_pc1",
    "name": "Pasture Cnst1",
    "string_id": 4809,
    "blend_priority": 181,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "120": {
    "terrain_id": 120,
    "name_2": "g_pc2",
    "name": "Pasture Cnst2",
    "string_id": 4810,
    "blend_priority": 183,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "121": {
    "terrain_id": 121,
    "name_2": "g_pc3",
    "name": "Pasture Cnst3",
    "string_id": 4811,
    "blend_priority": 185,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "122": {
    "terrain_id": 122,
    "name_2": "g_gr8",
    "name": "Grass Flowers 1",
    "string_id": 4812,
    "blend_priority": 112,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "123": {
    "terrain_id": 123,
    "name_2": "g_gr9",
    "name": "Grass Flowers 2",
    "string_id": 4813,
    "blend_priority": 113,
    "blend_type": 0,
    "overlay_mask_name": "grass.png",
    "is_water": 32,
    "colors": [
      55,
      236,
      54
    ]
  },
  "124": {
    "terrain_id": 124,
    "name_2": "g_sn2",
    "name": "Snow Soft",
    "string_id": 4814,
    "blend_priority": 154,
    "blend_type": 7,
    "overlay_mask_name": "snow.png",
    "is_water": 160,
    "colors": [
      55,
      236,
      54
    ]
  },
  "125": {
    "terrain_id": 125,
    "name_2": "g_sn2",
    "name": "Snow Soft Light",
    "string_id": 4815,
    "blend_priority": 160,
    "blend_type": 7,
    "overlay_mask_name": "snow_light.png",
    "is_water": 160,
    "colors": [
      55,
      236,
      54
    ]
  },
  "126": {
    "terrain_id": 126,
    "name_2": "g_sn2",
    "name": "Snow Soft Deep",
    "string_id": 4816,
    "blend_priority": 157,
    "blend_type": 7,
    "overlay_mask_name": "snow_strong.png",
    "is_water": 160,
    "colors": [
      55,
      236,
      54
    ]
  },
  "127": {
    "terrain_id": 127,
    "name_2": "g_ic3",
    "name": "Ice Soft",
    "string_id": 4817,
    "blend_priority": 74,
    "blend_type": 6,
    "overlay_mask_name": "ice.png",
    "is_water": 96,
    "colors": [
      240,
      240,
      240
    ]
  },
  "128": {
    "terrain_id": 128,
    "name_2": "g_for",
    "name": "Forest, Dry South American",
    "string_id": 4818,
    "blend_priority": 90,
    "blend_type": 0,
    "overlay_mask_name": "leaves.png",
    "is_water": 32,
    "colors": [
      197,
      235,
      53
    ]
  },
  "129": {
    "terrain_id": 129,
    "name_2": "g_bla",
    "name": "Black (Walkable)",
    "string_id": 4819,
    "blend_priority": 199,
    "blend_type": 0,
    "overlay_mask_name": "",
    "is_water": 32,
    "colors": [
      128,
      128,
      128
    ]
  },
  "130": {
    "terrain_id": 130,
    "name_2": "g_wt6",
    "name": "Water, Weeds",
    "string_id": 4820,
    "blend_priority": 168,
    "blend_type": 3,
    "overlay_mask_name": "water.png",
    "is_water": 4,
    "colors": [
      19,
      19,
      19
    ]
  }
};

export const DE_TERRAIN_BLEND: Record<string, { prio?: number; mask?: string | null; [key: string]: any }> = {
  "0": {
    "name": "Grass",
    "name2": "g_grs",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 110,
    "btype": 0
  },
  "1": {
    "name": "Water, Shallow",
    "name2": "g_wtr",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 166,
    "btype": 3
  },
  "2": {
    "name": "Beach",
    "name2": "g_bch",
    "dim": [
      10,
      10
    ],
    "mask": "beach_soft.png",
    "prio": 130,
    "btype": 2
  },
  "3": {
    "name": "Dirt 3",
    "name2": "g_ds3",
    "dim": [
      10,
      10
    ],
    "mask": "dirt.png",
    "prio": 83,
    "btype": 0
  },
  "4": {
    "name": "Shallows",
    "name2": "g_sha",
    "dim": [
      10,
      10
    ],
    "mask": "neutral_33.png",
    "prio": 138,
    "btype": 4
  },
  "5": {
    "name": "Underbrush",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": "leaves.png",
    "prio": 2,
    "btype": 0
  },
  "6": {
    "name": "Dirt",
    "name2": "g_des",
    "dim": [
      10,
      10
    ],
    "mask": "dirt.png",
    "prio": 80,
    "btype": 0
  },
  "7": {
    "name": "Farm1",
    "name2": "g_fm1",
    "dim": [
      6,
      6
    ],
    "mask": null,
    "prio": 186,
    "btype": 1
  },
  "8": {
    "name": "Farm2",
    "name2": "g_fm2",
    "dim": [
      6,
      6
    ],
    "mask": null,
    "prio": 188,
    "btype": 1
  },
  "9": {
    "name": "Grass 3",
    "name2": "g_gr3",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 119,
    "btype": 0
  },
  "10": {
    "name": "Forest",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": "leaves.png",
    "prio": 94,
    "btype": 0
  },
  "11": {
    "name": "Dirt 2",
    "name2": "g_ds2",
    "dim": [
      10,
      10
    ],
    "mask": "dirt.png",
    "prio": 82,
    "btype": 0
  },
  "12": {
    "name": "Grass 2",
    "name2": "g_gr2",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 118,
    "btype": 0
  },
  "13": {
    "name": "Palm Desert",
    "name2": "g_pal",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 91,
    "btype": 0
  },
  "14": {
    "name": "Desert",
    "name2": "g_pal",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 86,
    "btype": 0
  },
  "15": {
    "name": "Water, Old",
    "name2": "g_wtr",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 177,
    "btype": 3
  },
  "16": {
    "name": "Old Grass",
    "name2": "g_grs",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 122,
    "btype": 0
  },
  "17": {
    "name": "Jungle",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 106,
    "btype": 0
  },
  "18": {
    "name": "Bamboo",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 97,
    "btype": 0
  },
  "19": {
    "name": "Pine Forest",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 107,
    "btype": 0
  },
  "20": {
    "name": "Forest, Oak Bush",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 100,
    "btype": 0
  },
  "21": {
    "name": "Snow Forest",
    "name2": "g_snf",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 161,
    "btype": 7
  },
  "22": {
    "name": "Water, Deep",
    "name2": "g_wt2",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 176,
    "btype": 3
  },
  "23": {
    "name": "Water, Medium",
    "name2": "g_wt3",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 178,
    "btype": 3
  },
  "24": {
    "name": "Road",
    "name2": "g_rd1",
    "dim": [
      10,
      10
    ],
    "mask": "road.png",
    "prio": 145,
    "btype": 5
  },
  "25": {
    "name": "Road, Broken",
    "name2": "g_rd2",
    "dim": [
      10,
      10
    ],
    "mask": "road_broken.png",
    "prio": 146,
    "btype": 5
  },
  "26": {
    "name": "Ice Navigable",
    "name2": "g_ic2",
    "dim": [
      10,
      10
    ],
    "mask": "ice.png",
    "prio": 68,
    "btype": 6
  },
  "27": {
    "name": "Foundation",
    "name2": "g_ds2",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 140,
    "btype": 0
  },
  "28": {
    "name": "Water, Bridge",
    "name2": "g_wtr",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 175,
    "btype": 3
  },
  "29": {
    "name": "Farm Cnst1",
    "name2": "g_fc1",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 180,
    "btype": 1
  },
  "30": {
    "name": "Farm Cnst2",
    "name2": "g_fc2",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 182,
    "btype": 1
  },
  "31": {
    "name": "Farm Cnst3",
    "name2": "g_fc3",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 184,
    "btype": 1
  },
  "32": {
    "name": "Snow",
    "name2": "g_sno",
    "dim": [
      10,
      10
    ],
    "mask": "snow.png",
    "prio": 152,
    "btype": 7
  },
  "33": {
    "name": "                    OBSOLETE (Snow Dirt)",
    "name2": "o_snd",
    "dim": [
      10,
      10
    ],
    "mask": "snow.png",
    "prio": 154,
    "btype": 7
  },
  "34": {
    "name": "                    OBSOLETE (Snow Grass)",
    "name2": "o_sng",
    "dim": [
      10,
      10
    ],
    "mask": "snow.png",
    "prio": 157,
    "btype": 7
  },
  "35": {
    "name": "Ice",
    "name2": "g_ice",
    "dim": [
      10,
      10
    ],
    "mask": "ice.png",
    "prio": 69,
    "btype": 6
  },
  "36": {
    "name": "Snow Foundat",
    "name2": "g_snd",
    "dim": [
      10,
      10
    ],
    "mask": "snow.png",
    "prio": 164,
    "btype": 7
  },
  "37": {
    "name": "Ice, Beach",
    "name2": "g_ice_beach",
    "dim": [
      10,
      10
    ],
    "mask": "ice.png",
    "prio": 72,
    "btype": 6
  },
  "38": {
    "name": "                    OBSOLETE (Road, Snow)",
    "name2": "o_sr1",
    "dim": [
      10,
      10
    ],
    "mask": "road.png",
    "prio": 195,
    "btype": 5
  },
  "39": {
    "name": "                    OBSOLETE (Road, Fungus)",
    "name2": "o_sr2",
    "dim": [
      10,
      10
    ],
    "mask": "road_broken.png",
    "prio": 196,
    "btype": 5
  },
  "40": {
    "name": "Rock 1",
    "name2": "g_rck",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 150,
    "btype": 5
  },
  "41": {
    "name": "Savannah",
    "name2": "g_gr5",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 127,
    "btype": 0
  },
  "42": {
    "name": "Dirt 4",
    "name2": "g_ds4",
    "dim": [
      10,
      10
    ],
    "mask": "dirt.png",
    "prio": 84,
    "btype": 0
  },
  "43": {
    "name": "                    OBSOLETE (Road, Desert)",
    "name2": "o_rd3",
    "dim": [
      10,
      10
    ],
    "mask": "road.png",
    "prio": 149,
    "btype": 5
  },
  "44": {
    "name": "                    OBSOLETE (Moorland)",
    "name2": "o_gr4",
    "dim": [
      10,
      10
    ],
    "mask": "dirt.png",
    "prio": 120,
    "btype": 0
  },
  "45": {
    "name": "Desert, Cracked",
    "name2": "g_pal1",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 85,
    "btype": 0
  },
  "46": {
    "name": "Desert, Quicksand",
    "name2": "g_qs",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 78,
    "btype": 0
  },
  "47": {
    "name": "Black",
    "name2": "g_bla",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 198,
    "btype": 0
  },
  "48": {
    "name": "Dragon Forest",
    "name2": "g_des",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 105,
    "btype": 0
  },
  "49": {
    "name": "Baobab Forest",
    "name2": "g_ds4",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 104,
    "btype": 0
  },
  "50": {
    "name": "Acacia Forest",
    "name2": "g_gr5",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 109,
    "btype": 0
  },
  "51": {
    "name": "Beach, White Vegetation",
    "name2": "g_bc4",
    "dim": [
      10,
      10
    ],
    "mask": "beach.png",
    "prio": 125,
    "btype": 2
  },
  "52": {
    "name": "Beach, Vegetation",
    "name2": "g_bc2",
    "dim": [
      10,
      10
    ],
    "mask": "beach.png",
    "prio": 129,
    "btype": 2
  },
  "53": {
    "name": "Beach, White",
    "name2": "g_bc3",
    "dim": [
      10,
      10
    ],
    "mask": "beach.png",
    "prio": 128,
    "btype": 2
  },
  "54": {
    "name": "Mangrove Shallows",
    "name2": "g_sh3",
    "dim": [
      10,
      10
    ],
    "mask": "neutral_33.png",
    "prio": 141,
    "btype": 4
  },
  "55": {
    "name": "Mangrove Forest",
    "name2": "g_sh3",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 143,
    "btype": 0
  },
  "56": {
    "name": "Rainforest",
    "name2": "g_fo2",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 96,
    "btype": 0
  },
  "57": {
    "name": "Water, Deep Ocean",
    "name2": "g_wt4",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 179,
    "btype": 3
  },
  "58": {
    "name": "Water, Azure",
    "name2": "g_wt5",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 165,
    "btype": 3
  },
  "59": {
    "name": "Shallows, Azure",
    "name2": "g_sh2",
    "dim": [
      10,
      10
    ],
    "mask": "neutral_33.png",
    "prio": 144,
    "btype": 4
  },
  "60": {
    "name": "Jungle Grass",
    "name2": "g_gr6",
    "dim": [
      10,
      10
    ],
    "mask": "jungle.png",
    "prio": 123,
    "btype": 0
  },
  "61": {
    "name": "                    OBSOLETE (Road, Jungle)",
    "name2": "o_rd4",
    "dim": [
      10,
      10
    ],
    "mask": "road.png",
    "prio": 151,
    "btype": 5
  },
  "62": {
    "name": "                    OBSOLETE (Leaves, Jungle)",
    "name2": "o_fo2",
    "dim": [
      10,
      10
    ],
    "mask": "leaves_jungle.png",
    "prio": 65,
    "btype": 0
  },
  "63": {
    "name": "RFarm1",
    "name2": "g_rm1",
    "dim": [
      6,
      6
    ],
    "mask": null,
    "prio": 193,
    "btype": 1
  },
  "64": {
    "name": "RFarm2",
    "name2": "g_rm2",
    "dim": [
      6,
      6
    ],
    "mask": null,
    "prio": 194,
    "btype": 1
  },
  "65": {
    "name": "RFarm Cnst1",
    "name2": "g_rc1",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 190,
    "btype": 1
  },
  "66": {
    "name": "RFarm Cnst2",
    "name2": "g_rc2",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 191,
    "btype": 1
  },
  "67": {
    "name": "RFarm Cnst3",
    "name2": "g_rc3",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 192,
    "btype": 1
  },
  "68": {
    "name": "Reserved",
    "name2": "g_r01",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 113,
    "btype": 0
  },
  "69": {
    "name": "Very Evil Fog",
    "name2": "g_kf1",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 0,
    "btype": 0
  },
  "70": {
    "name": "Gravel Default",
    "name2": "g_gravel_default",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 93,
    "btype": 0
  },
  "71": {
    "name": "Underbrush, Leaves",
    "name2": "g_underbrush_leaves",
    "dim": [
      10,
      10
    ],
    "mask": "leaves.png",
    "prio": 1,
    "btype": 0
  },
  "72": {
    "name": "Underbrush, Snow",
    "name2": "g_snf",
    "dim": [
      10,
      10
    ],
    "mask": "snow_underbrush.png",
    "prio": 3,
    "btype": 0
  },
  "73": {
    "name": "Snow Light",
    "name2": "g_sno",
    "dim": [
      10,
      10
    ],
    "mask": "snow_light.png",
    "prio": 158,
    "btype": 7
  },
  "74": {
    "name": "Snow Deep",
    "name2": "g_sno",
    "dim": [
      10,
      10
    ],
    "mask": "snow_strong.png",
    "prio": 155,
    "btype": 7
  },
  "75": {
    "name": "          NEW Road, Fungus",
    "name2": "g_sr2",
    "dim": [
      10,
      10
    ],
    "mask": "road_broken.png",
    "prio": 197,
    "btype": 5
  },
  "76": {
    "name": "Dirt Mud",
    "name2": "g_gr4",
    "dim": [
      10,
      10
    ],
    "mask": "dirt.png",
    "prio": 121,
    "btype": 0
  },
  "77": {
    "name": "          NEW Leaves, Jungle",
    "name2": "g_fo2",
    "dim": [
      10,
      10
    ],
    "mask": "leaves_jungle.png",
    "prio": 66,
    "btype": 0
  },
  "78": {
    "name": "          NEW Road, Gravel (Desert)",
    "name2": "g_rd5",
    "dim": [
      10,
      10
    ],
    "mask": "road_gravel.png",
    "prio": 147,
    "btype": 5
  },
  "79": {
    "name": "Beach (Non-Navigable)",
    "name2": "g_bch",
    "dim": [
      10,
      10
    ],
    "mask": "beach.png",
    "prio": 131,
    "btype": 2
  },
  "80": {
    "name": "Beach, Wet (Non-Navigable)",
    "name2": "g_beach_wet",
    "dim": [
      10,
      10
    ],
    "mask": "beach.png",
    "prio": 132,
    "btype": 2
  },
  "81": {
    "name": "Beach, Gravel Wet (Non-Navigable)",
    "name2": "g_gravel_wet",
    "dim": [
      15,
      15
    ],
    "mask": null,
    "prio": 134,
    "btype": 2
  },
  "82": {
    "name": "Beach, Rock Wet (Non-Navigable)",
    "name2": "g_rock_wet",
    "dim": [
      15,
      15
    ],
    "mask": null,
    "prio": 136,
    "btype": 2
  },
  "83": {
    "name": "Jungle Grass (Rainforest)",
    "name2": "g_gr6",
    "dim": [
      10,
      10
    ],
    "mask": "jungle.png",
    "prio": 124,
    "btype": 0
  },
  "84": {
    "name": "Moddable Grass",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 114,
    "btype": 0
  },
  "85": {
    "name": "Moddable Grass",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 115,
    "btype": 0
  },
  "86": {
    "name": "Moddable Grass",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 116,
    "btype": 0
  },
  "87": {
    "name": "Moddable Grass",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 117,
    "btype": 0
  },
  "88": {
    "name": "Forest, Mediterranean",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 108,
    "btype": 0
  },
  "89": {
    "name": "Forest, Bush",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 101,
    "btype": 0
  },
  "90": {
    "name": "Forest, Reeds (Shallows)",
    "name2": "g_sha",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 74,
    "btype": 4
  },
  "91": {
    "name": "Forest, Reeds (Beach)",
    "name2": "g_beach_wet",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 102,
    "btype": 0
  },
  "92": {
    "name": "Forest, Reeds",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 103,
    "btype": 0
  },
  "93": {
    "name": "Moddable Shallows",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 75,
    "btype": 4
  },
  "94": {
    "name": "Moddable Shallows",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 77,
    "btype": 4
  },
  "95": {
    "name": "Water, Green",
    "name2": "g_wt_green",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 169,
    "btype": 3
  },
  "96": {
    "name": "Water, Brown",
    "name2": "g_wt_brown",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 171,
    "btype": 3
  },
  "97": {
    "name": "Moddable Normal Water",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 172,
    "btype": 3
  },
  "98": {
    "name": "Moddable Normal Water",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 173,
    "btype": 3
  },
  "99": {
    "name": "Moddable Deep Water",
    "name2": "o_mod",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 174,
    "btype": 3
  },
  "100": {
    "name": "Dry Grass",
    "name2": "g_gr7",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 126,
    "btype": 0
  },
  "101": {
    "name": "Bogland",
    "name2": "g_qs2",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 81,
    "btype": 4
  },
  "102": {
    "name": "Desert, Gravel",
    "name2": "g_ds5",
    "dim": [
      15,
      15
    ],
    "mask": null,
    "prio": 90,
    "btype": 0
  },
  "103": {
    "name": "                    OBSOLETE (Road, Gravel)",
    "name2": "o_rd5",
    "dim": [
      10,
      10
    ],
    "mask": "road_gravel.png",
    "prio": 148,
    "btype": 5
  },
  "104": {
    "name": "Forest, Autumn",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 98,
    "btype": 0
  },
  "105": {
    "name": "Forest, Snow Autumn",
    "name2": "g_snf",
    "dim": [
      10,
      10
    ],
    "mask": "snow_underbrush.png",
    "prio": 162,
    "btype": 7
  },
  "106": {
    "name": "Dead Forest",
    "name2": "g_snf",
    "dim": [
      10,
      10
    ],
    "mask": "snow_underbrush.png",
    "prio": 160,
    "btype": 7
  },
  "107": {
    "name": "Beach, Wet",
    "name2": "g_beach_wet",
    "dim": [
      10,
      10
    ],
    "mask": "beach_soft.png",
    "prio": 133,
    "btype": 2
  },
  "108": {
    "name": "Beach, Gravel Wet",
    "name2": "g_gravel_wet",
    "dim": [
      15,
      15
    ],
    "mask": "beach_soft.png",
    "prio": 135,
    "btype": 2
  },
  "109": {
    "name": "Beach, Rock Wet",
    "name2": "g_rock_wet",
    "dim": [
      15,
      15
    ],
    "mask": "beach_soft.png",
    "prio": 137,
    "btype": 2
  },
  "110": {
    "name": "Forest, Birch",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 99,
    "btype": 0
  },
  "111": {
    "name": "Swamp",
    "name2": "g_sh4",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 139,
    "btype": 4
  },
  "112": {
    "name": "Forest, Palm Grass",
    "name2": "g_gr2",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 92,
    "btype": 0
  },
  "113": {
    "name": "Forest, Lush Bamboo",
    "name2": "g_fo2",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 89,
    "btype": 0
  },
  "114": {
    "name": "Water, Yellow Shallow",
    "name2": "g_wt_yellow",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 167,
    "btype": 3
  },
  "115": {
    "name": "Shallows, Yellow",
    "name2": "g_sh5",
    "dim": [
      10,
      10
    ],
    "mask": "neutral_33.png",
    "prio": 142,
    "btype": 4
  },
  "116": {
    "name": "Water, Yellow Deep",
    "name2": "g_wt_yellow2",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 170,
    "btype": 3
  },
  "117": {
    "name": "Pasture1",
    "name2": "g_pm1",
    "dim": [
      6,
      6
    ],
    "mask": null,
    "prio": 187,
    "btype": 0
  },
  "118": {
    "name": "Pasture2",
    "name2": "g_pm2",
    "dim": [
      6,
      6
    ],
    "mask": null,
    "prio": 189,
    "btype": 0
  },
  "119": {
    "name": "Pasture Cnst1",
    "name2": "g_pc1",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 181,
    "btype": 0
  },
  "120": {
    "name": "Pasture Cnst2",
    "name2": "g_pc2",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 183,
    "btype": 0
  },
  "121": {
    "name": "Pasture Cnst3",
    "name2": "g_pc3",
    "dim": [
      3,
      3
    ],
    "mask": null,
    "prio": 185,
    "btype": 0
  },
  "122": {
    "name": "Grass Flowers 1",
    "name2": "g_gr8",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 111,
    "btype": 0
  },
  "123": {
    "name": "Grass Flowers 2",
    "name2": "g_gr9",
    "dim": [
      10,
      10
    ],
    "mask": "grass.png",
    "prio": 112,
    "btype": 0
  },
  "124": {
    "name": "Snow Soft",
    "name2": "g_sn2",
    "dim": [
      10,
      10
    ],
    "mask": "snow.png",
    "prio": 153,
    "btype": 7
  },
  "125": {
    "name": "Snow Soft Light",
    "name2": "g_sn2",
    "dim": [
      10,
      10
    ],
    "mask": "snow_light.png",
    "prio": 159,
    "btype": 7
  },
  "126": {
    "name": "Snow Soft Deep",
    "name2": "g_sn2",
    "dim": [
      10,
      10
    ],
    "mask": "snow_strong.png",
    "prio": 156,
    "btype": 7
  },
  "127": {
    "name": "Ice Soft",
    "name2": "g_ic3",
    "dim": [
      10,
      10
    ],
    "mask": "ice.png",
    "prio": 71,
    "btype": 6
  },
  "128": {
    "name": "Forest, Dry South American",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": "leaves.png",
    "prio": 87,
    "btype": 0
  },
  "129": {
    "name": "Black (Walkable)",
    "name2": "g_bla",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 199,
    "btype": 0
  },
  "130": {
    "name": "Water, Weeds",
    "name2": "g_wt6",
    "dim": [
      10,
      10
    ],
    "mask": "water.png",
    "prio": 168,
    "btype": 3
  },
  "131": {
    "name": "Forest, Spruce",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": null,
    "prio": 88,
    "btype": 0
  },
  "132": {
    "name": "Forest, Spruce Snow",
    "name2": "g_snf",
    "dim": [
      10,
      10
    ],
    "mask": "snow_underbrush.png",
    "prio": 163,
    "btype": 7
  },
  "133": {
    "name": "Forest, Oak Green",
    "name2": "g_for",
    "dim": [
      10,
      10
    ],
    "mask": "leaves.png",
    "prio": 95,
    "btype": 0
  },
  "134": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 4,
    "btype": 0
  },
  "135": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 5,
    "btype": 0
  },
  "136": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 6,
    "btype": 0
  },
  "137": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 7,
    "btype": 0
  },
  "138": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 8,
    "btype": 0
  },
  "139": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 9,
    "btype": 0
  },
  "140": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 10,
    "btype": 0
  },
  "141": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 11,
    "btype": 0
  },
  "142": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 12,
    "btype": 0
  },
  "143": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 13,
    "btype": 0
  },
  "144": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 14,
    "btype": 0
  },
  "145": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 15,
    "btype": 0
  },
  "146": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 16,
    "btype": 0
  },
  "147": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 17,
    "btype": 0
  },
  "148": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 18,
    "btype": 0
  },
  "149": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 19,
    "btype": 0
  },
  "150": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 20,
    "btype": 0
  },
  "151": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 21,
    "btype": 0
  },
  "152": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 22,
    "btype": 0
  },
  "153": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 23,
    "btype": 0
  },
  "154": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 24,
    "btype": 0
  },
  "155": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 25,
    "btype": 0
  },
  "156": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 26,
    "btype": 0
  },
  "157": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 27,
    "btype": 0
  },
  "158": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 28,
    "btype": 0
  },
  "159": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 29,
    "btype": 0
  },
  "160": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 30,
    "btype": 0
  },
  "161": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 31,
    "btype": 0
  },
  "162": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 32,
    "btype": 0
  },
  "163": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 33,
    "btype": 0
  },
  "164": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 34,
    "btype": 0
  },
  "165": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 35,
    "btype": 0
  },
  "166": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 36,
    "btype": 0
  },
  "167": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 37,
    "btype": 0
  },
  "168": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 38,
    "btype": 0
  },
  "169": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 39,
    "btype": 0
  },
  "170": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 40,
    "btype": 0
  },
  "171": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 41,
    "btype": 0
  },
  "172": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 42,
    "btype": 0
  },
  "173": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 43,
    "btype": 0
  },
  "174": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 44,
    "btype": 0
  },
  "175": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 45,
    "btype": 0
  },
  "176": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 46,
    "btype": 0
  },
  "177": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 47,
    "btype": 0
  },
  "178": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 48,
    "btype": 0
  },
  "179": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 49,
    "btype": 0
  },
  "180": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 50,
    "btype": 0
  },
  "181": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 51,
    "btype": 0
  },
  "182": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 52,
    "btype": 0
  },
  "183": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 53,
    "btype": 0
  },
  "184": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 54,
    "btype": 0
  },
  "185": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 55,
    "btype": 0
  },
  "186": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 56,
    "btype": 0
  },
  "187": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 57,
    "btype": 0
  },
  "188": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 58,
    "btype": 0
  },
  "189": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 59,
    "btype": 0
  },
  "190": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 60,
    "btype": 0
  },
  "191": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 61,
    "btype": 0
  },
  "192": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 62,
    "btype": 0
  },
  "193": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 63,
    "btype": 0
  },
  "194": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 64,
    "btype": 0
  },
  "195": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 67,
    "btype": 0
  },
  "196": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 70,
    "btype": 0
  },
  "197": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 73,
    "btype": 0
  },
  "198": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 76,
    "btype": 0
  },
  "199": {
    "name": "",
    "name2": "g_grs",
    "dim": [
      0,
      0
    ],
    "mask": null,
    "prio": 79,
    "btype": 0
  }
};
