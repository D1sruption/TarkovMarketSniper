const settings = require('settings-store');
const { fork } = require('child_process');

require('./globals.js');

PHPSESSID = settings.value("Profile.session_token");
//console.log("Loaded PHPSESSID: " + PHPSESSID);
var shopping_list = [
	//"57347ca924597744596b4e71", //Graphics Card
	//"5c12688486f77426843c7d32", //Paracord
	//"59faff1d86f7746c51718c9c", //bitcoin
	//"5a1eaa87fcdbcb001865f75e", //reap-ir
	//"5d03794386f77420415576f5", //STEN military battery
	"5c0e530286f7747fa1419862" //propital
];

async function MarketRequests(){
	
	for(var i = 0; i < shopping_list.length; i++) {
		//console.log(i);
		//marketLoop(i);
		//QueryMarket(shopping_list[i]);
		await GetMarketAverage(shopping_list[i]);
	};
}

async function GetInventoryConstants() {
	if(QueryInventory()) {
		return true;
	}
	//getRoubleStacksForMerge();
	return false;
}

/* **** SENDER FUNCTION **** */
function send_request(url, _port = 443, path, data, type = "POST"){
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
			  'GClient-RequestId': 	15,
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

async function QueryInventory() {
	let path = "/client/game/profile/list";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				//console.log(JSON.parse(body)['data'][0]._id); //prints 5df78c2987ba573dcd7dc077
				//console.log(data[0].Inventory.items);

				//check if profile is correct
				if(data[0].Inventory.items.length > 25) {
					data = data[0];
				} else {
					data = data[1];
				}

				var i;
				var iLength = data.Inventory.items.length;
				console.log("\nNumber of unique items in inventory:" + iLength);
				var item;
				var totalMoney = 0;
				var numStacks = 0;

				//################TODO#####################//
				//REDO THE _TPL ID CHECKING WITH A FOR LOOP TO BE MORE EFFECIENT
				var numPropital = 0;
				var numGfxCards = 0;
				var numParacord = 0;
				var numBTC = 0;
				var numReapIR = 0;
				var numSTEN = 0;
				for(i = 0; i < iLength; i++) {
					item = data.Inventory.items[i];
					var _id = item._id;
					var _tpl = item._tpl;
					//console.log(item.upd)
					if(_tpl == "5449016a4bdc2d6f028b456f") { //roubles
						numStacks++;
						totalMoney += item.upd.StackObjectsCount;
					}
					if(_tpl == "5c0e530286f7747fa1419862") { //propital
						numPropital++;
					}
					if(_tpl == "57347ca924597744596b4e71") { //graphics card
						numGraphicsCards++;
					}
					if(_tpl == "5c12688486f77426843c7d32") { //paracord
						numParacord++;
					}
					if(_tpl == "59faff1d86f7746c51718c9c") { //BTC
						numBTC++;
					}
					if(_tpl == "5a1eaa87fcdbcb001865f75e") { //ReapIR
						numReapIR++;
					}
					if(_tpl == "5d03794386f77420415576f5") { //STEN
						numSTEN++;
					}
				}

				util.write_debug(`Total Money in inventory: ${numberWithCommas(totalMoney.toFixed(2))} | Unique Items: ${iLength}`);
				util.write_debug(`Graphics Cards: ${numGfxCards} | Paracord: ${numParacord} | BTC: ${numBTC} | ReapIR: ${numReapIR} | STEN: ${numSTEN} | Propital: ${numPropital}`);

				console.log(`Total Money: ${numberWithCommas(totalMoney.toFixed(2))} in ${numStacks} stacks`);
				console.log(`Number of Propital in inventory: ${numPropital}\n\n`);

				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}
	});
	await util.sleep(150);

	return true;
}

async function QueryMarket(templateId, itemName) {
	//console.log("Querying market...");;
	var avg = settings.value("Market.FinalAverage");
	if(isNaN(avg)) {
		return;
	}
	var BestOfferID = "";
	var BestOfferCost = 0;

	let path = "/client/ragfair/find";
	let data = "{\"page\":0,\"limit\":1,\"sortType\":5,\"sortDirection\":0,\"currency\":0,\"priceFrom\":0,\"priceTo\":0,\"quantityFrom\":0,\"quantityTo\":0,\"conditionFrom\":0,\"conditionTo\":100,\"oneHourExpiration\":false,\"removeBartering\":true,\"offerOwnerType\":0,\"onlyFunctional\":true,\"updateOfferCount\":true,\"handbookId\":\"" + templateId + "\",\"linkedSearchId\":\"\",\"neededSearchId\":\"\",\"buildItems\":{ },\"buildCount\":0,\"tm\":1}";

	let res = await send_request(url_ragfair, 443, path, data);
	zlib.inflate(res, async function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				//console.log(data);
				var offers = data.offers;
				var costs;
				//console.log(data.offers.length);

				for(var i = 0; i < offers.length; i++) {
					let offer = offers[i];
					if(offer.requirements[0]._tpl == "5449016a4bdc2d6f028b456f") {
						//console.log("Offer is for RUB");
						costs = offer.requirements[0].count;

						if(templateId == "5c0e530286f7747fa1419862") { //if propital...then you can snipe for more than average - 40k
							console.log("%cChecking Propital...", 'color:red');
							if(costs <= 11000) { 
								BestOfferID = offer._id;
								BestOfferCost = offer.requirements[0].count;
							
								settings.setValue("Market.BestOfferID", BestOfferID);
								settings.setValue("Market.BestOfferCost", BestOfferCost);
								console.log(`Best Offer ID: ${BestOfferID} | Best Offer Costs: ${BestOfferCost}`);

								//send buy request
								GetMoneyStackID(BestOfferCost, itemName);
								return true;
							} else {
								console.log("Offer requirements not met! Costs: " + costs + " | Average: " + settings.value("Market.FinalAverage") + " | Propital");
								console.log("Difference: " + Math.abs(costs - settings.value("Market.FinalAverage")));
								var timeout = Math.floor(Math.random() * (15 - 5 + 1) + 5);
								console.log(`Timing out for ${timeout} seconds...`);
								setTimeout(() => {
									MarketRequests();

									return false;
								}, timeout*1000); //THIS CHANGES POLL RATE FOR MARKET REQUESTS

								
							}
						} else if(templateId == "5d03794386f77420415576f5") { //STEN
							console.log("%cChecking STEN...", 'color:red');
							if(costs <= 100000) { //was 40 000
								BestOfferID = offer._id;
								BestOfferCost = offer.requirements[0].count;
							
								settings.setValue("Market.BestOfferID", BestOfferID);
								settings.setValue("Market.BestOfferCost", BestOfferCost);
								console.log(`Best Offer ID: ${BestOfferID} | Best Offer Costs: ${BestOfferCost}`);

								//send buy request
								GetMoneyStackID(BestOfferCost, "STEN");
								return true;
							} else {
								console.log("Offer requirements not met! Costs:" + costs + " | Average: " + settings.value("Market.FinalAverage") + " | STEN");
								console.log("Difference: " + diff);

								console.log("\nSleeping for 3 seconds...");

								setTimeout(() => {
									MarketRequests();

									return false;
								}, 5000); //THIS CHANGES POLL RATE FOR MARKET REQUESTS
								
							}
							
						} else if(templateId == "59faff1d86f7746c51718c9c") { //BTC
							console.log("%cChecking BTC...", 'color:red');
							if(costs <= 100000) {
								BestOfferID = offer._id;
								BestOfferCost = offer.requirements[0].count;
							
								settings.setValue("Market.BestOfferID", BestOfferID);
								settings.setValue("Market.BestOfferCost", BestOfferCost);
								console.log(`Best Offer ID: ${BestOfferID} | Best Offer Costs: ${BestOfferCost}`);

								//send buy request
								GetMoneyStackID(BestOfferCost, "Bitcoin");
								return true;
							} else {
								console.log("Offer requirements not met! Costs: " + costs + " | Average: " + settings.value("Market.FinalAverage") + " | Bitcoin");
								console.log("Difference: " + diff);

								console.log("\nSleeping for 3 seconds...");

								setTimeout(() => {
									MarketRequests();

									return false;
								}, 5000); //THIS CHANGES POLL RATE FOR MARKET REQUESTS
								
							}
						} else if(templateId == "5c12688486f77426843c7d32") { //paracord
							console.log("%cChecking Paracord...", 'color:red');
							if(costs <= 150000) {
								BestOfferID = offer._id;
								BestOfferCost = offer.requirements[0].count;
							
								settings.setValue("Market.BestOfferID", BestOfferID);
								settings.setValue("Market.BestOfferCost", BestOfferCost);
								console.log(`Best Offer ID: ${BestOfferID} | Best Offer Costs: ${BestOfferCost}`);

								//send buy request
								GetMoneyStackID(BestOfferCost, "Paracord");
								return true;
							} else {
								console.log("Offer requirements not met! Cost: " + costs + " | Average" + settings.value("Market.FinalAverage") + " | Paracord");
								console.log("Difference: " + diff);

								console.log("\nSleeping for 3 seconds...");

								setTimeout(() => {
									MarketRequests();

									return false;
								}, 5000); //THIS CHANGES POLL RATE FOR MARKET REQUESTS
								
							}
						} else if(templateId == "57347ca924597744596b4e71") { //Graphics Card
							console.log("%cChecking Graphics Card...", 'color:red');
							var difference = GetMarketAverage(templateId);
							if(difference == "NaN"){
								break;
							}
							if(costs <= 150000) {
								BestOfferID = offer._id;
								BestOfferCost = offer.requirements[0].count;
							
								settings.setValue("Market.BestOfferID", BestOfferID);
								settings.setValue("Market.BestOfferCost", BestOfferCost);
								console.log(`Best Offer ID: ${BestOfferID} | Best Offer Costs: ${BestOfferCost}`);

								//send buy request
								GetMoneyStackID(BestOfferCost, "Graphics Card", templateId);
								return true;
							} else {
								console.log("Offer requirements not met! Cost: " + costs + " | Average: " + difference + " | Graphics Card");
								console.log("Difference: " + difference);

								console.log("\nSleeping for 3 seconds...");

								setTimeout(() => {
									MarketRequests();

									return false;
								}, 5000); //THIS CHANGES POLL RATE FOR MARKET REQUESTS
								
							}
						}



					}
					if(templateId == "5c0e530286f7747fa1419862") {
						console.log("Propital | " + offers[i]._id + " | By: " + offers[i].user.nickname + " | For: " + numberWithCommas(offer.requirementsCost));
					} else if(templateId == "5d03794386f77420415576f5") {
						console.log("STEN | " + offers[i]._id + " | By: " + offers[i].user.nickname + " | For: " + numberWithCommas(offer.requirementsCost));
					} else if(templateId == "59faff1d86f7746c51718c9c") {
						console.log("Bitcoin | " + offers[i]._id + " | By: " + offers[i].user.nickname + " | For: " + numberWithCommas(offer.requirementsCost));
					} else if(templateId == "5c12688486f77426843c7d32") {
						console.log("Paracord | " + offers[i]._id + " | By: " + offers[i].user.nickname + " | For: " + numberWithCommas(offer.requirementsCost));
					} else if(templateId == "57347ca924597744596b4e71") {
						console.log("Graphics Card | " + offers[i]._id + " | By: " + offers[i].user.nickname + " | For: " + numberWithCommas(offer.requirementsCost));
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
	return false;
}

async function BuyItem(MoneyID, BestOfferID, BestOfferCost, itemName) {
	let purchased = false;
	let path = "/client/game/profile/items/moving";
	let data = "{\"data\":[{\"Action\":\"RagFairBuyOffer\",\"offers\":[{\"id\":\"" + BestOfferID + "\",\"count\":1,\"items\":[{\"id\":\"" + MoneyID + "\",\"count\":" + BestOfferCost + "}]}]}],\"tm\":2}";

	//console.log("MoneyID: " + MoneyID + " | BestOfferID: " + BestOfferID + " | BestOfferCost: " + BestOfferCost);
	//console.log(data);
	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				let err = body['err'];
				let tempData = JSON.parse(body)['data'];
				//let badRequest = JSON.parse(tempData['badRequest']);

				//util.sendMail(body);

				//console.log(body);
				//console.log(tempData);
				// console.log(brErrMsg);
				//util.write_debug(`Purchased: ${itemName} for ${BestOfferCost} | MarketAverage: ${settings.value("Market.FinalAverage")}`);

				try {
					if(tempData.hasOwnProperty("badRequest")) {
						if(tempData.badRequest.length != 0) {
							if(tempData.badRequest[0].err == 1503) {
								console.log("CODE 1503. Offer already purchased!");
							}else if(tempData.badRequest[0].err == 1506) {
								console.log("CODE 1506");
								console.log(tempData['badRequest']['errmsg']);
							} else if(tempData.badRequest[0].err == 228) {
								console.log("CODE 228. Filed to lock profile...sleeping");
								util.sleep(5000);
							}
						}

					}
					
					try {
						if(tempData.items.new[0]._id != "") {
							console.log("%cThe real purchase is here!", 'color: green ; font-weight: bold')
							purchased = true;
						}
					} catch (error) {
						//console.log("")
					}


				} catch(error) {
					console.log(error);
					util.write_debug(error);
				}


				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}

				util.writePurchase(itemName + " | " + body + `\nBestOfferCost: ${BestOfferCost} | BestOfferID: ${BestOfferID} | MoneyID: ${MoneyID} | MarketAverage: ${settings.value("Market.FinalAverage")}\n\n`);
				if(purchased) {
					var currentTime = new Date();
					var timeout = Math.floor(Math.random() * (15 - 5 + 1) + 5);
					var difference = new Date( currentTime );
					difference.setMinutes(currentTime.getMinutes() + timeout);
					console.log(`%cFor humanization we are pausing for ${timeout} minutes. Time for resume: ${difference.getHours()}:${difference.getMinutes()}:${difference.getSeconds()}`, 'color: red ; font-weight: bold')
					pause(timeout*60000); //pause for 5 minutes
					getPropitalID();
				}
				
				if(GetInventoryConstants()) {
					MarketRequests();
				}
				
	});
	await util.sleep(150);

	//ipc.emit('re-query');
}

async function sellToTherapist(_id) {
	let path = "/client/game/profile/items/moving";
	let data = "{\"data\":[{\"Action\":\"TradingConfirm\",\"type\":\"sell_to_trader\",\"tid\":\"54cb57776803fa99248b456e\",\"items\":[{\"id\":\"" + _id + "\",\"count\":1,\"scheme_id\":0}]}],\"tm\":2,\"reload\":1}";

	//console.log("MoneyID: " + MoneyID + " | BestOfferID: " + BestOfferID + " | BestOfferCost: " + BestOfferCost);
	//console.log(data);
	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				let err = body['err'];
				let tempData = JSON.parse(body)['data'];

				//console.log(body);

			
				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}

				util.writePurchase(`Sold ${_id} to therapist!\n`);
				console.log(`%cSold ${_id} to therapist!`, 'color: yellow ; font-weight: bold')
				QueryInventory();
				
	});
	await util.sleep(150);
}

async function getPropitalID() {
	let path = "/client/game/profile/list";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, async function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				//console.log(JSON.parse(body)['data'][0]._id); //prints 5df78c2987ba573dcd7dc077
				//console.log(data[0].Inventory.items);

				//check if profile is correct
				if(data[0].Inventory.items.length > 25) {
					data = data[0];
				} else {
					data = data[1];
				}

				var i;
				var iLength = data.Inventory.items.length;
				//console.log("\nNumber of unique items in inventory:" + iLength);
				var item;

				//################TODO#####################//
				//REDO THE _TPL ID CHECKING WITH A FOR LOOP TO BE MORE EFFECIENT
				for(i = 0; i < iLength; i++) {
					item = data.Inventory.items[i];
					var _id = item._id;
					var _tpl = item._tpl;
					//console.log(item.upd)
					if(_tpl == "5c0e530286f7747fa1419862") { //propital
						console.log("Pausing for 3 seconds...");
						pause(3000);
						sellToTherapist(_id);
						break;
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

	return true;
}

function pause(miliseconds) {
	var currentTime = new Date().getTime();
 
	while (currentTime + miliseconds >= new Date().getTime()) {
	}
 }

async function GetMarketAverage(templateId) {
	
	let path = "/client/ragfair/find";
	let data = "{\"page\":0,\"limit\":5,\"sortType\":5,\"sortDirection\":0,\"currency\":0,\"priceFrom\":0,\"priceTo\":0,\"quantityFrom\":0,\"quantityTo\":0,\"conditionFrom\":0,\"conditionTo\":100,\"oneHourExpiration\":false,\"removeBartering\":true,\"offerOwnerType\":0,\"onlyFunctional\":true,\"updateOfferCount\":true,\"handbookId\":\"" + templateId + "\",\"linkedSearchId\":\"\",\"neededSearchId\":\"\",\"buildItems\":{ },\"buildCount\":0,\"tm\":1}";

	let res = await send_request(url_ragfair, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				var FinalAverage = 0;
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				var offers = data.offers;
				//console.log(data.offers.length);

				var Costs = 0;
				var CostsSum = 0;
				var indexCount = 0;
				var itemName;

				for(var i = 0; i < offers.length; i++) {
					let offer = offers[i];
					Costs = offer.requirementsCost;
					CostsSum += Costs;
					indexCount++;

				}

				FinalAverage = Math.round(CostsSum / indexCount);
				settings.setValue("Market.FinalAverage", FinalAverage);
				

				if(templateId == "5c0e530286f7747fa1419862") { //propital
					itemName = "Propital";
				}
				if(templateId == "57347ca924597744596b4e71") { //graphics card
					itemName = "Graphics Card";
				}
				if(templateId == "5c12688486f77426843c7d32") { //paracord
					itemName = "Paracord";
				}
				if(templateId == "59faff1d86f7746c51718c9c") { //BTC
					itemName = "Bitcoin";
				}
				if(templateId == "5a1eaa87fcdbcb001865f75e") { //ReapIR
					itemName = "Reap-IR";
				}
				if(templateId == "5d03794386f77420415576f5") { //STEN
					itemName = "STEN";
				}

				console.log(`\n${itemName} average: ${numberWithCommas(Math.round(FinalAverage))} over ${indexCount} total items`);

				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}

				QueryMarket(templateId, itemName);
				return FinalAverage;
	});
	util.sleep(1500);
}

async function GetMoneyStackID(requiredAmount, itemName) {
	let path = "/client/game/profile/list";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];

				//console.log(data);

				//check if profile is correct
				if(data[0].Inventory.items.length > 25) {
					data = data[0];
				} else {
					data = data[1];
				}
				
				
				var i;
				var iLength = data.Inventory.items.length;
				var item;
				for(i = 0; i < iLength; i++) {
					item = data.Inventory.items[i];
					var _id = item._id;
					var _tpl = item._tpl;
					
					if(item.hasOwnProperty("upd")) {
						//console.log("item includes upd");
						var stackCount = item.upd.StackObjectsCount
						if(_tpl == "5449016a4bdc2d6f028b456f" && stackCount >= requiredAmount) {
							 console.log(`Required Amount: ${requiredAmount} | Stack Count: ${stackCount} | ID: ${_id}`);
							 settings.setValue("Market.MoneyStackID", _id);
							 //ipc.emit("buy-item");
							 console.log("%csending buy request...", 'color:green');
							 BuyItem(_id, settings.value("Market.BestOfferID"), settings.value("Market.BestOfferCost"), itemName);
							 break;
						}
					}
					//console.log(item._id)

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

async function getRoubleStacksForMerge() {
	let path = "/client/game/profile/list";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];

				//console.log(data);

				//check if profile is correct
				if(data[0].Inventory.items.length > 25) {
					data = data[0];
				} else {
					data = data[1];
				}
				
				
				var i;
				var iLength = data.Inventory.items.length;
				var item;
				var list_of_roubles = [];

				for(i = 0; i < iLength; i++) {
					item = data.Inventory.items[i];
					var _id = item._id;
					var _tpl = item._tpl;
					
					if(item.hasOwnProperty("upd")) {
						//console.log("item includes upd");
						var stackCount = item.upd.StackObjectsCount
						if(_tpl == "5449016a4bdc2d6f028b456f" && stackCount != 500000) {
							list_of_roubles.push({
								_id: _id,
								stackCount: stackCount
							});
						}
					}
					//console.log(item._id)

				}

				// for(var key in list_of_roubles) {
				// 	var value = list_of_roubles[key];
				// 	console.log(value);

				// 	//i think this is where i need to send merge command??
				// 	//mergeRoubles(list_of_roubles);
				// }

				if(list_of_roubles.length > 1) {
					//mergeRoubles(list_of_roubles);
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

async function mergeRoubles(roublesList) {
	var item1;
	var item2;
	console.log(roublesList);
	for(var y = 0; y < roublesList.length; y++) {
		item1 = roublesList[y+1]._id;
		item2 = roublesList[y]._id;
		util.write_debug("RoubleStack1: " + roublesList[y+1].stackCount + " | RoubleStack2: " + roublesList[y].stackCount);

		let path = "/client/game/profile/items/moving";
		let data = "{\"data\":[{\"Action\":\"Merge\",\"item\":\"" + item1 + "\",\"with\":\"" + item2 + "\"}],\"tm\":2}";

		let res = await send_request(url, 443, path, data);
		zlib.inflate(res, function(err, body) {
			let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
				if(typeof body != "undefined"){
					body = body.toString("utf-8");
					let tempData = JSON.parse(body)['data'];
					let responseCode = JSON.parse(body)['err'];

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




	//ipc.emit('re-query');
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// export only executable function
module.exports.MarketRequests = MarketRequests;
module.exports.GetInventoryConstants = GetInventoryConstants;
module.exports.QueryInventory = QueryInventory;
module.exports.GetMoneyStackID = GetMoneyStackID;
module.exports.BuyItem = BuyItem;
module.exports.getRoubleStacksForMerge = getRoubleStacksForMerge;
