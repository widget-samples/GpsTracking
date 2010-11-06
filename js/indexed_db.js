
DB = function() {
	var connection = null;
	var positions = null;
	
	return {
		open: function(handler) {
			try {
				connection = indexedDB.open("RunTracking", "List of GPS tracking");
			} catch (e) {
				alert("cannot support indexedDB");
				return false;
			}
			
			// get or create ObjectStore
			try {
				positions = connection.openObjectStore("path");
			} catch (e) {
				positions = connection.createObjectStore("path", "idx", true);
			}
			
			if (handler)
				handler();
			return true;
		},
		addPosition: function(latitude, longitude) {
			positions.put({latitude: latitude, longitude: longitude});
		},
		getPositions: function(handler) {
			var results = [];
			var cursor = positions.openCursor();
			if (cursor.count > 0) {
				do {
					results.push({idx: cursor.key, latitude: cursor.value.latitude, longitude: cursor.value.longitude});
				} while (cursor.continue());
			}
			handler(results);
		},
		clear: function() {
			connection.removeObjectStore("path");
			connection.createObjectStore("path", "idx", true);
		}
	};
}();
