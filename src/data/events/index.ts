import { HistoricalEvent } from '../../types/core';

import { EVENTS_QIN } from './index_01_qin';
import { EVENTS_HAN } from './index_02_han';
import { EVENTS_THREE_KINGDOMS } from './index_03_three_kingdoms';
import { EVENTS_JIN_SIXTEEN } from './index_04_jin_sixteen';
import { EVENTS_NORTHERN_SOUTHERN } from './index_05_northern_southern';
import { EVENTS_SUI } from './index_06_sui';
import { EVENTS_EARLY_TANG } from './index_07_early_tang';
import { EVENTS_LATE_TANG_FIVE_DYNASTIES } from './index_08_late_tang_five_dynasties';
import { EVENTS_NORTHERN_SONG } from './index_09_northern_song';
import { EVENTS_SOUTHERN_SONG } from './index_10_southern_song';
import { EVENTS_MONGOL_YUAN } from './index_11_mongol_yuan';
import { EVENTS_MING } from './index_12_ming';
import { EVENTS_EARLY_QING } from './index_13_early_qing';
import { EVENTS_LATE_QING } from './index_14_late_qing';

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
    ...EVENTS_QIN,
    ...EVENTS_HAN,
    ...EVENTS_THREE_KINGDOMS,
    ...EVENTS_JIN_SIXTEEN,
    ...EVENTS_NORTHERN_SOUTHERN,
    ...EVENTS_SUI,
    ...EVENTS_EARLY_TANG,
    ...EVENTS_LATE_TANG_FIVE_DYNASTIES,
    ...EVENTS_NORTHERN_SONG,
    ...EVENTS_SOUTHERN_SONG,
    ...EVENTS_MONGOL_YUAN,
    ...EVENTS_MING,
    ...EVENTS_EARLY_QING,
    ...EVENTS_LATE_QING
].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return (a.season || 0) - (b.season || 0);
});
