const settings = require('settings-store');
const fs = require('fs');
require('./globals.js');
settings.init({
    appName:       "MarketSniper.keepalive", //required,
    publisherName: "MarketSniper", //optional
    reverseDNS:    "com.marketsniper.keepalive" //required for macOS
});

if (fs.existsSync('C:\\MarketSniper_Shared\\SessionConfig.json')) {
    //file exists....use it for scaling
    sessionConfig = require('C:\\MarketSniper_Shared\\SessionConfig.json');
    session_token = sessionConfig.session_token; 

    console.log("\nLoaded session_token from scalable config: " + session_token + "\n");

    settings.setValue("Profile.PHPSESSID", session_token);
    settings.setValue("Profile.session_token", session_token);

    setTimeout(() => {
        console.log("Sending init....");
        keepalive_f.initialize();
    }, 1500);

} else {
    //file doesnt exist...use first run logic
    console.log("Didnt detect scalar config...");
    process.exit(1);
}