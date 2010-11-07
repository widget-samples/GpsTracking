var isFullscreen = false;
var poly = null;
var map = null;
var startMarker = null;
var endMarker = null;
var walked = 0.0;
var goal = 0.0;
var statusView = null;
var mapInitialized = false;

var lastLatitude = null;
var lastLongitude = null;
var lastDiff = 0;
var watchId = null;

// for debug
var debug_index = 0;
var debug_add_p = 0;


function initialize() {
	goal = localStorage.getItem("goal");
	if (goal) {
		goal = parseInt(goal);
	}
	else {
		goal = 1000;	// 1000 m
		localStorage.setItem("goal", goal);
	}

	DB.open(function() {
		DB.getPositions(setWalked);
	});

	if (navigator.geolocation) {
		statusView = document.querySelector('#status');
		watchId = navigator.geolocation.watchPosition(success, error, {enableHighAccuracy: true});
	} else {
		error('geolocation is not supported');
	}
}

function unloadMap() {
	if (poly)
		poly.setMap(null);
	poly = null;
	map = null;
	startMarker = null;
	endMarker = null;
	mapInitialized = false;
	lastLatitude = null;
	lastLongitude = null;
	lastDiff = 0;

	if (watchId) {
		navigator.geolocation.clearWatch(watchId);
		watchId = null;
	}
}

function loadMap() {
	navigator.geolocation.getCurrentPosition(function(position) {
		initMap(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
	}, error);
}

function initMap(latlng) {
	mapInitialized = true;

	var myOptions = {
		zoom:17,
		center: latlng,
		mapTypeControl: false,
		navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.querySelector('#map_canvas'), myOptions);

	var polyOptions = {
		strokeColor: '#000000',
		strokeOpacity: 1.0,
		strokeWeight: 3
	};
	poly = new google.maps.Polyline(polyOptions);
	poly.setMap(map);

	// for test
	/*
	google.maps.event.addListener(map, 'click', function(ev) {
		addPosition(ev.latLng.lat(), ev.latLng.lng(), true);
		updateCurrentMeter();
	});
	*/

	// load from DB
	DB.getPositions(resetDataFromDatabase);
}

function success(position) {
	addPosition(position.coords.latitude, position.coords.longitude, true);
	updateCurrentMeter();
}

function addPosition(latitude, longitude, toInsertDB) {
	if (lastLatitude == null || lastLongitude == null)
		lastDiff = 0.0;
	else
		lastDiff = getMeter(latitude, longitude, lastLatitude, lastLongitude);

	// check threshold
	//if (lastLatitude != null && lastLongitude != null && (lastDiff < 30.0 || 500.0 < lastDiff))
	if (lastLatitude != null && lastLongitude != null && lastDiff < 30.0)
		return;

	if (toInsertDB) {
		debug_add_p++;
		walked += lastDiff;
		lastLatitude = latitude;
		lastLongitude = longitude;
	}

	var latlng = new google.maps.LatLng(latitude, longitude);
	statusView.innerHTML = latlng;

	if (isFullscreen) {
		if (map)
			map.setCenter(latlng);

		addPath(latlng);
	}

	// add to database
	if (toInsertDB)
		DB.addPosition(latitude, longitude);
}

function error(msg) {
	statusView.innerHTML = typeof msg == 'string' ? msg : "failed";
	statusView.className = 'fail';
}

function addPath(latLng) {
	var path = poly.getPath();

	// Because path is an MVCArray, we can simply append a new coordinate
	// and it will automatically appear
	path.push(latLng);

	if (!startMarker) {
		startMarker = new google.maps.Marker({
			position: latLng,
			title: 'Start',
			map: map
		});
		endMarker = new google.maps.Marker({
			position: latLng,
			title: 'End',
			map: map
		});
	}
	else {
		endMarker.setPosition(latLng);
	}
}

function resetDataFromDatabase(data) {
	if (isFullscreen) {
		if (startMarker) {
			startMarker.setMap(null);
			startMarker = null;
		}
		if (endMarker) {
			endMarker.setMap(null);
			endMarker = null;
		}
	}

	for (var i in data) {
		var item = data[i];
		addPosition(item.latitude, item.longitude, false);
	}
	updateCurrentMeter();
}

var METER_BY_DEGREE_LATITUDE = 111000.0;
var METER_BY_DEGREE_LONGITUDE = 88800.0;

function getMeter(lat1, lng1, lat2, lng2) {
	var latDist = Math.abs(lat1 - lat2);
	var lngDist = Math.abs(lng1 - lng2);
	var latMeter = latDist * METER_BY_DEGREE_LATITUDE;
	var lngMeter = lngDist * METER_BY_DEGREE_LONGITUDE;
	return Math.sqrt(latMeter * latMeter + lngMeter * lngMeter);
}

function updateCurrentMeter() {
	var statusString = walked.toFixed(0) + " / " + goal + " m";
	var diffString = /*lastDiff.toFixed(3) + " m" +*/ " (" + (++debug_index) + ", " + debug_add_p + ")";
	
	document.getElementById("meter").innerHTML = statusString;
	document.getElementById("status_move").innerHTML = statusString;

	// for debug
	//$("#log").append(statusString + " : " + diffString + "<br />");
}

function setWalked(data) {
	var w = 0.0;
	for (var i in data) {
		if (i != 0)
			w += getMeter(data[i - 1].latitude, data[i - 1].longitude, data[i].latitude, data[i].longitude);
	}
	updateCurrentMeter();
}

function saveGoal(g) {
	if (g.toString().match(/[0-9]+/)) {
		localStorage.setItem('goal', g);
		goal = g;
		updateCurrentMeter();
	}
	else {
		alert('Input a positive number');
	}
}

function clearAndReload() {
	DB.clear();

	if (watchId) {
		navigator.geolocation.clearWatch(watchId);
		watchId = null;
	}

	initialize();
	alert('Cleared');
}
