const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRl1CGEZj2kZBkrZOiVi0uo3fyLt0z2vJH1awe3EjzSt81vIR4pnIknbxfyjbltzpxZUw5S0GzGzxVf/pub?gid=914664171&single=true&output=csv";

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

  if (value.includes("critical")) return "#8B2E2E";

  if (value.includes("high")) return "#D18A2E";

  if (value.includes("elevated")) return "#B7FF00";

  return "#C8BEAB";
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
        radius:
  row.severity?.toLowerCase().includes("critical") ? 12 :
  row.severity?.toLowerCase().includes("high") ? 10 :
  row.severity?.toLowerCase().includes("elevated") ? 8 :
  6,
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
