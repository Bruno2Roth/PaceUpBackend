import ActivityService from './ActivityService.js';

export class FileImportService {
  constructor() {
    this.activityService = new ActivityService();
  }

  async importGpx(userId, fileBuffer, originalName) {
    const content = fileBuffer.toString('utf8');
    const parsed = this.parseGpx(content);
    if (!parsed) {
      const err = new Error('Invalid GPX file');
      err.status = 400;
      throw err;
    }
    return this.activityService.importActivities(userId, [parsed]);
  }

  async importFit(userId, fileBuffer, originalName) {
    const parsed = this.parseFit(fileBuffer);
    if (!parsed) {
      const err = new Error('Invalid FIT file');
      err.status = 400;
      throw err;
    }
    return this.activityService.importActivities(userId, [parsed]);
  }

  async importTcx(userId, fileBuffer, originalName) {
    const content = fileBuffer.toString('utf8');
    const parsed = this.parseTcx(content);
    if (!parsed) {
      const err = new Error('Invalid TCX file');
      err.status = 400;
      throw err;
    }
    return this.activityService.importActivities(userId, [parsed]);
  }

  parseGpx(xmlContent) {
    try {
      const json = this.parseXml(xmlContent);
      if (!json) return null;

      const gpx = json.gpx || json.GPX;
      if (!gpx) return null;

      const tracks = gpx.trk || gpx.Trk || [];
      const track = Array.isArray(tracks) ? tracks[0] : tracks;
      if (!track) return null;

      const segments = track.trkseg || track.Trkseg || [];
      const segment = Array.isArray(segments) ? segments[0] : segments;
      if (!segment) return null;

      const points = Array.isArray(segment.trkpt || segment.Trkpt) ? segment.trkpt || segment.Trkpt : [];
      const gpsData = points.map(p => {
        const attrs = p._attributes || p.$ || {};
        const ext = this.getExtensions(p);
        return {
          lat: parseFloat(attrs.lat || 0),
          lng: parseFloat(attrs.lon || 0),
          elevation: ext.ele ? parseFloat(ext.ele) : null,
          timestamp: ext.time || null,
          heartrate: ext.hr ? parseInt(ext.hr, 10) : null,
        };
      }).filter(p => p.lat && p.lng);

      if (gpsData.length < 2) return null;

      const name = this.getText(track.name) || this.getText(track.Name) || 'GPX Import';
      const startTime = gpsData[0].timestamp || null;
      const endTime = gpsData[gpsData.length - 1].timestamp || null;

      return {
        title: name,
        activity_type: 'running',
        gps_data: gpsData,
        start_time: startTime || new Date().toISOString(),
        end_time: endTime || new Date().toISOString(),
        source: 'gpx_import',
      };
    } catch {
      return null;
    }
  }

  parseTcx(xmlContent) {
    try {
      const json = this.parseXml(xmlContent);
      if (!json) return null;

      const trainingCenter = json.TrainingCenterDatabase || json.trainingCenterDatabase;
      if (!trainingCenter) return null;

      const activities = trainingCenter.Activities || trainingCenter.activities || [];
      const activityFolder = Array.isArray(activities) ? activities[0] : activities;
      const activityList = activityFolder?.Activity || activityFolder?.activity || [];
      const activity = Array.isArray(activityList) ? activityList[0] : activityList;
      if (!activity) return null;

      const sport = activity._attributes?.Sport || activity.$.Sport || 'Running';
      const laps = activity.Lap || activity.lap || [];
      const lap = Array.isArray(laps) ? laps[0] : laps;

      const points = [];
      const allLaps = Array.isArray(laps) ? laps : [laps];
      for (const l of allLaps) {
        const track = l.Track || l.track || [];
        const trackPoints = Array.isArray(track) ? track : [track];
        for (const tp of trackPoints) {
          const pt = tp.Trackpoint || tp.trackpoint || [];
          const pts = Array.isArray(pt) ? pt : [pt];
          for (const p of pts) {
            const pos = p.Position || p.position || {};
            const lat = this.getText(pos.LatitudeDegrees || pos.latitudeDegrees);
            const lon = this.getText(pos.LongitudeDegrees || pos.longitudeDegrees);
            if (lat && lon) {
              points.push({
                lat: parseFloat(lat),
                lng: parseFloat(lon),
                elevation: this.getText(p.AltitudeMeters || p.altitudeMeters) ? parseFloat(this.getText(p.AltitudeMeters || p.altitudeMeters)) : null,
                timestamp: this.getText(p.Time || p.time) || null,
                heartrate: this.getText(p.HeartRateBpm?.Value || p.heartRateBpm?.value) ? parseInt(this.getText(p.HeartRateBpm?.Value || p.heartRateBpm?.value), 10) : null,
              });
            }
          }
        }
      }

      if (points.length < 2) {
        const gpsData = this.buildGpsFromLaps(laps);
        if (!gpsData) return null;
        return {
          title: this.getText(activity.Name || activity.name) || 'TCX Import',
          activity_type: this.mapTcxSport(sport),
          distance_m: this.getText(lap.DistanceMeters || lap.distanceMeters) ? Math.round(parseFloat(this.getText(lap.DistanceMeters || lap.distanceMeters))) : 0,
          duration_seconds: lap.TotalTimeSeconds || lap.totalTimeSeconds ? Math.round(parseFloat(this.getText(lap.TotalTimeSeconds || lap.totalTimeSeconds))) : 0,
          start_time: this.getText(lap.StartTime || lap.startTime) || new Date().toISOString(),
          elevation_gain_m: null,
          average_heartrate: null,
          max_heartrate: null,
          calories_burned: lap.Calories || lap.calories ? Math.round(parseFloat(this.getText(lap.Calories || lap.calories))) : null,
          source: 'tcx_import',
        };
      }

      return {
        title: this.getText(activity.Name || activity.name) || 'TCX Import',
        activity_type: this.mapTcxSport(sport),
        gps_data: points,
        start_time: points[0].timestamp || new Date().toISOString(),
        end_time: points[points.length - 1].timestamp || new Date().toISOString(),
        source: 'tcx_import',
      };
    } catch {
      return null;
    }
  }

  buildGpsFromLaps(laps) {
    if (!Array.isArray(laps) || laps.length === 0) return null;
    const points = [];
    for (const lap of laps) {
      const track = lap.Track || lap.track || [];
      const trackpoints = Array.isArray(track) ? track : [track];
      for (const tp of trackpoints) {
        const pts = tp.Trackpoint || tp.trackpoint || [];
        const arr = Array.isArray(pts) ? pts : [pts];
        for (const p of arr) {
          const pos = p.Position || p.position || {};
          const lat = this.getText(pos.LatitudeDegrees || pos.latitudeDegrees);
          const lon = this.getText(pos.LongitudeDegrees || pos.longitudeDegrees);
          if (lat && lon) {
            points.push({
              lat: parseFloat(lat),
              lng: parseFloat(lon),
              elevation: this.getText(p.AltitudeMeters || p.altitudeMeters) ? parseFloat(this.getText(p.AltitudeMeters || p.altitudeMeters)) : null,
              timestamp: this.getText(p.Time || p.time) || null,
            });
          }
        }
      }
    }
    return points.length >= 2 ? points : null;
  }

  mapTcxSport(sport) {
    const map = {
      Running: 'running',
      Biking: 'cycling',
      Cycling: 'cycling',
      Other: 'other',
      Walking: 'walking',
      Hiking: 'hiking',
    };
    return map[sport] || 'running';
  }

  parseFit(buffer) {
    try {
      const headerSize = buffer.readUInt8(0);
      const protocolVersion = buffer.readUInt8(1);
      const profileVersion = buffer.readUInt16LE(2);
      const bodySize = buffer.readUInt32LE(4);
      const dataType = buffer.toString('ascii', 8, 12);

      if (dataType !== '.FIT') return null;

      return this.extractFitData(buffer, headerSize, bodySize);
    } catch {
      return null;
    }
  }

  extractFitData(buffer, headerSize, bodySize) {
    let offset = headerSize;
    const end = headerSize + bodySize;

    let startTime = null;
    let endTime = null;
    let totalDistance = 0;
    let totalDuration = 0;
    let avgHeartRate = null;
    let maxHeartRate = 0;
    let totalCalories = 0;
    let totalAscent = 0;
    let sportType = 'running';
    const gpsData = [];

    while (offset < end) {
      const recordHeader = buffer.readUInt8(offset);
      const isDefinition = (recordHeader & 0x40) !== 0;
      const messageType = recordHeader & 0x1F;

      if (isDefinition) {
        offset = this.skipDefinitionMessage(buffer, offset);
      } else {
        offset = this.skipDataMessage(buffer, offset);
      }
    }

    const fields = {};
    offset = headerSize;

    while (offset < end) {
      const recordHeader = buffer.readUInt8(offset);
      const isDefinition = (recordHeader & 0x40) !== 0;
      const messageType = recordHeader & 0x1F;
      const isDeveloper = (recordHeader & 0x20) !== 0;

      if (isDefinition) {
        const localMsgType = messageType;
        const architecture = (buffer.readUInt8(offset + 5) === 0) ? 'little' : 'big';
        const globalMsgNum = (architecture === 'little') ?
          buffer.readUInt16LE(offset + 6) : buffer.readUInt16BE(offset + 6);
        const numFields = buffer.readUInt8(offset + 8);
        let pos = offset + 9;

        fields[localMsgType] = { globalMsgNum, fields: [], numFields };

        for (let i = 0; i < numFields; i++) {
          const fieldDef = {
            fieldDefNum: buffer.readUInt8(pos),
            size: buffer.readUInt8(pos + 1),
            baseType: buffer.readUInt8(pos + 2),
          };
          fields[localMsgType].fields.push(fieldDef);
          pos += 3;
        }

        offset = pos;
      } else {
        const localMsgType = messageType;
        const def = fields[localMsgType];

        if (!def) {
          offset = this.skipDataMessage(buffer, offset);
          continue;
        }

        if (def.globalMsgNum === 18) {
          const values = this.readFields(buffer, offset + 1, def.fields);
          const name = this.readFieldValue(values, 'name', 0);
          sportType = this.mapFitSport(name);
        }

        if (def.globalMsgNum === 20) {
          const values = this.readFields(buffer, offset + 1, def.fields);
          const dist = this.readFieldValue(values, 'total_distance', 5);
          const dur = this.readFieldValue(values, 'total_timer_time', 7);
          const strTime = this.readFieldValue(values, 'start_time', 2);
          const cal = this.readFieldValue(values, 'total_calories', 9);
          const ascent = this.readFieldValue(values, 'total_ascent', 30);
          if (dist) totalDistance = typeof dist === 'number' ? dist : totalDistance;
          if (dur) totalDuration = typeof dur === 'number' ? dur : totalDuration;
          if (strTime) startTime = typeof strTime === 'number' ? this.fitTimestampToISO(strTime) : strTime;
          if (cal) totalCalories = typeof cal === 'number' ? cal : totalCalories;
          if (ascent) totalAscent = typeof ascent === 'number' ? ascent : totalAscent;
        }

        if (def.globalMsgNum === 22) {
          const values = this.readFields(buffer, offset + 1, def.fields);
          const dist = this.readFieldValue(values, 'enhanced_avg_speed', 19);
          const hr = this.readFieldValue(values, 'enhanced_avg_heart_rate', 21);
          const maxHr = this.readFieldValue(values, 'enhanced_max_heart_rate', 20);
          const maxSpd = this.readFieldValue(values, 'enhanced_max_speed', 22);
          if (hr && !avgHeartRate) avgHeartRate = Math.round(typeof hr === 'number' ? hr : 0);
          if (maxHr && maxHr > maxHeartRate) maxHeartRate = Math.round(typeof maxHr === 'number' ? maxHr : 0);
        }

        if (def.globalMsgNum === 78) {
          const values = this.readFields(buffer, offset + 1, def.fields);
          const lat = this.readFieldValue(values, 'position_lat', 0);
          const lng = this.readFieldValue(values, 'position_long', 1);
          const alt = this.readFieldValue(values, 'altitude', 2);
          const ts = this.readFieldValue(values, 'timestamp', 3);
          const hr = this.readFieldValue(values, 'heart_rate', 6);
          if (lat && lng) {
            gpsData.push({
              lat: typeof lat === 'number' ? lat * (180 / Math.pow(2, 31)) : parseFloat(lat),
              lng: typeof lng === 'number' ? lng * (180 / Math.pow(2, 31)) : parseFloat(lng),
              elevation: typeof alt === 'number' ? alt : (alt ? parseFloat(alt) : null),
              timestamp: ts ? (typeof ts === 'number' ? this.fitTimestampToISO(ts) : ts) : null,
              heartrate: hr ? Math.round(typeof hr === 'number' ? hr : parseInt(hr)) : null,
            });
          }
          if (ts && !startTime) startTime = typeof ts === 'number' ? this.fitTimestampToISO(ts) : ts;
          if (ts) endTime = typeof ts === 'number' ? this.fitTimestampToISO(ts) : ts;
        }

        if (def.globalMsgNum === 49) {
          const values = this.readFields(buffer, offset + 1, def.fields);
          const hr = this.readFieldValue(values, 'heart_rate', 4);
          if (hr && !avgHeartRate) avgHeartRate = typeof hr === 'number' ? Math.round(hr) : Math.round(parseInt(hr));
        }

        offset += 1 + def.fields.reduce((sum, f) => sum + f.size, 0);
      }
    }

    if (!startTime && !totalDistance && gpsData.length === 0) return null;

    return {
      title: `FIT Import - ${sportType}`,
      activity_type: sportType,
      distance_m: Math.round(totalDistance * 100) / 100,
      duration_seconds: totalDuration,
      start_time: startTime || new Date(gpsData[0]?.timestamp || Date.now()).toISOString(),
      end_time: endTime || new Date().toISOString(),
      elevation_gain_m: totalAscent || null,
      average_heartrate: avgHeartRate,
      max_heartrate: maxHeartRate || null,
      calories_burned: totalCalories || null,
      gps_data: gpsData.length > 0 ? gpsData : null,
      source: 'fit_import',
    };
  }

  skipDefinitionMessage(buffer, offset) {
    const numFields = buffer.readUInt8(offset + 8);
    let pos = offset + 9;
    for (let i = 0; i < numFields; i++) {
      pos += 3;
    }
    const hasDeveloperFields = (buffer.readUInt8(offset) & 0x20) !== 0;
    if (hasDeveloperFields) {
      const numDevFields = buffer.readUInt8(pos);
      pos += 1;
      for (let i = 0; i < numDevFields; i++) {
        pos += 3;
      }
    }
    return pos;
  }

  skipDataMessage(buffer, offset) {
    return offset + 1;
  }

  readFields(buffer, startOffset, fieldDefs) {
    const values = {};
    let offset = startOffset;
    for (const field of fieldDefs) {
      if (field.size > 0 && offset + field.size <= buffer.length) {
        const rawValue = this.readRawValue(buffer, offset, field);
        values[field.fieldDefNum] = rawValue;
      }
      offset += field.size;
    }
    return values;
  }

  readRawValue(buffer, offset, fieldDef) {
    switch (fieldDef.baseType) {
      case 0x00: if (fieldDef.size === 1) return buffer.readUInt8(offset);
      case 0x01: return buffer.readUInt8(offset);
      case 0x02: return buffer.readInt16LE(offset);
      case 0x03: return buffer.readUInt16LE(offset);
      case 0x04: return buffer.readInt32LE(offset);
      case 0x05: return buffer.readUInt32LE(offset);
      case 0x06: return buffer.readFloatLE(offset);
      case 0x07: return buffer.readDoubleLE(offset);
      case 0x0A: return buffer.readUInt32LE(offset);
      default: {
        if (fieldDef.size === 1) return buffer.readUInt8(offset);
        if (fieldDef.size === 2) return buffer.readUInt16LE(offset);
        if (fieldDef.size === 4) return buffer.readUInt32LE(offset);
        return buffer.toString('utf8', offset, offset + fieldDef.size).replace(/\0/g, '');
      }
    }
  }

  readFieldValue(values, name, defNum) {
    return values[defNum] !== undefined ? values[defNum] : null;
  }

  mapFitSport(sportName) {
    const map = {
      running: 'running',
      trail_running: 'trail_running',
      treadmill: 'treadmill',
      cycling: 'cycling',
      mountain_biking: 'cycling',
      walking: 'walking',
      hiking: 'hiking',
      swimming: 'swimming',
      strength_training: 'strength',
      cardio: 'cardio',
      yoga: 'yoga',
    };
    if (!sportName) return 'running';
    const key = sportName.toString().toLowerCase().replace(/\s+/g, '_');
    return map[key] || 'other';
  }

  fitTimestampToSeconds(fitTimestamp) {
    return fitTimestamp + 631065600;
  }

  fitTimestampToISO(fitTimestamp) {
    const unixTs = typeof fitTimestamp === 'number' ? this.fitTimestampToSeconds(fitTimestamp) : 0;
    return new Date(unixTs * 1000).toISOString();
  }

  parseXml(xml) {
    try {
      return this._simpleXmlParse(xml);
    } catch {
      return null;
    }
  }

  _simpleXmlParse(xml) {
    const result = {};
    const tagRegex = /<(\/?)(\w+:)?(\w[\w.-]*)((?:\s+[\w:.-]+=(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/gs;
    const attrRegex = /([\w:.-]+)=(?:"([^"]*)"|'([^']*)')/g;
    const textRegex = /([^<]+)/g;
    const stack = [result];
    const path = [result];
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(xml)) !== null) {
      const isClosing = match[1] === '/';
      const ns = match[2] || '';
      const tagName = ns + match[3];
      const attrStr = match[4];
      const selfClosing = match[5] === '/';
      const tagStart = match.index;

      if (tagStart > lastIndex) {
        const text = xml.slice(lastIndex, tagStart).trim();
        if (text) {
          const current = path[path.length - 1];
          if (typeof current === 'object' && !current._text) {
            current._text = text;
          }
        }
      }

      if (isClosing) {
        if (path.length > 1) path.pop();
        lastIndex = tagRegex.lastIndex;
        continue;
      }

      const element = {};
      if (attrStr) {
        const attrs = {};
        let attrMatch;
        attrRegex.lastIndex = 0;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          attrs[attrMatch[1]] = attrMatch[2] || attrMatch[3] || '';
        }
        if (Object.keys(attrs).length > 0) {
          element._attributes = attrs;
        }
      }

      const parent = path[path.length - 1];
      if (parent[tagName]) {
        if (!Array.isArray(parent[tagName])) {
          parent[tagName] = [parent[tagName]];
        }
        parent[tagName].push(element);
      } else {
        parent[tagName] = element;
      }

      if (!selfClosing) {
        path.push(element);
      }

      lastIndex = tagRegex.lastIndex;
    }

    return result;
  }

  getText(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj._text) return obj._text;
    if (obj._) return obj._;
    if (obj.text) return obj.text;
    return null;
  }

  getExtensions(point) {
    const ext = point.extensions || point.Extensions || {};
    const garminExt = ext['gpxtpx:TrackPointExtension'] || ext.TrackPointExtension || ext.trackPointExtension || {};
    const tpe = garminExt['gpxtpx:TrackPointExtension'] || garminExt;
    return {
      ele: point.ele || point.Ele || this.getText(tpe.ele || tpe.elevation || tpe['gpxtpx:ele']),
      time: point.time || point.Time || this.getText(tpe.time || tpe['gpxtpx:time']),
      hr: point.hr || this.getText(tpe.hr || tpe.heartRate || tpe['gpxtpx:hr'] || tpe['gpxtpx:heartRate']),
    };
  }
}

export default FileImportService;
