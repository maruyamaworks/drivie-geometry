import geobuf from 'geobuf';
import Pbf from 'pbf';
import simplify from 'simplify-geometry';
import { encode } from '@mapbox/polyline';
import { parse as parseDateString } from 'date-fns';
import { parseStringPromise } from 'xml2js';
import { gzipSync, unzipSync } from 'zlib';

interface Track {
  departure_time: Date;
  overview_polyline: string;
  geometry: {
    type: 'LineString';
    coordinates: (number | null)[][];
  };
}

const tolerance = 0.00001;

export async function detect(text: string): Promise<Track|null> {
  if (text.startsWith('"Name","Activity type","Description"\n') || text.startsWith('"名前","活動タイプ","説明"\n')) {
    return parseMyTracksCSV(text);
  }
  if (text.includes('<gpx') || text.includes('<GPX')) {
    return await parseGPX(text);
  }
  if (text.includes('$GPGGA') && text.includes('$GPRMC')) {
    return parseNMEA(text);
  }
  return null;
}

export function parseMyTracksCSV(text: string): Track {
  const rows = text.split(/\r?\n/).slice(4).filter(Boolean);
  const data = rows.map(row => row.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1')));
  const departure = new Date(data[0][8]);
  const coordinates = data.map((point: string[]) => [
    /* longitude */ Number.isNaN(parseFloat(point[3])) ? null : parseFloat(point[3]),
    /* latitude  */ Number.isNaN(parseFloat(point[2])) ? null : parseFloat(point[2]),
    /* altitude  */ Number.isNaN(parseFloat(point[4])) ? null : parseFloat(point[4]),
    /* timestamp */ (+new Date(point[8]) - +departure) / 1000,
  ]);

  return {
    departure_time: departure,
    overview_polyline: encode(simplify(coordinates, tolerance).map(([lng, lat]) => [lat, lng])),
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

export async function parseGPX(text: string): Promise<Track> {
  const parsed = await parseStringPromise(text);
  const data = parsed.gpx.trk[0].trkseg[0].trkpt;
  const departure = new Date(data[0].time[0]);
  const coordinates = data.map((point: any) => [
    /* longitude */ Number.isNaN(parseFloat(point.$.lon)) ? null : parseFloat(point.$.lon),
    /* latitude  */ Number.isNaN(parseFloat(point.$.lat)) ? null : parseFloat(point.$.lat),
    /* altitude  */ Number.isNaN(parseFloat(point.ele[0])) ? null : parseFloat(point.ele[0]),
    /* timestamp */ (+new Date(point.time[0]) - +departure) / 1000,
  ]);

  return {
    departure_time: departure,
    overview_polyline: encode(simplify(coordinates, tolerance).map(([lng, lat]) => [lat, lng])),
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

function convertLatLng(value: number, orientation: string): number {
  const degrees = Math.floor(value / 100) + (value % 100) / 60;
  if (orientation === 'N' || orientation === 'E') {
    return degrees;
  }
  if (orientation === 'S' || orientation === 'W') {
    return degrees * (-1);
  }
  return 0;
}

export function parseNMEA(text: string): Track {
  const GPRMC = text.split(/\r?\n/).find(line => line.startsWith('$GPRMC,')) || '';
  const GPGGA = text.split(/\r?\n/).filter(line => line.startsWith('$GPGGA,'));

  const data = GPGGA.map(line => line.split(','));
  const departure = parseDateString(`${GPRMC.split(',')[9]} ${GPRMC.split(',')[1]}`, 'ddMMyy HHmmss.SSS', new Date());
  const coordinates = data.map((point: string[]) => {
    let timestamp = +parseDateString(point[1], 'HHmmss.SSS', departure) - +departure;
    while (timestamp < 0) {
      timestamp += 86400000;
    }
    return [
      /* longitude */ convertLatLng(parseFloat(point[4]), point[5]),
      /* latitude  */ convertLatLng(parseFloat(point[2]), point[3]),
      /* altitude  */ Number.isNaN(parseFloat(point[9])) ? null : parseFloat(point[9]),
      /* timestamp */ timestamp / 1000,
    ];
  });

  return {
    departure_time: departure,
    overview_polyline: encode(simplify(coordinates, tolerance).map(([lng, lat]) => [lat, lng])),
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

export function compress(geometry: any): Buffer {
  return gzipSync(geobuf.encode(geometry, new Pbf()));
}

export function decompress(geometry: Buffer): any {
  return geobuf.decode(new Pbf(unzipSync(geometry)));
}
