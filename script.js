const CSV_URL = "PASTE_YOUR_CSV_LINK_HERE";

const map = L.map("map", {
  zoomControl: true,
  scrollWheelZoom: false
}).setView([29.7030, -98.1245], 11);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: "abcd",
  maxZoom: 20
}).addTo(map);

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/);
  const headers = rows.shift().split(",").map(h => h.trim());

  return rows.map(row => {
    const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (values[i] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  });
}

function markerColor(severity) {
  const value = (severity || "").toLowerCase();

  if (value.includes("high") || value.includes("critical")) return "#8b2e2e";
  if (value.includes("elevated")) return "#b7ff00";

  return "#c8beab";
}

function addSightings(rows) {
  const bounds = [];

  rows
    .filter(row => String(row.approved).toUpperCase() === "TRUE")
    .forEach(row => {
      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const point = L.circleMarker([lat, lng], {
        radius: 8,
        color: markerColor(row.severity),
        fillColor: markerColor(row.severity),
        fillOpacity: 0.75,
        weight: 1
      }).addTo(map);

      point.bindPopup(`
        <div>
          <div class="popup-ref">${row.log_ref || "LOG REF: UNASSIGNED"}</div>
          <div class="popup-status">STATUS: ${row.status || "UNDER REVIEW"}</div>
          <br />
          <div>AREA: ${row.area || "UNDISCLOSED"}</div>
          <div>ACTIVITY: ${row.activity || "UNSPECIFIED"}</div>
          <div>DATE: ${row.date || "UNVERIFIED"}</div>
        </div>
      `);

      bounds.push([lat, lng]);
    });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }
}

fetch(CSV_URL)
  .then(response => response.text())
  .then(text => addSightings(parseCSV(text)))
  .catch(error => {
    console.error("Tracker feed unavailable:", error);
  });
