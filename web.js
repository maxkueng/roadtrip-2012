"use strict";

var express = require('express');

express.static.mime.define({'application/json': ['json']});
			

var app = express.createServer(
//	express.logger(), 
	express.static(__dirname + '/public'), 
	express.bodyParser(), 
	express.cookieParser()
);

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log('App running on port ' + port);
});

app.get('/', function (req, res) {
	res.render('index.ejs', {
		'layout' : 'layout.ejs',
		'req' : req,
		'res' : res
	});
});
