function parseRRGGBBAA(hex) {
  if (!/^[0-9a-fA-F]{8}$/.test(hex)) return null;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = parseInt(hex.slice(6, 8), 16) / 255;

  return {
    stroke: `rgb(${r},${g},${b})`,
    fill: `rgba(${r},${g},${b},${a})`,
    fillOpacity: a
  };
}

function formatDistance(meters) {
  return meters >= 1000
    ? (meters / 1000).toFixed(2) + ' km'
    : Math.round(meters) + ' m';
}

function updateLocalStorage() {
	let cleanMarkers = markers.map(marker => ({
		name: marker.name,
		radius: marker.radius,
		lat: marker.lat,
		lng: marker.lng,
		color: marker.color
	}));
	localStorage.setItem("markers", JSON.stringify(cleanMarkers));
	let cleanLines = lines.map(line => ({
	  marker1: line.marker1,
	  marker2: line.marker2
	}));
	localStorage.setItem("lines", JSON.stringify(cleanLines));
}

function loadLocalStorage() {
	let cleanMarkers = JSON.parse(localStorage.getItem("markers")) || [];
	markers = cleanMarkers.map(marker => {
		let m = placeMarker(marker.lat, marker.lng, marker.name);
		let c = marker.radius > 0 ? placeCircle(marker.lat, marker.lng, marker.radius, marker.color) : null;
		addMarkerToList(m, marker.name, c);
		return {
			name: marker.name,
			marker: m,
			circle: c,
			radius: marker.radius,
			lat: marker.lat,
			lng: marker.lng,
			color: marker.color
		}
	});
	let cleanLines = JSON.parse(localStorage.getItem("lines")) || [];
	lines = cleanLines.map(line => {
		let idx1 = markers.findIndex(m => m.name === line.marker1);
		let idx2 = markers.findIndex(m => m.name === line.marker2);
		if(idx1 == -1 || idx2 == -1) return null;
		
	  const m1 = markers[idx1].marker.getLatLng();
	  const m2 = markers[idx2].marker.getLatLng();
		const distanceMeters = m1.distanceTo(m2);
		let l = placeLine(m1, m2, distanceMeters);
		addLineToList(idx1, idx2, l, distanceMeters);
		return {
	  	marker1: line.marker1,
	  	marker2: line.marker2,
			line: l,
	  	distance: distanceMeters
		}
	}).filter(line => line != null);
	updateMarkerDropdowns();
}
