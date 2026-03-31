export async function generateMapImage(lon, lat, width = 576, height = 99, mapType = 'Normal') {
  // Validate coordinates
  if (isNaN(lon) || isNaN(lat) || !lon || !lat) {
    return null;
  }

  const zoom = 17;
  const tileSize = 256;

  const x = (lon + 180) / 360 * Math.pow(2, zoom);
  const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);

  const tileX = Math.floor(x);
  const tileY = Math.floor(y);

  const pixelX = (x - tileX) * tileSize;
  const pixelY = (y - tileY) * tileSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');


  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, width, height);

  const centerTileDrawX = width / 2 - pixelX;
  const centerTileDrawY = height / 2 - pixelY;

  const tilePromises = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tx = tileX + dx;
      const ty = tileY + dy;

      const drawX = centerTileDrawX + dx * tileSize;
      const drawY = centerTileDrawY + dy * tileSize;

      if (drawX + tileSize > 0 && drawX < width && drawY + tileSize > 0 && drawY < height) {
        tilePromises.push(new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            ctx.drawImage(img, drawX, drawY, tileSize, tileSize);
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
          const tileUrl = mapType === 'Satellite' 
            ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`
            : `https://a.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
          img.src = tileUrl;
        }));
      }
    }
  }

  await Promise.all(tilePromises);


  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 3.5, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#4744efff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();


  const base64Data = canvas.toDataURL('image/png').split(',')[1];
  return base64Data;
}
