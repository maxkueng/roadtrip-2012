$(document).ready(function () {
	var map = L.map('map').setView([45.49672, 10.23651], 13);

	L.tileLayer('http://{s}.tile.cloudmade.com/{api}/997/256/{z}/{x}/{y}.png', {
		'attribution' : 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
		'maxZoom' : 18,
		'api' : '4099a7fbbbde4acc900a97e756dea44f'
	}).addTo(map);

	var defaultStyle = {
		'color' : '#2262CC',
		'weight' : 6,
		'opacity' : 0.8
	};

	var highlightStyle2 = {
		'color' : '#33CC66',
		'weight' : 6,
		'opacity' : 0.8
	};

	var highlightStyle = {
		'color' : '#FF0033', 
		'weight' : 6,
		'opacity' : 0.6,
		'fillColor' : 'transparent'
	};

	var rectStyle = {
		'color' : 'transparent', 
//		'color' : '#33CC66', 
		'fillColor' : 'transparent'
	};

	var photoLayer;
	var poiLayer;
	var featureLayer;
	var stages = {};
	var stageInfo = {};

	var showStageOverlay = function (stageName) {
		if (stageInfo.hasOwnProperty(stageName)) {
			var stats = stageInfo[stageName];

			$('#stage-overlay span.stage').text(stats.stage);
			$('#stage-overlay span.time').text(stats.stageName);
			$('#stage-overlay span.from').text(stats.from);
			$('#stage-overlay span.to').text(stats.to);
			$('#stage-overlay span.distance').text(stats.distance + ' km');
			$('#stage-overlay span.avgspeed').text(stats.avgSpeed + ' km/h');

			$('#stage-overlay').show();
		}
	};

	var hideStageOverlay = function () {
		$('#stage-overlay').hide();
	};

	var fetchFullLayer = function (name) {
		var layer = stages[name].normal;

		if (stages.hasOwnProperty(name) && stages[name].full === null) {
			$('#loader').loader('start');
			map.fitBounds(layer.getBounds());
			if (stages[name].rect) {
				map.removeLayer(stages[name].rect);
			}

			setTimeout(function () {
				$.getJSON('/data/track/' + name + '-full.json', function (collection) {
					featureLayer.addData(collection);
				});
			}, 0);

		} else {
			map.fitBounds(layer.getBounds());
		}
	};

	var highlightLayer = function (name, highlight) {
		var layer, style;

		if (stages[name].full !== null) {
			layer = stages[name].full;
		} else {
			layer = stages[name].normal;
		}

		style = (highlight === true) ? highlightStyle : defaultStyle;
		layer.setStyle(style);
	};

	var createBoundingRect = function (name, layer) {
		var rect = new L.Rectangle(layer.getBounds());
		rect.setStyle(rectStyle);
		rect.bringToFront();

		rect.on('mouseover', function (e) {
			highlightLayer(name, true);
			showStageOverlay(name);
		});

		rect.on('mouseout', function (e) {
			highlightLayer(name, false);
			hideStageOverlay();
		});

		rect.on('click', function (e) {
			fetchFullLayer(name);
		});

		stages[name].rect = rect;
		map.addLayer(rect);
	};

	var onEachFeature = function (feature, layer) {
		var layerName = feature.properties.name;
		layer.setStyle(defaultStyle);

		if (!stages.hasOwnProperty(layerName)) {
			stages[layerName] = {
				'rect' : null,
				'normal' : layer,
				'full' : null
			};

			createBoundingRect(layerName, layer);

		} else {
			featureLayer.removeLayer(stages[layerName].normal);
			$('#loader').loader('stop');
			stages[layerName].full = layer;
			createBoundingRect(layerName, layer);
//			delete stages[layerName].normal;
		}
	};

	featureLayer = L.geoJson(null, {
		'onEachFeature' : onEachFeature
	});
	map.addLayer(featureLayer);

	var getStages = function () {
		$.getJSON('/data/stages.json', function(data) {
			var i, len, count;
			count = 0;
			for (i = 0, len = data.length; i < len; i++) {
				$.getJSON('/data/track/' + data[i] + '.json', function (collection) {
					featureLayer.addData(collection);
					if (count === (len -1)) {
						map.fitBounds(featureLayer.getBounds());
					}
					count++;
				});

				$.getJSON('/data/stats/' + data[i] + '.json', function (stats) {
					if (!stats) { return; }
					stageInfo[stats.stageName] = stats;
				});
			}
		});
	};

	photoLayer = new L.LayerGroup();
	var photoIcon = new L.DivIcon({
		'html' : '<div class="lens"></div><div class="trigger"></div>',
		'className' : 'photo-marker',
		'iconSize' : new L.Point(30, 22)
	});

	var getPhotos = function () {
		var oms = new OverlappingMarkerSpiderfier(map);

		$.getJSON('/data/photos.json', function (data) {
			var i, len, marker, icon;
			for (i = 0, len = data.length; i < len; i++) {
				marker = new L.Marker(new L.LatLng(data[i].latitude, data[i].longitude), { 
					'title' : 'photo',
					'icon' : photoIcon
				});
				marker.addTo(photoLayer);
				oms.addMarker(marker);
			}
		});
	};

	poiLayer = new L.LayerGroup();

	var getPOIs = function () {
		$.getJSON('/data/poi.json', function (pois) {
			var i, len, marker;

			for (i = 0, len = pois.length; i < len; i++) {
				marker = new L.Marker(new L.LatLng(pois[i].latitude, pois[i].longitude));
				marker.addTo(poiLayer);
			}
		});
	};

	map.on('zoomend', function () {
		var zoomLevel = map.getZoom();
		$('#zoomlevel-overlay span.zoomlevel').text(zoomLevel);
		
		if (zoomLevel >= 11) {
			map.addLayer(photoLayer);
			map.removeLayer(poiLayer);
		} else {
			map.removeLayer(photoLayer);
			map.addLayer(poiLayer);
		}
		
	});

	getStages();
	getPhotos();
	getPOIs();
});
