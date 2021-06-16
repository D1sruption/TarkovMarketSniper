const settings = require('settings-store');
const fs = require('fs');

let sessionConfig;// = require('C:\\MarketKiller_Shared\\SessionConfig.json');
let session_token;// = sessionConfig.session_token;

function checkScale() {
    try {
        if (fs.existsSync('C:\\MarketSniper_Shared\\SessionConfig.json')) {
            //file exists....use it for scaling
            sessionConfig = require('C:\\MarketSniper_Shared\\SessionConfig.json');
            session_token = sessionConfig.session_token;
            item = sessionConfig.item;
            _tpl = sessionConfig._tpl;    

            console.log("\nLoaded session_token from scalable config: " + session_token + "\n");

            settings.setValue("Profile.PHPSESSID", session_token);
            settings.setValue("Profile.session_token", session_token);


            //bypass login
            setTimeout(() => {
                login_f.VersionRequests();
                setTimeout(() => {
                    market_f.MarketRequests();
                }, 5000);

            }, 5000);
            //market_f.MarketRequests();

        } else {
            //file doesnt exist...use first run logic
            console.log("Didnt detect scalar config...performing first run logic.");
            login_f.VersionRequests();
            login_f.LoginRequests();
        }
    } catch(err) {
        console.log(err);
    }
}


module.exports.checkScale = checkScale;