$(document).ready(function () {
	var map = L.map('map').setView([45.49672, 10.23651], 13);

	L.tileLayer('http://{s}.tile.cloudmade.com/{api}/997/256/{z}/{x}/{y}.png', {
		'attribution' : 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
		'maxZoom' : 18,
		'api' : '4099a7fbbbde4acc900a97e756dea44f'
	}).addTo(map);

	var defaultStyle = {
		'color' : '#2262CC',
		'weight' : 4,
		'opacity' : 0.8
	};

	var highlightStyle = {
		'color' : '#FF0033', 
		'weight' : 4,
		'opacity' : 0.8
	};

	var onEachFeature = function (feature, layer) {
		console.log('ID', L.Util.stamp(layer));
		layer.setStyle(defaultStyle);

		(function(layer, properties) {
			layer.on("mouseover", function (e) {
				layer.setStyle(highlightStyle);
			});

			layer.on("mouseout", function (e) {
				console.log(e);
				layer.setStyle(defaultStyle); 
			});

		})(layer, feature.properties);
	};

	var featureLayer = L.geoJson(null, {
		'onEachFeature' : onEachFeature
	});
	map.addLayer(featureLayer);

	var getStages = function () {
		$.getJSON('/data/stages.json', function(data) {
			var i, len;
			for (i = 0, len = data.length; i < len; i++) {
				$.getJSON('/data/' + data[i] + '.json', function (collection) {
					featureLayer.addData(collection);
				});
			}
		});
	};

	getStages();
});
