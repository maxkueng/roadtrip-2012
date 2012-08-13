"use strict";

var fs = require('fs');
var path = require('path');

var FlickrAPI = require('./lib/flickr/flickr').FlickrAPI;
var flickr = new FlickrAPI('869c5df692d52028776018de993ac614', 'cf857cf6efd7ec23');

var dataPath = path.join('.', 'public', 'data');
var timecodePath = path.join(dataPath, 'timecode.json');
var photosPath = path.join(dataPath, 'photos.json');

var userId = '67854812@N00'
var setId = '72157623765049240';
var photos = [];
var timecode = {};

var tcData = fs.readFileSync(timecodePath, 'utf8');
var timecode = JSON.parse(tcData);
var step = 600000;

var tagPhotos = function (page) {
	if (typeof page === 'undefined') { page = 1; }

	flickr.photosets.getPhotos(setId, {
		'extras' : [ 'date_taken', 'url_m', 'url_sq', 'geo' ],
		'page' : page
	}, function (err, response) {
		var i, len, p, ph, time, tc;
		if (err) { throw err; }

		for (i = 0, len = response.photo.length; i < len; i++) {
			ph = response.photo[i];
			ph.time = +Date.parse(ph.datetaken);
			time = ph.time - (ph.time % step);
			tc = timecode[time];
			if (!tc) { continue; }
			p = {
				'pageUrl' : 'http://www.flickr.com/photos/' + userId + '/' + ph.id + '/in/set-' + setId,
				'url_m' : ph.url_m,
				'url_sq' : ph.url_sq,
				'latitude' : timecode[time][0],
				'longitude' : timecode[time][1]
			};

			photos.push(p);
		}

		if (parseInt(response.page) < parseInt(response.pages)) {
			tagPhotos(parseInt(response.page) + 1);

		} else {
			console.log('P', photos.length);
			fs.writeFileSync(photosPath, JSON.stringify(photos, null, '\t'), 'utf8');
		}
	});
};

tagPhotos();
