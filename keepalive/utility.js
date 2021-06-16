const fs = require('fs');
var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms);
    })
}
function writeJson(file, data) { //write json to file with tabulators and new lines
    fs.writeFileSync(file, data, 'utf8');
}

//Randomize PHPSESSID
function randomizeID() {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    console.log("Randomized unique PHPSESSID: " + text)

    return text;
}

function writeSessionToken(session_token, data) {
	fs.writeFileSync('C:\\MarketSniper_Shared\\SessionConfig.json', data)
}

function writePurchase(data) {
    //fs.writeFileSync('C:\\MarketKiller_Shared\\PurchaseLog.txt', data);
    fs.appendFileSync('C:\\MarketSniper_Shared\\PurchaseLog.txt', time + "\n\n" + data);
}

function write_debug(data) {
    //fs.writeFileSync('C:\\MarketKiller_Shared\\PurchaseLog.txt', data);
    fs.appendFileSync('C:\\MarketSniper_Shared\\Debug.txt', "\n\n" + data);
}

// export only executable function
module.exports.sleep = sleep;
module.exports.writeJson = writeJson;
module.exports.writePurchase = writePurchase;
module.exports.write_debug = write_debug;
module.exports.randomizeID = randomizeID;
module.exports.writeSessionToken = writeSessionToken;