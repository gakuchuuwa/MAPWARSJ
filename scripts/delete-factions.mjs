
const factionsToDelete = ["yizhou", "sakai", "tayichiud"];
const citiesToDelete = ["city_santanghukalun", "city_tekes", "city_xianehe", "city_onon_mid"];

const targets = [];
for (const f of factionsToDelete) targets.push({ factionId: f, cityId: null });
for (const c of citiesToDelete) targets.push({ factionId: null, cityId: c });

fetch("http://localhost:5173/api/batch-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targets: targets })
}).then(r => r.json()).then(res => {
    console.log("Delete Response:", JSON.stringify(res, null, 2));
}).catch(console.error);

