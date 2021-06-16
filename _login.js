const settings = require('settings-store');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
require('./globals.js');

settings.init({
    appName:       "MarketSniper", //required,
    publisherName: "MarketSniper", //optional
    reverseDNS:    "com.marketsniper" //required for macOS
});

let GameMajorVersion;

/* **** SENDER FUNCTION **** */
function send_launcher(url, _port = 443, path, data){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: 'POST',
		  headers: {
			  'User-Agent':			'BSG Launcher ' + launcherVersion,
			  'Content-Type': 		'application/json',
			  'Method': 			'POST'
		  } 
		};
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				// check if PHPSESSID isnt setted already - for more then 1 request
				if(PHPSESSID == '') 
					PHPSESSID = res.headers['set-cookie'][1].replace("; path=/", "").replace("PHPSESSID=",""); // properly grab PHPSESSID from server
				if(L_TOKEN == '')
					L_TOKEN = '';
					// display whats going on
				//console.log("[URL] " + path + " [StatusCode]" + res.statusCode); 

				let chunks = [];
				res.on('data', (d) => {
					chunks.push(d);
				});
				res.on('end', function(){
					resolve(Buffer.concat(chunks));
				});
			});
			// return error if error on request
			req.on('error', err => {
				reject(err); 
			});
			req.write(buffer);
			req.end();
		});
	});
}

function sendSessionRequest(url, _port = 443, path, data){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: 'POST',
		  headers: {
			  'User-Agent':			'BSG Launcher ' + launcherVersion,
			  'Content-Type': 		'application/json',
			  'Method': 			'POST',
			  'Authorization': 		settings.value("Profile.access_token")
		  } 
		};
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				// check if PHPSESSID isnt setted already - for more then 1 request
				if(PHPSESSID == '') 
					PHPSESSID = res.headers['set-cookie'][1].replace("; path=/", "").replace("PHPSESSID=",""); // properly grab PHPSESSID from server
				if(L_TOKEN == '')
					L_TOKEN = '';
					// display whats going on
				//;lconsole.log("[URL] " + path + " [StatusCode]" + res.statusCode); 

				let chunks = [];
				res.on('data', (d) => {
					chunks.push(d);
				});
				res.on('end', function(){
					resolve(Buffer.concat(chunks));
				});
			});
			// return error if error on request
			req.on('error', err => {
				reject(err); 
			});
			req.write(buffer);
			req.end();
		});
	});
}

function select_profile(url, _port = 443, path, data, type = "POST"){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: type,
		  headers: {
			  'User-Agent':			settings.value("GameConstants.UnityPlayerVersion"),
			  'Content-Type': 		'application/json',
			  'Accept': 			'application/json',
			  'App-Version': 		settings.value("GameConstants.AppVersion"),
			  'GClient-RequestId': 	'5',
			  'X-Unity-Version':    settings.value("GameConstants.XUnityVersion")
		  } 
		};
		//console.log(options);
		if(PHPSESSID !== ''){ // assign phpsessid only once
			options['headers']['Cookie'] = "PHPSESSID=" + settings.value("Profile.session_token");
		}
		integer++; // add integer number to request counting requests and also making their stupid RequestId Counter
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				//if(typeof res.headers['set-cookie'][1] != "undefined")
					//PHPSESSID = settings.get("Profile.session_token");//res.headers['set-cookie'][1].replace("PHPSESSID=","").replace("; path=/",""); // properly grab PHPSESSID from server
				//console.log("["+integer+"][URL]> " + path + " [StatusCode]" + res.statusCode);
				if(res.statusCode != 200){ 
					reject("No Response: " + res.statusCode);
				}
				let chunks = [];
				res.on('data', (d) => {
					chunks.push(d);
				});
				res.on('end', function(){
					resolve(Buffer.concat(chunks));
				});
			});
			// return error if error on request
			req.on('error', err => {
				reject(err); 
			});
			req.write(buffer);
			req.end();
		});
	});
}

/* **** MAIN EXECUTABLE FUNCTION **** */
async function VersionRequests(){
	InternalRequest_Launcher(launcher_url, '/launcher/GetDistrib', ""); //get latest GameMajor version
	InternalRequest_Launcher(launcher_url, '/launcher/GetLauncherDistrib', ""); //get latest Launcher version
}


async function LoginRequests(){
	var rString = util.randomizeID();
	settings.setValue("Profile.PHPSESSID", rString);

	let dataLogin = "{\"email\":\"" + settings.value("Profile.username") + "\",\"pass\":\"" + settings.value("Profile.password") + "\",\"hwCode\":\"" + settings.value("Profile.hwCode") + "\",\"captcha\":\"true\"}"
	let startGameData = JSON.stringify({
		version: {
			major: settings.value("GameConstants.GameMajor"),
			game: "live",
			backend: "6"
		},
		hwCode: settings.value("Profile.hwCode")
	});

	setTimeout(() => {
		console.log("Sending launcher login...");
		InternalRequest_Launcher(launcher_url, '/launcher/login', dataLogin); //get access_token

		setTimeout(() => {
			console.log("Sending game start...");
			InternalRequest_Prod(url, '/launcher/game/start', startGameData, false); //get session_token

			setTimeout(() => {
				console.log("Sending profile select...");
				ClientRequests() //select profile
			}, 4000);
		}, 2000);
	}, 2000);
}

async function ClientRequests(){

	let res = await select_profile(url, 443, '/client/game/profile/select', '{"uid": "' + settings.value("Profile.uid") + '"}');
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + '/client/game/profile/select'.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				//console.log(body);
				if(JSON.parse(body)['err'] == 0) {
					console.log("%cProfile selected!\n", "color: green ; font-weight: bold")

					//profile selected successfully...now do some gang shit
					if(market_f.GetInventoryConstants()) {
						setTimeout(() => {
							console.log("Starting Bot...");
							market_f.MarketRequests();

						}, 3000);
					}
				}
				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}
	});
	await util.sleep(150);
	
}

/* **** SEPARATE URL RESOLVER FUNCTION **** */
async function InternalRequest_Launcher(launcher_url, path, data){
	let res = await send_launcher(launcher_url, 443, path, data);
	let body = await zlibBody(res, path);
	let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
	body = body.toString("utf-8");
	if(body != ""){
		if(path == "/launcher/GetDistrib"){ 		// gameVersion
			let tempData = JSON.parse(body);
			gameVersion	= tempData['data']['Version'];
			GameMajorVersion = gameVersion;
			settings.setValue("Versions.GameMajorVersion", GameMajorVersion);
			console.log("[VERSIONS] game:" + GameMajorVersion);
		}
		if(path == "/launcher/GetLauncherDistrib"){ // launcherVersion
			let tempData = JSON.parse(body);
			launcherVersion	= tempData['data']['Version'];
			settings.setValue("Versions.LauncherVersion", launcherVersion);
			console.log("[VERSIONS] launcher:" + launcherVersion);
		}
		if(path == "/launcher/login"){
			let tempData = JSON.parse(body);
			let errCode = tempData['err'];
			let errMsg = tempData['errmsg'];

			//console.log(tempData)
			if(errCode == 230) {
				let sleepTime = tempData['data']['ban_time_left'];
				console.log("Ban Time Left: " + tempData['data']['ban_time_left']);
				console.log(`Sleeping for ${sleepTime}`);
				util.sleep(sleepTime)
			}
			else if(errCode == 206) {
				console.log(errMsg)
				process.exit(1);
			} else if(errCode == 214) {
				console.log("Captcha Required!")
				process.exit(1);
			} else if(errCode == 213) {
				console.log("CODE 213. Error connecting to auth server!");
				process.exit(1);
			} else if(errCode == 0) {
				access_token = tempData['data']['access_token'];
				//console.log("access_token: " + access_token);
				settings.setValue("Profile.access_token", access_token);
				console.log("access_token grabbed successfully");
			}

		}
	} else {
		console.log(body);
	}
	/*if(path == "/launcher/login"){}*/
	util.writeJson(filename, body);
	util.sleep(1000);
}

async function InternalRequest_Prod(launcher_url, path, data, select){
	let res;
	if(!select) {
		res = await sendSessionRequest(launcher_url, 443, path, data);
	} else {
		res = await select_profile(url, 443, '/client/game/profile/select', data);
	}
	let body = await zlibBody(res, path);
	let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
	body = body.toString("utf-8");
	let tempData = JSON.parse(body);
	
	if(body != ""){
		if(path == "/launcher/game/start"){
			let err = tempData['err'];
			let errMsg = tempData['errMsg'];

			if(err == 201) {
				console.log("CODE 201. Profile not selected!");
			} else if(err == 232) {
				console.log("Wrong Major Version!");
			} else if(err == 0) {
				session_token = tempData['data']['session'];
				settings.setValue("Profile.session_token", session_token);
				console.log("Grabbed session_token successfully: " + settings.value("Profile.session_token"));

				//write session_token to json file for scaling multiple containers
				let json_sessiontoken = JSON.stringify({
					session_token: session_token,
					item: settings.value("Config.Item"),
					_tpl: settings.value("Config._tpl")
				});
				util.writeSessionToken(session_token, json_sessiontoken);
				console.log("Stored session_token in config for later scaling...")
			}

		}
	} else {
		console.log(body);
	}
	util.writeJson(filename, body);
	util.sleep(1000);
}

/* **** BODY_DEFLATE FUNCTION **** */
function zlibBody(res, path){
	return new Promise( function( resolve, reject ) {
		zlib.inflate(res, function(err, buffer) {
			if(err){
				console.log("Error with inflate:");
				reject(err);
			}
			resolve(buffer);
		});
	});
}

// export only executable function
module.exports.LoginRequests = LoginRequests;
module.exports.VersionRequests = VersionRequests;
