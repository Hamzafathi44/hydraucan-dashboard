import proj4 from 'proj4';

proj4.defs(
  'EPSG:26191',
  '+proj=lcc +lat_1=33.3 +lat_2=32.3 +lat_0=33.3 +lon_0=-5.4 ' +
  '+x_0=500000 +y_0=300000 +a=6378249.2 +b=6356515 +towgs84=31,146,47,0,0,0,0 ' +
  '+units=m +no_defs'
);

export const wgs84ToLambertMarocZone1 = (lat, lng) => {
  const [x, y] = proj4('EPSG:4326', 'EPSG:26191', [lng, lat]);
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2))
  };
};