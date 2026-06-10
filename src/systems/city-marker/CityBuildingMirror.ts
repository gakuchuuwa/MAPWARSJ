import type { CityType } from '../../types/core';

/** 每局开局对大/中/小城随机左右镜像；关隘仅用数据里的 mirror，不随机 */
export function rollSessionCityMirror(type: CityType, dataMirror?: boolean): boolean {
    if (type === 'pass') {
        return !!dataMirror;
    }
    if (type === 'big_city' || type === 'medium_city' || type === 'small_city') {
        return Math.random() < 0.5;
    }
    return !!dataMirror;
}
