
DB = function() {
	var db = null;

	return {
		open: function(handler) {
			try {
				db = openDatabase("RunTracking", "1.0", "List of GPS tracking", 1024 * 1024);
			} catch (e) {
				alert("cannot support openDatabase()");
				return false;
			}

			// create if not exist 'path' table
			db.transaction(function(tx) {
				tx.executeSql("CREATE TABLE IF NOT EXISTS path(idx INTEGER PRIMARY KEY AUTOINCREMENT, latitude, longitude)");
				if (handler)
					handler();
			});

			return true;
		},
		addPosition: function(latitude, longitude) {
			db.transaction(function(tx) {
				tx.executeSql("INSERT INTO path(latitude, longitude) VALUES(?, ?)", [latitude, longitude]);
			});
		},
		getPositions: function(handler) {
			db.transaction(function(tx) {
				tx.executeSql("SELECT * FROM path ORDER BY idx", [], function(tx, results) {
					if (handler) {
						var len = results.rows.length;
						var res = [];
						for (var i = 0; i < len; i++) {
							var item = results.rows.item(i);
							//alert(item.idx + " : " + item.latitude + ", " + item.longitude);
							res.push({idx: item.idx, latitude: item.latitude, longitude: item.longitude});
						}
						handler(res);
					}
				});
			});
		},
		clear: function() {
			db.transaction(function(tx) {
				tx.executeSql("DELETE FROM path");
			});
		}
	};
}();

