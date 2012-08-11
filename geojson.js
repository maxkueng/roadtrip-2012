
var fs = require('fs');
var csv = require('csv');

var v900ToJsonLines = function () {
	var files = fs.readdirSync('./v900');
	files = files.sort();

	for (var i = 0, len = files.length; i < len; i++) {
		var csvFile = './v900/' + files[i];
		csv()
		.fromPath(csvFile)
		.transform(function(data){
			if (data[0] === 'INDEX') return;

			for (var i = 0, len = data.length; i < len; i++) {
				data[i] = data[i].replace(/\u0000/g, '').trim();
			}

			var dateMatch = /^(\d\d)(\d\d)(\d\d)$/.exec(data[2]);
			var timeMatch = /^(\d\d)(\d\d)(\d\d)$/.exec(data[3]);
			var time = new Date();
			time.setUTCFullYear(+dateMatch[1] + 2000);
			time.setUTCMonth(+dateMatch[2]);
			time.setUTCDate(+dateMatch[3]);
			time.setUTCHours(+timeMatch[1]);
			time.setUTCMinutes(+timeMatch[2]);
			time.setUTCSeconds(+timeMatch[3]);
			time.setUTCMilliseconds(0);

			var latMatch = /^([0-9.]+)(N|S)$/.exec(data[4]);
			var latitude = latMatch[1];
			if (latMatch[2] === 'S') { latitude *= -1; }

			var lonMatch = /^([0-9.]+)(E|W)$/.exec(data[5]);
			var longitude = lonMatch[1];
			if (lonMatch[2] === 'W') { longitude *= -1; }

			var record = {
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

			var fileName = time.getUTCFullYear() + '-' + ( (time.getUTCMonth() < 10) ? '0' : '' ) + time.getUTCMonth() + '-' + ( (time.getUTCDate() < 10) ? '0' : '' ) + time.getUTCDate() + '.json'
			fs.appendFileSync('./jsonlines/' + fileName, JSON.stringify(record) + '\n', 'utf8');
		});
	}
};

var jsonLinesToJsonCoords = function () {
	var i, ii, files, len, len2, linesFile, data, lines, lineData, coords, point;

	files = fs.readdirSync('./jsonlines');
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		coords = [];
		linesFile = './jsonlines/' + files[i];
		console.log('c', files[i]);

		data = fs.readFileSync(linesFile, 'utf8');
		lines = data.match(/[^\r\n]+/g);

		for (ii = 0, len2 = lines.length; ii < len2; ii++) {
			if (ii !== 0 && ii !== len2 -1 && ii % 300 !== 0) { continue; }
			lineData = JSON.parse(lines[ii]);
			coords.push([lineData.longitude, lineData.latitude]);
		}

		fs.writeFileSync('./jsoncoords/' + files[i], JSON.stringify(coords, null, '\t'), 'utf8');
	}
};

var jsonCoordsToGeoJson = function () {
	var i, len, files, coordsFile, data, coords, featureCollection, feature;

	featureCollection = {
		'type' : 'FeatureCollection',
		'features' : []
	};

	files = fs.readdirSync('./jsoncoords');
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		coordsFile = './jsoncoords/' + files[i];
		data = fs.readFileSync(coordsFile, 'utf8');
		coords = JSON.parse(data);

		feature = {
			'id' : files[i],
			'type' : 'Feature',
			'properties' : {
				'name' : files[i]
			},
			'geometry' : {
				'type' : 'LineString',
				'coordinates' : []
			}
		};

		feature.geometry.coordinates = coords;

		featureCollection.features.push(feature);
	}

	fs.writeFileSync('./xxx.geojson', JSON.stringify(featureCollection, null, '\t', 'utf8'));
};

//v900ToJsonLines();
jsonLinesToJsonCoords();
jsonCoordsToGeoJson();
