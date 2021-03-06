var mysql = require('mysql');
var UAParser = require('ua-parser-js');

module.exports = function(dbconf) {
	
	var pool = mysql.createPool(dbconf);
	
	return {
		
		comicsAccessed: function (hours, cb) {
			
			var h = isNaN(hours) ? 1 : Number(hours);
			
			var sql = 'SELECT count(*) as c FROM amphibian.comic_access where ' +
				'(tstamp > date_sub(current_timestamp, interval ' + pool.escape(h) + ' hour)) ' +
				'and (resource regexp \'/images/v/[0-9]+$\')';
			
			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					if (rows.length > 0) {
						var temp = rows[0].c;
						if (isNaN(temp)) {
							cb(new Error('weird error!'));
						} else {
							var count = Number(temp);
							cb(null, count);
						}
					} else {
						cb(null, 0);
					}
				}
				
			});
			
		},
		
		viewsByDay: function(days, cb) {
			
			var d = isNaN(days) ? 7 : Number(days);
			
			if (d > 60) d = 60;
			
			var sql = 'SELECT date(tstamp) as d, count(*) as c FROM amphibian.comic_access where ' +
				'(tstamp > date(date_sub(current_timestamp, interval ' + pool.escape(d) + ' day))) ' +
				'and (resource regexp \'/images/v/[0-9]+$\') ' +
				'group by date(tstamp) order by 1';
			
			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					var data = [];
					for (var r in rows) {
						var day = rows[r].d
						var temp = rows[r].c;
						if (isNaN(temp)) {
							cb(new Error('weird error!'));
						} else {
							var count = Number(temp);
							data.push({
								"day": day,
								"count": count
							});
						}
					}
					cb(null, data);
				}
				
			});
			
		},
		
		topSources: function(hours, cb) {

			var h = isNaN(hours) ? 1 : Number(hours);

			var sql = "SELECT count(*) as c, referer, resource FROM amphibian.comic_access " +
				"where (tstamp > date_sub(current_timestamp, interval " + pool.escape(h) + " hour)) " +
				"and (referer not regexp '^http(s)?://(www\.)?amphibian.com') " +
				"and (resource = '/' or resource regexp '^/(chtml/)?[0-9]+$') " +
				"group by referer order by 1 desc limit 10;";

			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					var data = new Array();
					for (var i = 0; i < rows.length; i++) {
						
						var num = rows[i].c;
						var ref = rows[i].referer;
						var res = rows[i].resource;
						
						var temp = {
							referer: ref,
							resource: res,
							count: num
						};
						
						data.push(temp);

					}
					cb(null, data);
				}
				
			});

		},
		
		topComics: function(hours, cb) {
			
			var h = isNaN(hours) ? 1 : Number(hours);
			
			var sql = "SELECT count(*) as c, resource FROM amphibian.comic_access " +
				"where (tstamp > date_sub(current_timestamp, interval " + pool.escape(h) + " hour)) " +
				"and (resource regexp '/images/v/[0-9]+') " +
				"group by resource order by 1 desc limit 10;";

			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					var data = new Array();
					for (var i = 0; i < rows.length; i++) {
						
						var num = rows[i].c;
						var res = rows[i].resource;
						
						var temp = {
							resource: res,
							count: num
						};
						
						data.push(temp);

					}
					cb(null, data);
				}
				
			});

			
		},
		
		sources: function(hours, cb) {
			
			var h = isNaN(hours) ? 1 : Number(hours);
			
			var sql = 'SELECT count(*) as c, referer, resource FROM amphibian.comic_access ' +
				'where (tstamp > date_sub(current_timestamp, interval ' + pool.escape(h) + ' hour)) ' +
				'and (referer not regexp \'^http(s)?://(www\.)?amphibian.com\') ' +
				'group by referer order by 1 desc;';
			
			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					var data = new Array();
					for (var i = 0; i < rows.length; i++) {
						
						var num = rows[i].c;
						var ref = rows[i].referer;
						var res = rows[i].resource;
						
						var temp = {
							referer: ref,
							resource: res,
							count: num
						};
						
						data.push(temp);

					}
					cb(null, data);
				}
				
			});
			
		},

		agents: function (hours, cb) {

			var h = isNaN(hours) ? 1 : Number(hours);

			var stuff = {
					browser: {
						"firefox": 0,
						"chrome": 0,
						"ie": 0,
						"safari": 0,
						"other": 0
					},
					os: {
						"windows": 0,
						"mac": 0,
						"ios": 0,
						"android": 0,
						"linux": 0,
						"other": 0
					},
					engine: {
						"gecko": 0,
						"khtml": 0,
						"trident": 0,
						"webkit": 0,
						"other": 0
					},
					type: {
						"pc": 0,
						"mobile": 0
					}
				
			};
			
			var sql = 'SELECT agent FROM amphibian.comic_access where ' +
					'(tstamp > date_sub(current_timestamp, interval ' + pool.escape(h) + ' hour))' +
					'and (resource = \'/\' or resource regexp \'^/(chtml/)?[0-9]+$\')';

			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					
					for (var i = 0; i < rows.length; i++) {
						
						var ua = rows[i].agent;
						var parser = new UAParser();
						var r = parser.setUA(ua).getResult();
						
						if (r.browser.name === 'Chrome' || r.browser.name === 'Chromium') {
							stuff.browser.chrome++;
						} else if (r.browser.name === 'Firefox') {
							stuff.browser.firefox++;
						} else if (r.browser.name === 'IE') {
							stuff.browser.ie++;
						} else if (r.browser.name === 'Safari') {
							stuff.browser.safari++;
						} else {
							stuff.browser.other++;
						}
						
						if (r.os.name === 'Windows') {
							stuff.os.windows++;
						} else if (r.os.name === 'Mac OS') {
							stuff.os.mac++;
						} else if (r.os.name === 'iOS') {
							stuff.os.ios++;
						} else if (r.os.name === 'Android') {
							stuff.os.android++;
						} else if (r.os.name === 'Linux') {
							stuff.os.linux++;
						} else {
							stuff.os.other++;
						}
						
						if (r.engine.name === 'Gecko') {
							stuff.engine.gecko++;
						} else if (r.engine.name === 'KHTML') {
							stuff.engine.khtml++;
						} else if (r.engine.name === 'Trident') {
							stuff.engine.trident++;
						} else if (r.engine.name === 'WebKit') {
							stuff.engine.webkit++;
						} else {
							stuff.engine.other++;
						}
						
						
					}
					
					cb(null, stuff);
					
				}
				
			});
			
			

		},
		
		browsers: function (hours, cb) {

			var h = isNaN(hours) ? 1 : Number(hours);

			var stuff = {
					firefox: {},
					chrome: {},
					ie: {},
					safari: {}
			};
			
			var sql = 'SELECT agent FROM amphibian.comic_access where ' +
					'(tstamp > date_sub(current_timestamp, interval ' + pool.escape(h) + ' hour))' +
					'and (resource = \'/\' or resource regexp \'^/(chtml/)?[0-9]+$\')';

			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					
					for (var i = 0; i < rows.length; i++) {
						
						var ua = rows[i].agent;
						var parser = new UAParser();
						var r = parser.setUA(ua).getResult();
						
						var ver = 'v' + r.browser.major;
						var f = null;
						if (r.browser.name === 'Chrome') {
							f = 'chrome';
						} else if (r.browser.name === 'Firefox') {
							f = 'firefox'
						} else if (r.browser.name === 'IE') {
							f = 'ie';
						} else if (r.browser.name === 'Safari') {
							f = 'safari';
						}
						
						if (f) {
							if (stuff[f][ver]) {
								stuff[f][ver]++;
							} else {
								stuff[f][ver] = 1;
							}
						}
						
					}
					
					cb(null, stuff);
					
				}
				
			});

		},
		
		oses: function (hours, cb) {

			var h = isNaN(hours) ? 1 : Number(hours);

			var stuff = {
					windows: {},
					mac: {},
					ios: {},
					android: {},
					linux: {}
			};
			
			var sql = 'SELECT agent FROM amphibian.comic_access where ' +
					'(tstamp > date_sub(current_timestamp, interval ' + pool.escape(h) + ' hour))' +
					'and (resource = \'/\' or resource regexp \'^/(chtml/)?[0-9]+$\')';

			pool.query(sql, function(err, rows) {
				
				if (err) {
					cb(err);
				} else {
					
					for (var i = 0; i < rows.length; i++) {
						
						var ua = rows[i].agent;
						var parser = new UAParser();
						var r = parser.setUA(ua).getResult();
						
						var ver = 'v' + r.os.version;
						var f = null;

						if (r.os.name === 'Windows') {
							f = 'windows';
						} else if (r.os.name === 'Mac OS') {
							f = 'mac';
						} else if (r.os.name === 'iOS') {
							f = 'ios';
						} else if (r.os.name === 'Android') {
							f = 'android';
						} else if (r.os.name === 'Linux') {
							f = 'linux';
						}
						
						if (f) {
							if (stuff[f][ver]) {
								stuff[f][ver]++;
							} else {
								stuff[f][ver] = 1;
							}
						}
						
					}
					
					cb(null, stuff);
					
				}
				
			});

		}
		
		

	};
	
};