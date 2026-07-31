const targets = [
  { cityId: 'city_xinzhou', factionId: 'deshou' }
];

fetch("http://localhost:5173/api/batch-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targets: targets })
}).then(r => r.json()).then(res => {
    console.log("Delete Response:", JSON.stringify(res, null, 2));
}).catch(console.error);
