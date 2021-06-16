const settings = require('settings-store');
const fs = require('fs');
require('./globals.js');
settings.init({
    appName:       "MarketSniper", //required,
    publisherName: "MarketSniper", //optional
    reverseDNS:    "com.marketsniper" //required for macOS
});

scaling.checkScale();