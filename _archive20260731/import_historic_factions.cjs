const http = require('http');

const factions = [
  { type: 'ethnicity', name: '瓦剌', cityName: '博尔巴任', lat: 49.6643, lng: 95.7678 },
  { type: 'ethnicity', name: '兀良哈', cityName: '赛音山达', lat: 44.8751, lng: 110.1544 },
  { type: 'ethnicity', name: '丁零', cityName: '燕然山', lat: 46.2767, lng: 102.8018 },
  { type: 'ethnicity', name: '尼夫赫', cityName: '盆奴里', lat: 47.6505, lng: 130.9570 }
];

const data = JSON.stringify({ factions });

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/batch-import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
