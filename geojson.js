
var argv = require('optimist').argv;
var fs = require('fs');
var path = require('path');
var csv = require('csv');

var v900Path = path.join('.', 'v900csv');

if (argv.d) {
	v900Path = path.join(argv.d);
}

var dataPath = path.join('.', 'public', 'data');
var trackPath = path.join(dataPath, 'track');
var statsPath = path.join(dataPath, 'stats');
var jslPath = path.join(trackPath, 'jsonlines');
var jslDaysPath = path.join(jslPath, 'days');
var poiPath = path.join(dataPath, 'poi.json');
var stagesPath = path.join(dataPath, 'stages.json');
var timecodePath = path.join(dataPath, 'timecode.json');

var rmTreeSync = exports.rmTreeSync = function(p) {
    if (!fs.existsSync(p)) return;

    var files = fs.readdirSync(p);
    if (!files.length) {
        fs.rmdirSync(p);
        return;
    } else {
        files.forEach(function(file) {
            var fullName = path.join(p, file);
            if (fs.statSync(fullName).isDirectory()) {
                rmTreeSync(fullName);
            } else {
                fs.unlinkSync(fullName);
            }
        });
    }
    fs.rmdirSync(p);
};

if (argv.clear) {
	rmTreeSync(trackPath);
	console.log('tracks clear');
	process.exit();
}

if (!fs.existsSync(dataPath)) {
	fs.mkdirSync(dataPath);
}

if (!fs.existsSync(trackPath)) {
	fs.mkdirSync(trackPath);
}

if (!fs.existsSync(jslPath)) {
	fs.mkdirSync(jslPath);
}

if (!fs.existsSync(jslDaysPath)) {
	fs.mkdirSync(jslDaysPath);
}

if (!fs.existsSync(statsPath)) {
	fs.mkdirSync(statsPath);
}

var v900ToJsonLines = function () {
	var i, len, files, csvFilePath, stages;

	files = fs.readdirSync(v900Path);
	files = files.sort();
	stages = [];

	for (i = 0, len = files.length; i < len; i++) {
		csvFilePath = path.join(v900Path, files[i]);
		fnMatch = /(\d\d)(\d\d)(\d\d)(\d\d)\.csv$/i.exec(csvFilePath);
		console.log(fnMatch);

		(function (fileIndex) {
			csv()
			.fromPath(csvFilePath)
			.transform(function(data){
				var i, len, dateMatch, dateMatch, timeMatch, time,
					latMatch, lonMatch, latitude, longitude, record,
					fileName, dateString;

				if (data[0] === 'INDEX') return;

				for (i = 0, len = data.length; i < len; i++) {
					data[i] = data[i].replace(/\u0000/g, '').trim();
				}

				dateMatch = /^(\d\d)(\d\d)(\d\d)$/.exec(data[2]);
				timeMatch = /^(\d\d)(\d\d)(\d\d)$/.exec(data[3]);
				time = new Date();
				time.setUTCFullYear(+dateMatch[1] + 2000);
				time.setUTCMonth(+dateMatch[2] -1);
				time.setUTCDate(+dateMatch[3]);
				time.setUTCHours(+timeMatch[1]);
				time.setUTCMinutes(+timeMatch[2]);
				time.setUTCSeconds(+timeMatch[3]);
				time.setUTCMilliseconds(0);

				latMatch = /^([0-9.]+)(N|S)$/.exec(data[4]);
				latitude = latMatch[1];
				if (latMatch[2] === 'S') { latitude *= -1; }

				lonMatch = /^([0-9.]+)(E|W)$/.exec(data[5]);
				longitude = lonMatch[1];
				if (lonMatch[2] === 'W') { longitude *= -1; }

				record = {
					'index' : +data[0],
					'tag' : data[1],
					'time' : +time,
					'latitude' : +latitude,
					'longitude' : +longitude,
					'height' : +data[6],
					'speed' : +data[7],
					'heading' : +data[8],
					'vox' : +data[9]
				};


				dateString = time.getUTCFullYear() + '-' + ( ((time.getUTCMonth() + 1) < 10) ? '0' : '' ) + (time.getUTCMonth() + 1) + '-' + ( (time.getUTCDate() < 10) ? '0' : '' ) + time.getUTCDate();
				fileName = dateString + '_' + fileIndex + '.json'
				fs.appendFileSync(path.join(jslPath, fileName), JSON.stringify(record) + '\n', 'utf8');

				if (stages.indexOf(dateString) === -1) {
					console.log(dateString);
					stages.push(dateString);
					fs.writeFileSync(stagesPath, JSON.stringify(stages, null, '\t'), 'utf8');
				}
			});
		})(fnMatch[4]);

	}
};

var v900ProToJsonLines = function () {
	var i, len, files, csvFilePath, stages;

	files = fs.readdirSync(v900Path);
	files = files.sort();
	stages = [];

	for (i = 0, len = files.length; i < len; i++) {
		csvFilePath = path.join(v900Path, files[i]);
		csv()
		.fromPath(csvFilePath)
		.transform(function(data){
			var i, len, dateMatch, dateMatch, timeMatch, time,
				latMatch, lonMatch, latitude, longitude, record,
				fileName, dateString;

			if (data[0] === 'INDEX') return;

			for (i = 0, len = data.length; i < len; i++) {
				data[i] = data[i].replace(/\u0000/g, '').trim();
			}

			dateMatch = /^(\d\d)(\d\d)(\d\d)$/.exec(data[2]);
			timeMatch = /^(\d\d)(\d\d)(\d\d)$/.exec(data[3]);
			time = new Date();
			time.setUTCFullYear(+dateMatch[1] + 2000);
			time.setUTCMonth(+dateMatch[2] -1);
			time.setUTCDate(+dateMatch[3]);
			time.setUTCHours(+timeMatch[1]);
			time.setUTCMinutes(+timeMatch[2]);
			time.setUTCSeconds(+timeMatch[3]);
			time.setUTCMilliseconds(0);

			latMatch = /^([0-9.]+)(N|S)$/.exec(data[4]);
			latitude = latMatch[1];
			if (latMatch[2] === 'S') { latitude *= -1; }

			lonMatch = /^([0-9.]+)(E|W)$/.exec(data[5]);
			longitude = lonMatch[1];
			if (lonMatch[2] === 'W') { longitude *= -1; }

			record = {
				'index' : +data[0],
				'tag' : data[1],
				'time' : +time,
				'latitude' : +latitude,
				'longitude' : +longitude,
				'height' : +data[6],
				'speed' : +data[7],
				'heading' : +data[8],
				'fixMode' : data[9],
				'valid' : data[10],
				'pdop' : +data[11],
				'hdop' : +data[12],
				'vdop' : +data[13],
				'vox' : +data[14]
			};


			dateString = time.getUTCFullYear() + '-' + ( ((time.getUTCMonth() + 1) < 10) ? '0' : '' ) + (time.getUTCMonth() + 1) + '-' + ( (time.getUTCDate() < 10) ? '0' : '' ) + time.getUTCDate();
			fileName = dateString + '.json'
			fs.appendFileSync(path.join(jslPath, fileName), JSON.stringify(record) + '\n', 'utf8');

			if (stages.indexOf(dateString) === -1) {
				console.log(dateString);
				stages.push(dateString);
				fs.writeFileSync(stagesPath, JSON.stringify(stages, null, '\t'), 'utf8');
			}
		});
	}
};

var jsonLinesToGeoJson = function () {
	var i, len, files, linesFilePath, data, lines, fullCoords, coords,
		ii, len2, record, geojson, dateString, poi, poiData, poiId,
		prevLat, prevLon, latDiff, lonDiff;

	if (fs.existsSync(poiPath)) {
		poiData = fs.readFileSync(poiPath, 'utf8');
		poi = JSON.parse(poiData);

	} else {
		poi = {};
	}

	files = fs.readdirSync(jslDaysPath);
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		dateString = /^(.+)\.json$/.exec(files[i])[1];
		linesFilePath = path.join(jslDaysPath, files[i]);
		if (/\/\d\d\d\d-\d\d-\d\d\.json/i.test(linesFilePath) === false) { continue; } 

		data = fs.readFileSync(linesFilePath, 'utf8');
		lines = data.match(/[^\r\n]+/g);
		fullCoords = [];
		coords = [];

		for (ii = 0, len2 = lines.length; ii < len2; ii++) {
			record = JSON.parse(lines[ii]);

			if (ii === 0) {
				prevLat = record.latitude;
				prevLon = record.longitude;
			}

			latDiff = Math.abs(prevLat - record.latitude);
			lonDiff = Math.abs(prevLon - record.longitude);

			if (latDiff > 0.000005 || lonDiff > 0.000005) {
				//continue;
			}

			prevLat = record.latitude;
			prevLon = record.longitude;
			console.log(prevLat, prevLon, latDiff, lonDiff);

			if (record.tag === 'C') {
				poiId = 'poi-' + record.index + '-' + Math.round(record.latitude * record.longitude);
				if (!poi.hasOwnProperty(poiId)) {
					console.log(record.index, poiId);
					poi[poiId] = {
						"time" : record.time,
						"type" : "",
						"message" : "",
						"latitude" : record.latitude,
						"longitude" : record.longitude
					};
				}
				continue;
			}

			if (record['tag'] !== 'T') { continue; }

			fullCoords.push([ record.longitude, record.latitude ]);

			if ( (argv.i && ii % argv.i === 0) || ii === 0 || ii === len2 - 1 ) {
				coords.push([ record.longitude, record.latitude ]);
			}
		}

		geojson = {
			'type' : 'FeatureCollection',
			'features' : [
				{
					'type' : 'Feature',
					'properties' : {
						'name' : dateString
					},
					'geometry' : {
						'type' : 'LineString',
						'coordinates' : []
					}
				}
			]
		};

		geojson.features[0].geometry.coordinates = fullCoords;
		fs.writeFileSync(path.join(trackPath, dateString + '-full.json'), JSON.stringify(geojson, null, '\t'), 'utf8');

		geojson.features[0].geometry.coordinates = coords;
		fs.writeFileSync(path.join(trackPath, dateString + '.json'), JSON.stringify(geojson, null, '\t'), 'utf8');

		fs.writeFileSync(poiPath, JSON.stringify(poi, null, '\t'), 'utf8');
	}
};

var mergeJsonLines = function () {
	var i, len, files, filePath, fileMatch, fileBase, contents;

	files = fs.readdirSync(jslPath);
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		filePath = path.join(jslPath, files[i]);

		if (/_\d\d\.json/i.test(filePath) === false) { continue; } 

		fileMatch = /\/([0-9-]+)_\d\d\.json/i.exec(filePath);
		fileBase = fileMatch[1];

		contents = fs.readFileSync(filePath, 'utf8');
		console.log('m', filePath);

		fs.appendFileSync(path.join(jslDaysPath, fileBase + '.json'), contents, 'utf8');
	}

};

var jsonLinesToTimecode = function () {
	var i, len, ii, len2, files, linesFilePath, data, lines,
		record, timeCoords, time, lastTime,
		tcStart, tcEnd, tcTime, timeCodes, step;

	files = fs.readdirSync(jslDaysPath);
	files = files.sort();
	timeCoords = {};
	timeCodes = {
		'start' : 0,
		'end' : 0, 
		'codes' : {}
	};
	step = 600000;

	lastTime = 0;
	for (i = 0, len = files.length; i < len; i++) {
		linesFilePath = path.join(jslDaysPath, files[i]);
		if (/\/\d\d\d\d-\d\d-\d\d\.json/i.test(linesFilePath) === false) { continue; } 

		data = fs.readFileSync(linesFilePath, 'utf8');
		lines = data.match(/[^\r\n]+/g);

		console.log('tc', linesFilePath, lines.length);
		for (ii = 0, len2 = lines.length; ii < len2; ii++) {
			record = JSON.parse(lines[ii]);
			time = record.time - (record.time % step);

			if (i === 0 && ii === 0) { 
				tcStart = time;
				timeCodes.start = time;
			}
			if (i === (len - 1) && ii === (len2 - 1)) { 
				tcEnd = time;
				timeCodes.end = time;
			}

			if (time > lastTime) {
				lastTime = time;
				timeCoords[time] = [ record.latitude, record.longitude ];
			}
		}
	}

	tcTime = tcStart - step;
	while (tcTime <= tcEnd) {
		tcTime += step;

		if (timeCoords[tcTime]) {
			timeCodes.codes[tcTime] = timeCoords[tcTime];
			continue;
		}

		timeCodes.codes[tcTime] = timeCodes.codes[tcTime - step]
	}

	for (time in timeCodes.codes) {
		console.log(new Date(+time), timeCodes.codes[time]);
	}

	fs.writeFileSync(timecodePath, JSON.stringify(timeCodes, null, '\t'), 'utf8');


};

if (argv.lines) {
	if (argv.pro) { 
		v900ProToJsonLines();
	} else {
		v900ToJsonLines();
	}

} else if (argv.merge) {
	mergeJsonLines();

} else if (argv.geo) {
	jsonLinesToGeoJson();

} else if (argv.timecode) {
	jsonLinesToTimecode();
}
