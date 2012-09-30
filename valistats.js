var path = require('path');
var fs = require('fs');

var dataPath = path.join('.', 'public', 'data');
var statsPath = path.join(dataPath, 'stats');

var vali = function () {
	var i, len, files, filePath, json, obj;

	files = fs.readdirSync(statsPath);
	files = files.sort();

	for (i = 0, len = files.length; i < len; i++) {
		console.log(files[i]);
		filePath = path.join(statsPath, files[i]);

		json = fs.readFileSync(filePath, 'utf8');
		obj = JSON.parse(json);
	}
};

vali();
