# @drivie/geometry

A lightweight and efficient JavaScript library for parsing, simplifying, encoding, and compressing geospatial track data.

Supports multiple GPS data formats including **MyTracks CSV**, **GPX**, and **NMEA**.

## Installation

```bash
npm install @drivie/geometry
```

## Usage

### Compress and Decompress Geometry

Compresses and decompresses geometries using [geobuf](https://github.com/mapbox/geobuf) and Gzip for efficient storage and transmission.

```ts
import { compress, decompress } from '@drivie/geometry';

const geometry = {
  type: 'LineString',
  coordinates: [
    [11.638033333333333, 34.21195000000000, 553.0, 1.000],
    [11.638016666666665, 34.21195000000000, 552.5, 3.000],
    [11.637983333333333, 34.21196666666666, 552.5, 5.000],
  ],
};

const compressed = compress(geometry);
const decompressed = decompress(compressed);
assert.deepEqual(geometry, decompressed);
```

### Parse MyTracks CSV

```ts
import { parseMyTracksCSV } from '@drivie/geometry';

const data = `"Name","Activity type","Description"
"6/18/2016 10:58","driving",""

"Segment","Point","Latitude (deg)","Longitude (deg)","Altitude (m)","Bearing (deg)","Accuracy (m)","Speed (m/s)","Time","Power (W)","Cadence (rpm)","Heart rate (bpm)"
"1","1","37.75429","140.457896","104.0","1.0","5","0.52","2016-06-18T01:58:05.503Z","","",""
"1","2","37.754369","140.457894","107.0","0.0","5","2.17","2016-06-18T01:58:12.539Z","","",""
"1","3","37.754388","140.457893","108.0","356.0","5","1.99","2016-06-18T01:58:13.491Z","","",""
"1","4","37.754469","140.457907","106.0","26.0","6","1.7","2016-06-18T01:58:18.531Z","","",""
"1","5","37.75448","140.457922","106.0","44.0","7","1.71","2016-06-18T01:58:19.494Z","","",""
`;

const result: Track = parseMyTracksCSV(data);
assert.deepEqual(result.departure_time, new Date('2016-06-18T01:58:05.503Z'));
assert.deepEqual(result.overview_polyline, 'i{leF{dhxYO@C?OCAA');
assert.deepEqual(result.geometry, {
  type: 'LineString',
  coordinates: [
    [140.457896, 37.754290, 104.0,  0.000],
    [140.457894, 37.754369, 107.0,  7.036],
    [140.457893, 37.754388, 108.0,  7.988],
    [140.457907, 37.754469, 106.0, 13.028],
    [140.457922, 37.754480, 106.0, 13.991],
  ],
});
```

### Parse GPX

```ts
import { parseGPX } from '@drivie/geometry';

const data = `<?xml version='1.0' encoding='UTF-8' standalone='no' ?>
<gpx creator="jp.drivie.recorder" version="1.1">
  <trk>
    <name>5/11/2019 19:58</name>
    <trkseg>
      <trkpt lat="35.690184" lon="139.70149"><ele>83.1</ele><time>2019-05-11T19:58:24+0900</time></trkpt>
      <trkpt lat="35.690175" lon="139.701505"><ele>83.3</ele><time>2019-05-11T19:58:27+0900</time></trkpt>
      <trkpt lat="35.690167" lon="139.701501"><ele>83.3</ele><time>2019-05-11T19:58:29+0900</time></trkpt>
      <trkpt lat="35.690099" lon="139.701291"><ele>82.4</ele><time>2019-05-11T19:58:33+0900</time></trkpt>
      <trkpt lat="35.690131" lon="139.701363"><ele>83.3</ele><time>2019-05-11T19:58:35+0900</time></trkpt>
    </trkseg>
  </trk>
</gpx>
`;

const result: Track = await parseGPX(data);
assert.deepEqual(result.departure_time, new Date('2019-05-11T10:58:24.000Z'));
assert.deepEqual(result.overview_polyline, 'svyxEimtsY?C@@Lh@EM');
assert.deepEqual(result.geometry, {
  type: 'LineString',
  coordinates: [
    [139.701490, 35.690184, 83.1,  0.000],
    [139.701505, 35.690175, 83.3,  3.000],
    [139.701501, 35.690167, 83.3,  5.000],
    [139.701291, 35.690099, 82.4,  9.000],
    [139.701363, 35.690131, 83.3, 11.000],
  ],
});
```

### Parse NMEA

```ts
import { parseNMEA } from '@drivie/geometry';

const data = `$PGRMM,WGS 84*06
$GPBOD,000.6,T,000.0,M,CB,AC*42
$GPWPL,4806.712,N,01138.293,E,BB*46
$GPRMC,133716,A,3412.717,N,01138.282,E,000.0,185.1,140900,000.6,E*7B
$GPRMB,A,0.00,R,AC,CB,3412.999,N,01138.290,E,000.3,001.1,,V*06
$GPGGA,133717,3412.717,N,01138.282,E,1,05,3.9,553.0,M,46.8,M,,*4F
$GPGSA,A,3,05,,18,21,25,,29,,,,,,5.6,3.9,4.0*3C
$GPGSV,2,1,08,05,18,052,48,16,22,303,00,18,63,159,44,21,62,175,49*7A
$GPGSV,2,2,08,25,25,127,40,26,53,299,00,29,54,061,51,31,43,231,00*7D
$PGRME,38.9,M,40.2,M,55.9,M*13
$GPGLL,3412.717,N,01138.281,E,133717,A*22
$PGRMZ,1815,f,3*26
$PGRMM,WGS 84*06
$GPBOD,000.6,T,000.0,M,CB,AC*42
$GPRTE,1,1,c,0,AC,CB,BB*28
$GPWPL,4804.712,N,01138.270,E,AC*4B
$GPRMC,133718,A,3412.717,N,01138.281,E,000.0,185.1,140900,000.6,E*76
$GPRMB,A,0.00,R,AC,CB,3412.999,N,01138.290,E,000.3,001.3,,V*04
$GPGGA,133719,3412.717,N,01138.281,E,1,05,3.9,552.5,M,46.8,M,,*46
$GPGSA,A,3,05,,18,21,25,,29,,,,,,5.6,3.9,4.0*3C
$GPGSV,2,1,08,05,18,052,48,16,22,303,00,18,63,159,44,21,62,175,49*7A
$GPGSV,2,2,08,25,24,128,40,26,53,299,00,29,54,061,51,31,43,231,00*73
$PGRME,38.9,M,40.2,M,55.9,M*13
$GPGLL,3412.717,N,01138.281,E,133719,A*2C
$PGRMZ,1813,f,3*20
$PGRMM,WGS 84*06
$GPBOD,000.6,T,000.0,M,CB,AC*42
$GPWPL,3412.999,N,01138.290,E,CB*4A
$GPRMC,133720,A,3412.718,N,01138.279,E,000.0,185.1,140900,000.6,E*75
$GPRMB,A,0.00,R,AC,CB,3412.999,N,01138.290,E,000.3,001.5,,V*02
$GPGGA,133721,3412.718,N,01138.279,E,1,05,3.9,552.5,M,46.8,M,,*45
$GPGSA,A,3,05,,18,21,25,,29,,,,,,5.6,3.9,4.0*3C
$GPGSV,2,1,08,05,18,052,48,16,22,303,00,18,63,159,44,21,62,175,49*7A
`;

const result: Track = parseNMEA(data);
assert.deepEqual(result.departure_time, new Date('2000-09-14T13:37:16.000Z'));
assert.deepEqual(result.overview_polyline, 'u_yoEu``fACH');
assert.deepEqual(result.geometry, {
  type: 'LineString',
  coordinates: [
    [11.638033333333333, 34.21195000000000, 553.0, 1.000],
    [11.638016666666665, 34.21195000000000, 552.5, 3.000],
    [11.637983333333333, 34.21196666666666, 552.5, 5.000],
  ],
});
```

### Automatically Detect and Parse Any Supported Format

```ts
import { detect } from '@drivie/geometry';

const result: Track | null = await detect(data);

if (result) {
  console.log(result.departure_time);
  console.log(result.overview_polyline);
  console.log(result.geometry);
} else {
  throw new Error('Unsupported format');
}
```

## Track Object Format

```ts
interface Track {
  departure_time: Date;
  overview_polyline: string;
  geometry: {
    type: 'LineString';
    coordinates: (number | null)[][];
  };
}
```

- `departure_time`: Start time of the track.
- `overview_polyline`: Simplified polyline (encoded in [Google Maps Polyline Encoding](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)).
- `geometry.coordinates`: Array of `[longitude, latitude, altitude, timestamp]`.

## License

MIT
