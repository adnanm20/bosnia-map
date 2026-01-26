const drawnItems = new L.FeatureGroup();
const latInput = document.getElementById('latInput');
const lngInput = document.getElementById('lngInput');
const markerNameInput = document.getElementById('markerName');
const circleRadiusSelect = document.getElementById('circleRadius');
const markerList = document.getElementById('markerList');
const lineList = document.getElementById('lineList');
let lines = [];
let markers = [];
let tempMarker = null;

function main() {
	loadLocalStorage();
	if(loadFromURL()) {
		window.location = window.location.href.split("?")[0];
	}
	addEventListeners();
	let map = initializeMap();
	let layers = createLayers(map);
	loadGeoJSONdata(layers);
	addLayersToMap(map, layers);
}
main();

function loadFromURL() { // TODO: add confirmation screen
	if (window.location.search == '') return false;
	const searchParams = new URLSearchParams(window.location.search);
	if (searchParams.has('markers')) {
		let mks = searchParams.get('markers').split(';');
		for(m of mks) {
			// name|lat|lng|rad|color
			if(!(/^\w+\|[\d+\.]+\|[\d+\.]+\|\d+\|\w+$/.test(m))) continue;
			let marker = m.split('|');
			if(markers.findIndex(mr => m.name === marker[0]) != -1) continue; // TODO: add renaming to confirmation screen
			markers.push({
				name: marker[0],
				lat: Number(marker[1]),
				lng: Number(marker[2]),
				radius: Number(marker[3]),
				color: marker[4]
			});
		}
	}
	if (searchParams.has('lines')) {
		let lns = searchParams.get('lines').split(';');
		for(l of lns) {
			// name|name
			if(!(/^\w+\|\w+$/.test(l))) continue;
			let line = l.split('|');
			if(markers.findIndex(mr => mr.name == line[0]) == -1) continue;
			if(markers.findIndex(mr => mr.name == line[1]) == -1) continue;
			lines.push({
				marker1: line[0],
				marker2: line[1]
			});
		}
	}
	updateLocalStorage();
	return true;
}

function initializeMap() {
	const map = L.map('map', {
	  center: [44.0, 17.5], // Bosnia & Herzegovina
		maxBounds: [[37.640335,0],[49.553726,35.826416]],
	  zoom: 7,
	  minZoom: 7
	});
	L.control.scale({
		imperial: false
	}).addTo(map);
	
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	  attribution: '&copy; OpenStreetMap contributors'
	}).addTo(map);
	
	map.zoomControl.setPosition('bottomright');

	map.on('click', fillCoordinateFields);

	map.addLayer(drawnItems);
	
	map.on(L.Draw.Event.CREATED, function (event) {
	  const layer = event.layer;
	  drawnItems.addLayer(layer);
	});

	return map;
}

function createLayers(map) {
	let layers = {};
	layers[COUNTRY_LAYER] = L.geoJSON(null, {
	  style: {
	    color: '#000',
	    weight: 2,
	    fill: false
	  }
	}).addTo(map);
	
	layers[ENTITIES_LAYER] = L.geoJSON(null, {
	  style: {
	    color: '#1f78b4',
	    weight: 2,
	    fill: false
	  }
	});
	
	layers[CANTONS_LAYER] = L.geoJSON(null, {
	  style: {
	    color: '#33a02c',
	    weight: 1.5,
	    fill: false
	  }
	});
	
	layers[MUNICIPALITIES_LAYER] = L.geoJSON(null, {
	  style: {
	    color: '#33a02c',
	    weight: 1.5,
	    fill: false
	  }
	});
	
	layers[ROADS_LAYER] = L.geoJSON(null, {
	  style: {
	    color: '#33a02c',
	    weight: 1.5,
	    fill: false
	  }
	});

	return layers;
}

function loadGeoJSONdata(layers) {
	fetch('data/bh_country.geojson')
	  .then(r => r.json())
	  .then(data => layers[COUNTRY_LAYER].addData(data));
	
	fetch('data/bh_entities.geojson')
	  .then(r => r.json())
	  .then(data => layers[ENTITIES_LAYER].addData(data));
	
	fetch('data/bh_cantons.geojson')
	  .then(r => r.json())
	  .then(data => layers[CANTONS_LAYER].addData(data));
	
	fetch('data/bh_municipalities.geojson')
	  .then(r => r.json())
	  .then(data => layers[MUNICIPALITIES_LAYER].addData(data));
	
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
	    }).addTo(layers[ROADS_LAYER]);
	  });
}

function addLayersToMap(map, layers) {
	L.control.layers(null, {
	  "Country Outline": layers[COUNTRY_LAYER],
	  "Entities": layers[ENTITIES_LAYER],
	  "Cantons": layers[CANTONS_LAYER],
	  "Municipalities": layers[MUNICIPALITIES_LAYER],
	  "Roads": layers[ROADS_LAYER]
	}, { position: "bottomleft" }).addTo(map);
}

function placeCircle(lat, lng, radius, color) {
	const parsed = parseRRGGBBAA(color);
	circle = L.circle([lat, lng], {
	  radius,
	  color: parsed.stroke,
	  fillColor: parsed.fill,
	  fillOpacity: parsed.fillOpacity
	}).addTo(drawnItems);
	return circle;
}

function updateMarkerDropdowns() {
  const select1 = document.getElementById('lineMarker1');
  const select2 = document.getElementById('lineMarker2');

  [select1, select2].forEach(sel => {
    const placeholder = sel.options[0].text;
    sel.innerHTML = `<option value="">${placeholder}</option>`;
  });

  markers.forEach((m, idx) => {
    const option = `<option value="${m.name}">${m.name}</option>`;
    select1.innerHTML += option;
    select2.innerHTML += option;
  });
}

function placeMarker(lat, lng, name) {
	return L.marker([lat, lng]).addTo(drawnItems)
  	.bindPopup(`<b>${name}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
}

function addMarkerToList(marker, name, circle) {
	const li = document.createElement('li');
	li.style.cursor = 'pointer';
	
	li.innerHTML = `
	  <div style="display:flex; flex-direction:column; gap:4px;">
	    <strong>${name}</strong>
	    ${circle ? `
	      <input
	        type="text"
	        value="${CIRCLE_DEFAULT_COLOR}"
	        maxlength="8"
	        placeholder="rrggbbaa"
	        style="font-family:monospace; padding:4px;"
	      >
	    ` : ''}
	  </div>
	`;

	if (circle) {
	  const colorInput = li.querySelector('input');
	
	  colorInput.addEventListener('input', () => {
	    const value = colorInput.value.trim();
	    const parsed = parseRRGGBBAA(value);
	
	    if (!parsed) {
	      colorInput.style.borderColor = 'red';
	      return;
	    }
	
	    colorInput.style.borderColor = '';
	    markers.find(m => m.circle === circle).color = value;
	
	    circle.setStyle({
	      color: parsed.stroke,
	      fillColor: parsed.fill,
	      fillOpacity: parsed.fillOpacity
	    });
	  });
	}

  li.addEventListener('click', () => {
    map.setView([lat, lng], 14);
    marker.openPopup();
  });

	li.addEventListener('contextmenu', (e) => {
	  e.preventDefault();
	
	  drawnItems.removeLayer(marker);
	  if (circle) drawnItems.removeLayer(circle);
	
	  lines.filter(l => l.marker1 == name || l.marker2 == name).forEach(l => {
			console.log(l);
	    drawnItems.removeLayer(l.line);
	    Array.from(lineList.children).forEach(li => {
	      if (li.textContent.includes(name)) li.remove();
	    });
	  });
	  lines = lines.filter(l => l.marker1 != name && l.marker2 != name);
	
	  li.remove();
	  markers = markers.filter(m => m.marker !== marker);
		updateLocalStorage();
	
	  updateMarkerDropdowns();
	});

  markerList.appendChild(li);
}
	
function addLineToList(idx1, idx2, line, distanceMeters) {
  const li = document.createElement('li');
	li.textContent = `${markers[idx1].name} ↔ ${markers[idx2].name} (${formatDistance(distanceMeters)})`;
  li.style.cursor = 'pointer';

  li.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    drawnItems.removeLayer(line);
    li.remove();
    lines = lines.filter(l => l.line !== line);
		updateLocalStorage();
  });

	li.addEventListener('click', () => {
	  map.fitBounds(line.getBounds(), { padding: [20, 20] });
	  line.openPopup();
	});


  lineList.appendChild(li);
}

function placeLine(m1, m2, distanceMeters) {
	const line = L.polyline([m1, m2], {
	  color: 'red',
	  weight: 3
	}).addTo(drawnItems);
	
	line.bindPopup(`Distance: ${formatDistance(distanceMeters)}`);

	return line;
}

function fillCoordinateFields(e) {
	latInput.value = e.latlng.lat.toFixed(6);
	lngInput.value = e.latlng.lng.toFixed(6);
	
	if (tempMarker) tempMarker.setLatLng(e.latlng);
	else tempMarker = L.marker(e.latlng, { opacity: 0.6 }).addTo(drawnItems);
}

function addEventListeners() {
	const panelContent = document.getElementById('panelContent');
	panelContent.style.display = 'block';
	document.getElementById('togglePanelBtn').addEventListener('click', () => {
	  if (panelContent.style.display === 'none') {
	    panelContent.style.display = 'block';
	    togglePanelBtn.textContent = 'Markers & Circles ▼';
	  } else {
	    panelContent.style.display = 'none';
	    togglePanelBtn.textContent = 'Markers & Circles ►';
	  }
	});
	
	document.getElementById('connectMarkersBtn').addEventListener('click', () => {
	  const name1 = document.getElementById('lineMarker1').value;
	  const name2 = document.getElementById('lineMarker2').value;

		let idx1 = markers.findIndex(m => m.name === name1);
		let idx2 = markers.findIndex(m => m.name === name2);
	
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
	
		const distanceMeters = m1.distanceTo(m2);
	
		let line = placeLine(m1, m2, distanceMeters);
		
		lines.push({
		  marker1: name1,
		  marker2: name2,
		  line,
		  distance: distanceMeters
		});
		updateLocalStorage();
		
		addLineToList(idx1, idx2, line, distanceMeters);
	});
	
	document.getElementById('addMarkerBtn').addEventListener('click', () => {
	  const lat = parseFloat(latInput.value);
	  const lng = parseFloat(lngInput.value);
	  const name = markerNameInput.value.trim();
	  const radius = parseInt(circleRadiusSelect.value, 10);
	
	  if (isNaN(lat) || isNaN(lng)) { alert('Enter valid coordinates'); return; }
	  if (!name) { alert('Enter a name'); return; }
	  if (markers.findIndex(m => m.name === name) != -1) { alert('Marker names have to be unique'); return; }
	  if (!(/\w+/.test(name))) { alert('Name can only contain letters and numbers'); return; }
	
	  const marker = placeMarker(lat, lng, name);
	
		let circle = radius > 0 ? placeCircle(lat, lng, radius, CIRCLE_DEFAULT_COLOR) : null;
	
		markers.push({
		  name,
		  marker,
		  circle,
			radius,
		  lat,
		  lng,
		  color: CIRCLE_DEFAULT_COLOR
		});
		updateLocalStorage();
	
		updateMarkerDropdowns();
	
		addMarkerToList(marker, name, circle);
	
	  markerNameInput.value = '';
	  if (tempMarker) { drawnItems.removeLayer(tempMarker); tempMarker = null; }
	});
	
	document.getElementById('shareBtn').addEventListener('click', () => {
		let shareUrl = window.location.href + "?markers=";

		for(marker of markers) {
			shareUrl += `${marker.name}|${marker.lat}|${marker.lng}|${marker.radius}|${marker.color};`
		}

		shareUrl += "&lines=";

		for(line of lines) {
			shareUrl += `${line.marker1}|${line.marker2};`
		}

  	navigator.clipboard.writeText(shareUrl);
		alert("Url copied to clipboard");
	});

	document.getElementById('clearBtn').addEventListener('click', () => {
		markers = [];
		lines = [];
		markerList.innerHTML = '';
		lineList.innerHTML = '';
		drawnItems.clearLayers();
		updateMarkerDropdowns();
		updateLocalStorage();
	});
}
