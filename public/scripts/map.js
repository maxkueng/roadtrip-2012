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
	var stageInfoActive = false;
	var tripInfo = {};
	var selectedStageName = null;

	var oms = new OverlappingMarkerSpiderfier(map);
	oms.addListener('click', function (marker) {
		if (marker.x_type && marker.x_type === 'comment') {
			$('#sidebar div.comment span.time').text(new Date(+marker.x_poi.time).toString('MMM.dd HH:mm'));
			$('#sidebar blockquote.comment').text(marker.x_poi.message);

			$('#sidebar div.comment').slideDown();
			$('#sidebar div.maintenance').slideUp();
			return;
		}

		if (marker.x_type && marker.x_type === 'maintenance') {
			$('#sidebar div.maintenance span.time').text(new Date(+marker.x_poi.time).toString('MMM.dd HH:mm'));
			$('#sidebar blockquote.comment').text(marker.x_poi.message);

			$('#sidebar div.maintenance').slideDown();
			$('#sidebar div.comment').slideUp();
			return;
		}
	});

	map.on('click', function (e) {
		$('#sidebar div.comment').slideUp();
		$('#sidebar div.maintenance').slideUp();
		$('#sidebar div.photo').slideUp();
	});

	var updateTripInfo = function () {
		$('#sidebar .tripinfo .from').text(tripInfo.from + ' ');
		$('#sidebar .tripinfo .to').text(tripInfo.to) + ' ';
		$('#sidebar .tripinfo .distance').text(tripInfo.distance + ' km');
		$('#sidebar .tripinfo .avgspeed').text(tripInfo.avgSpeed + ' km/h');
	};

	var showStageInfo = function (stageName) {
		if (stageInfo.hasOwnProperty(stageName)) {
			var stats = stageInfo[stageName];

			$('#sidebar .stageinfo .stage').text(stats.stage);
			$('#sidebar .stageinfo span.stagename').text(stats.stageName);
			$('#sidebar .stageinfo span.time').text(new Date(+stats.time).toString('MMM.dd'));
			$('#sidebar .stageinfo .from').text(stats.from);
			$('#sidebar .stageinfo .to').text(stats.to);
			$('#sidebar .stageinfo .distance').text(stats.distance + ' km');
			$('#sidebar .stageinfo .avgspeed').text(stats.avgSpeed + ' km/h');
			stageInfoActive = true;

			setTimeout(function () {
				if (!stageInfoActive) { return; }
				$('#sidebar .stageinfo').slideDown();
			}, 500);
		}
	};

	var hideStageInfo = function () {
		stageInfoActive = false;
		setTimeout(function () {
			if (stageInfoActive) { return; }
			$('#sidebar .stageinfo').slideUp();
		}, 500);
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
			if (selectedStageName) {
				highlightLayer(selectedStageName, false);
			}

			selectedStageName = name;
			highlightLayer(name, true);

			if (stageInfo[name]) {
				showStageInfo(name);
			} else {
				hideStageInfo();
			}
		});

/*		rect.on('mouseout', function (e) {
			highlightLayer(name, false);
			hideStageInfo();
		}); */

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
		tripInfo = {
			'fromStage' : null,
			'from' : '',
			'toStage' : null,
			'to' : '',
			'distance' : 0,
			'avgSpeed' : null
		};

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

					if (tripInfo.fromStage === null || stats.stage < tripInfo.fromStage) {
						tripInfo.fromStage = stats.stage;
						tripInfo.from = stats.from;
					}

					if (tripInfo.toStage === null || stats.stage > tripInfo.toStage) {
						tripInfo.toStage = stats.stage;
						tripInfo.to = stats.to;
					}

					tripInfo.distance += stats.distance;

					if (tripInfo.avgSpeed !== null) {
						tripInfo.avgSpeed = (tripInfo.avgSpeed + stats.avgSpeed) / 2;
					} else {
						tripInfo.avgSpeed = stats.avgSpeed;
					}

					updateTripInfo();
				});
			}
		});
	};

	photoLayer = new L.LayerGroup();
	var photoIcon = new L.DivIcon({
		'html' : '<div class="icon-camera"></div>',
		'className' : 'photo-marker',
		'iconSize' : new L.Point(30, 22)
	});

	var getPhotos = function () {

		$.getJSON('/data/photos.json', function (data) {
			var i, len, marker, icon;
			for (i = 0, len = data.length; i < len; i++) {
				marker = new L.Marker(new L.LatLng(data[i].latitude, data[i].longitude), { 
					'title' : 'photo',
					'icon' : photoIcon
				});
				marker.x_type = 'photo';
				marker.x_id = i;
				marker.addTo(photoLayer);
//				oms.addMarker(marker);
			}
		});
	};

	poiLayer = new L.LayerGroup();
	map.addLayer(poiLayer);

	var commentIcon = new L.DivIcon({
		'html' : '<div class="comment icon-comment"></div>',
		'className' : 'comment-marker',
		'iconSize' : new L.Point(30, 22)
	});

	var maintenanceIcon = new L.DivIcon({
		'html' : '<div class="maintenance icon-wrench"></div>',
		'className' : 'maintenance-marker',
		'iconSize' : new L.Point(30, 22)
	});

	var getPOIs = function () {
		$.getJSON('/data/poi.json', function (pois) {
			var id, marker;

			for (id in pois) {
				if (pois[id].type === 'comment') {
					marker = new L.Marker(new L.LatLng(pois[id].latitude, pois[id].longitude), {
						'icon' : commentIcon	
					});
					marker.x_type = 'comment';
					marker.x_poi = pois[id];
					marker.addTo(poiLayer);
					oms.addMarker(marker);
				}

				if (pois[id].type === 'maintenance') {
					marker = new L.Marker(new L.LatLng(pois[id].latitude, pois[id].longitude), {
						'icon' : maintenanceIcon	
					});
					marker.x_type = 'maintenance';
					marker.x_poi = pois[id];
					marker.addTo(poiLayer);
					oms.addMarker(marker);
				}
			}
		});
	};

	map.on('zoomend', function () {
		var zoomLevel;

		zoomLevel = map.getZoom();
		$('#sidebar .zoominfo span.zoomlevel').text(zoomLevel);
		
		if (zoomLevel >= 10) {

			photoLayer.eachLayer(function (layer) {
				oms.addMarker(layer);
			});

			map.addLayer(photoLayer);

		} else {
			photoLayer.eachLayer(function (layer) {
				oms.removeMarker(layer);
			});

			map.removeLayer(photoLayer);
		}
		
	});

	getStages();
	getPhotos();
	getPOIs();
});
