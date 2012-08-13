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
		'fillColor' : 'transparent'
	};

	var featureLayer;
	var stages = {};

	map.on('zoomed', function () {
		// map.getZoom();
	});

	var fetchFullLayer = function (name) {
		var layer = stages[name].normal;

		if (stages.hasOwnProperty(name) && stages[name].full === null) {
			$('#loader').loader('start');
			map.fitBounds(layer.getBounds());

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

	var onEachFeature = function (feature, layer) {
		var layerName = feature.properties.name;
		layer.setStyle(defaultStyle);

		if (!stages.hasOwnProperty(layerName)) {
			stages[layerName] = {
				'normal' : layer,
				'full' : null
			};

			var rect = new L.Rectangle(layer.getBounds());
			rect.setStyle(rectStyle);

			rect.on('mouseover', function (e) {
				highlightLayer(layerName, true);
			});

			rect.on('mouseout', function (e) {
				highlightLayer(layerName, false);
			});

			rect.on('click', function (e) {
				fetchFullLayer(layerName);
			});

			map.addLayer(rect);

		} else {
			featureLayer.removeLayer(stages[layerName].normal);
			$('#loader').loader('stop');
			stages[layerName].full = layer;
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
					count++;
					if (count === (len -1)) {
						map.fitBounds(featureLayer.getBounds());
					}
				});
			}
		});
	};

	var getPhotos = function () {
		var oms = new OverlappingMarkerSpiderfier(map);

		$.getJSON('/data/photos.json', function (data) {
			var i, len;
			for (i = 0, len = data.length; i < len; i++) {
				var marker = new L.Marker(new L.LatLng(data[i].latitude, data[i].longitude), { 
					'title' : 'photo',
					'icon' : new L.Icon({
						'iconUrl' : data[i].url_sq,
						'iconSize' : [22, 22]
					})
				});
				marker.addTo(map);
				oms.addMarker(marker);
			}
		});
	};

	getStages();
	getPhotos();
});
