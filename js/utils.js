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

