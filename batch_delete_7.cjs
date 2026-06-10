const http = require('http');

const targets = [
  { cityId: 'city_jiankun', factionId: 'xiajiasi' },
  { cityId: 'city_oirat', factionId: 'oirat' },
  { cityId: 'city_daning', factionId: 'wuliangha' },
  { cityId: 'city_ivolginsk', factionId: 'dingling' },
  { cityId: 'city_nutuo', factionId: 'nivkh' },
  { cityId: 'city_pulan', factionId: 'purang' },
  { cityId: 'city_nuergan', factionId: 'woji' }
];

const data = JSON.stringify({ targets });

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/batch-delete',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
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
