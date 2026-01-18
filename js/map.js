// --------------------
// Map initialization
// --------------------
const map = L.map('map', {
  center: [44.0, 17.5], // Bosnia & Herzegovina
  zoom: 7,
  minZoom: 7
});

// Base map (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Move zoom control to bottom-right
map.zoomControl.setPosition('bottomright');

// --------------------
// GeoJSON layers
// --------------------

// Country outline (default visible)
const countryLayer = L.geoJSON(null, {
  style: {
    color: '#000',
    weight: 2,
    fill: false
  }
}).addTo(map);

// Entities
const entitiesLayer = L.geoJSON(null, {
  style: {
    color: '#1f78b4',
    weight: 2,
    fill: false
  }
});

// Cantons
const cantonsLayer = L.geoJSON(null, {
  style: {
    color: '#33a02c',
    weight: 1.5,
    fill: false
  }
});

// Municipalities
const municipalitiesLayer = L.geoJSON(null, {
  style: {
    color: '#33a02c',
    weight: 1.5,
    fill: false
  }
});

// Municipalities
const roadsLayer = L.geoJSON(null, {
  style: {
    color: '#33a02c',
    weight: 1.5,
    fill: false
  }
});

// Load GeoJSON data
fetch('data/bh_country.geojson')
  .then(r => r.json())
  .then(data => countryLayer.addData(data));

fetch('data/bh_entities.geojson')
  .then(r => r.json())
  .then(data => entitiesLayer.addData(data));

fetch('data/bh_cantons.geojson')
  .then(r => r.json())
  .then(data => cantonsLayer.addData(data));

fetch('data/bh_municipalities.geojson')
  .then(r => r.json())
  .then(data => municipalitiesLayer.addData(data));

// ====== Load Roads ======
fetch('data/bh_roads_filtered_noresid.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: feature => {
        const type = feature.properties.highway;
        let color = '#999', weight = 1;
        if (type === 'motorway') { color='#e31a1c'; weight=3; }
        else if (type==='primary') { color='#fd8d3c'; weight=2.5; }
        else if (type==='secondary') { color='#fecc5c'; weight=2; }
        else if (type==='tertiary') { color='#a1dab4'; weight=1.5; }
        else if (type==='residential') { color='#bbbbbb'; weight=1; }
        return { color, weight };
      }
    }).addTo(roadsLayer);
  });

// --------------------
// Layer control
// --------------------
L.control.layers(null, {
  "Country Outline": countryLayer,
  "Entities": entitiesLayer,
  "Cantons": cantonsLayer,
  "Municipalities": municipalitiesLayer,
  "Roads": roadsLayer
}).addTo(map);

// ====== Draw Control ======
// Create FeatureGroup for drawn layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Handle created layers
map.on(L.Draw.Event.CREATED, function (event) {
  const layer = event.layer;
  drawnItems.addLayer(layer);
});

// ====== Marker & Circle Panel ======
let lines = []; // store connected lines
let markers = [];
let tempMarker = null;

const togglePanelBtn = document.getElementById('togglePanelBtn');
const panelContent = document.getElementById('panelContent');
const latInput = document.getElementById('latInput');
const lngInput = document.getElementById('lngInput');
const markerNameInput = document.getElementById('markerName');
const circleRadiusSelect = document.getElementById('circleRadius');
const addMarkerBtn = document.getElementById('addMarkerBtn');
const markerList = document.getElementById('markerList');

panelContent.style.display = 'block'; // open by default

togglePanelBtn.addEventListener('click', () => {
  if (panelContent.style.display === 'none') {
    panelContent.style.display = 'block';
    togglePanelBtn.textContent = 'Markers & Circles ▼';
  } else {
    panelContent.style.display = 'none';
    togglePanelBtn.textContent = 'Markers & Circles ►';
  }
});

// ====== Map click fills coordinates & temp marker ======
map.on('click', (e) => {
  latInput.value = e.latlng.lat.toFixed(6);
  lngInput.value = e.latlng.lng.toFixed(6);

  if (tempMarker) tempMarker.setLatLng(e.latlng);
  else tempMarker = L.marker(e.latlng, { opacity: 0.6 }).addTo(drawnItems);
});

// ====== Add Marker & Circle ======
addMarkerBtn.addEventListener('click', () => {
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  const name = markerNameInput.value.trim();
  const radius = parseInt(circleRadiusSelect.value, 10); // NEW

  if (isNaN(lat) || isNaN(lng)) { alert('Enter valid coordinates'); return; }
  if (!name) { alert('Enter a name'); return; }

  // Place marker
  const marker = L.marker([lat, lng]).addTo(drawnItems)
    .bindPopup(`<b>${name}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);

  // Place circle only if radius > 0
  let circle = null;
  if (radius > 0) {
    circle = L.circle([lat, lng], { radius, color: 'blue', fillOpacity: 0.1 }).addTo(drawnItems);
  }

  markers.push({ name, marker, circle, lat, lng });
	// Update marker dropdowns
	function updateMarkerDropdowns() {
	  const select1 = document.getElementById('lineMarker1');
	  const select2 = document.getElementById('lineMarker2');
	
	  // Clear all options except the placeholder
	  [select1, select2].forEach(sel => {
	    const placeholder = sel.options[0].text;
	    sel.innerHTML = `<option value="">${placeholder}</option>`;
	  });
	
	  // Add current markers
	  markers.forEach((m, idx) => {
	    const option = `<option value="${idx}">${m.name}</option>`;
	    select1.innerHTML += option;
	    select2.innerHTML += option;
	  });
	}
	
	updateMarkerDropdowns();


  // Add to list
  const li = document.createElement('li');
  li.textContent = name;
  li.style.cursor = 'pointer';

  // Click to zoom
  li.addEventListener('click', () => {
    map.setView([lat, lng], 14);
    marker.openPopup();
  });

  // Right-click to delete marker and circle
	li.addEventListener('contextmenu', (e) => {
	  e.preventDefault();
	
	  // Remove marker and its circle
	  drawnItems.removeLayer(marker);
	  if (circle) drawnItems.removeLayer(circle);
	
	  // Remove all lines connected to this marker
	  lines.filter(l => l.marker1 == idx || l.marker2 == idx).forEach(l => {
	    drawnItems.removeLayer(l.line);
	    // Remove from list
	    Array.from(lineList.children).forEach(li => {
	      if (li.textContent.includes(markers[idx].name)) li.remove();
	    });
	  });
	  lines = lines.filter(l => l.marker1 != idx && l.marker2 != idx);
	
	  // Remove marker from markers array
	  li.remove();
	  markers = markers.filter(m => m.marker !== marker);
	
	  // Update dropdowns
	  updateMarkerDropdowns();
	});

  markerList.appendChild(li);

  // Clear input
  markerNameInput.value = '';
  if (tempMarker) { drawnItems.removeLayer(tempMarker); tempMarker = null; }
});

document.getElementById('connectMarkersBtn').addEventListener('click', () => {
  const idx1 = document.getElementById('lineMarker1').value;
  const idx2 = document.getElementById('lineMarker2').value;

  if (idx1 === "" || idx2 === "") {
    alert("Please select both markers");
    return;
  }
  if (idx1 === idx2) {
    alert("Cannot connect the same marker");
    return;
  }

  const m1 = markers[idx1].marker.getLatLng();
  const m2 = markers[idx2].marker.getLatLng();

  // Draw polyline between two markers
  const line = L.polyline([m1, m2], { color: 'red', weight: 2 }).addTo(drawnItems);

  // Optional: store line if needed
	addLineToList(idx1, idx2, line);
});

const lineList = document.getElementById('lineList');

function addLineToList(idx1, idx2, line) {
  const li = document.createElement('li');
  li.textContent = `${markers[idx1].name} ↔ ${markers[idx2].name}`;
  li.style.cursor = 'pointer';

  // Right-click to delete line
  li.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    drawnItems.removeLayer(line);
    li.remove();
    lines = lines.filter(l => l.line !== line);
  });

  lineList.appendChild(li);
}

