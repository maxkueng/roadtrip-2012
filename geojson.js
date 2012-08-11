
var argv = require('optimist').argv;
var fs = require('fs');
var path = require('path');
var csv = require('csv');

var v900Path = path.join('.', 'v900');
var dataPath = path.join('.', 'public', 'data');
var jslPath = path.join(dataPath, 'jsonlines');
var stagesPath = path.join(dataPath, 'stages.json');

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
	rmTreeSync(dataPath);
	console.log('clear');
}

if (!fs.existsSync(dataPath)) {
	fs.mkdirSync(dataPath);
}

if (!fs.existsSync(jslPath)) {
	fs.mkdirSync(jslPath);
}

var v900ToJsonLines = function () {
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
			time.setUTCMonth(+dateMatch[2]);
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


			dateString = time.getUTCFullYear() + '-' + ( (time.getUTCMonth() < 10) ? '0' : '' ) + time.getUTCMonth() + '-' + ( (time.getUTCDate() < 10) ? '0' : '' ) + time.getUTCDate();
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
		ii, len2, record, geojson, dateString;

	files = fs.readdirSync(jslPath);
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		dateString = /^(.+)\.json$/.exec(files[i])[1];
		linesFilePath = path.join(jslPath, files[i]);
		data = fs.readFileSync(linesFilePath, 'utf8');
		lines = data.match(/[^\r\n]+/g);
		fullCoords = [];
		coords = [];

		for (ii = 0, len2 = lines.length; ii < len2; ii++) {
			record = JSON.parse(lines[ii]);

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
		fs.writeFileSync(path.join(dataPath, dateString + '-full.json'), JSON.stringify(geojson, null, '\t'), 'utf8');

		geojson.features[0].geometry.coordinates = coords;
		fs.writeFileSync(path.join(dataPath, dateString + '.json'), JSON.stringify(geojson, null, '\t'), 'utf8');
	}
};

if (argv.line) {
	v900ToJsonLines();

} else if (argv.geo) {
	jsonLinesToGeoJson();
}
