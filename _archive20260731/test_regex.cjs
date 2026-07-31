const lines = `家族：咄陆，据点：孛罗城，坐标：44.9000, 82.0700
家族：朱邪,据点：独山城,坐标：44.4200, 84.9200
家族：车师,据点：务涂城,坐标：43.6200, 87.6200
家族：麴,据点：高昌城,,坐标：42.8530, 89.5200
政权，伊吾,据点，哈密城,坐标，42.8300, 93.5100
家族，苻，据点，晋昌城，坐标，40.2400, 96.0200。
家族，浑邪，据点，酒泉城，坐标，39.7300, 98.4900。`.split('\n');
for (const trimmed of lines) {
    const factionMatch = trimmed.match(/(?:势力|民族|政权|家族)[，:：]\s*([^，,：:]+)/);
    const cityMatch = trimmed.match(/据点[，:：]\s*([^，,：:]+)/);
    const coordMatch = trimmed.match(/坐标[，:：]\s*([\d.\-]+)\s*[,，]\s*([\d.\-]+)/);
    console.log(factionMatch?.[1], cityMatch?.[1], coordMatch?.[1], coordMatch?.[2]);
}
