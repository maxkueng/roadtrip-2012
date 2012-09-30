var path = require('path');
var fs = require('fs');

var dataPath = path.join('.', 'public', 'data');
var trackPath = path.join(dataPath, 'track');
var statsPath = path.join(dataPath, 'stats');
var jslPath = path.join(trackPath, 'jsonlines');
var jslDaysPath = path.join(jslPath, 'days');

if (typeof(Number.prototype.toRad) === "undefined") {
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}
}

var dist = function (co1, co2) {
	var lat1 = co1[0];
	var lon1 = co1[1];
	var lat2 = co2[0];
	var lon2 = co2[1];
	

	var R = 6371; // km
	var dLat = (lat2-lat1).toRad();
	var dLon = (lon2-lon1).toRad();
	var lat1 = lat1.toRad();
	var lat2 = lat2.toRad();

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;

	return d;
};

var millisToTimeString = function (millis) {
	return secsToTimeString(millis / 1000);
};

var secsToTimeString = function (secs) {
	var s = 0, m = 0, h = 0;
	secs = Math.round(secs);

	h   = Math.floor(secs / 3600);
	m = Math.floor((secs - (h * 3600)) / 60);
	s = secs - (h * 3600) - (m * 60);

	if (h < 10) { h = '0' + h; }  
	if (m < 10) { m = '0' + m; }  
	if (s < 10) { s = '0' + s; }  

	return h + ':' + m + ':' + s;
};

var stats = function () {
	var i, ii, len, len2, files, filePath,
		data, lines, record, stats,
		firstRec, prevTime, prevCoords, prevAlti, totalTime, stats;

	files = fs.readdirSync(jslDaysPath);
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		filePath = path.join(jslDaysPath, files[i]);

		data = fs.readFileSync(filePath, 'utf8');
		lines = data.match(/[^\r\n]+/g);

		firstRec = JSON.parse(lines[0]);
		//console.log(firstRec);
		prevTime = +firstRec.time;
		prevCoords = [ +firstRec.latitude, +firstRec.longitude ];
		prevAlti = +firstRec.height;
		totalTime = 0;

		stats = {
			'rideTimeMillis' : 0,
			'rideTime' : '',
			'avgSpeed' : null,
			'distance' : 0,
			'altiLoss' : 0,
			'altiGain' : 0,
			'maxAlti' : 0
		};


		for (ii = 0, len2 = lines.length; ii < len2; ii++) {
			record = JSON.parse(lines[ii]);

			if (+record.speed > 2) {
				stats.rideTimeMillis += +record.time - prevTime;

				if (stats.avgSpeed !== null) { 
					stats.avgSpeed = ( (stats.avgSpeed + record.speed) / 2 );
				} else {
					stats.avgSpeed = record.speed;
				}

				if (prevAlti <= +record.height) {
					stats.altiGain += ( +record.height - prevAlti);
				} else {
					stats.altiLoss += ( +record.height - prevAlti);
				}

				if (+record.height > stats.maxAlti) {
					stats.maxAlti = +record.height;
				}
			}

			stats.distance += dist(prevCoords, [ +record.latitude, +record.longitude ]);

			prevTime = +record.time;

			prevCoords = [ +record.latitude, +record.longitude ];
			prevAlti = +record.height;
		}

		stats.rideTime = millisToTimeString(stats.rideTimeMillis);

		stats.avgSpeed = stats.distance / ( stats.rideTimeMillis / 1000 / 60 / 60 );

		console.log(filePath);
		console.log(stats);
	}
};

stats();
