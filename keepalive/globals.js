const settings = require('settings-store');

settings.init({
    appName:       "MarketSniper", //required,
    publisherName: "MarketSniper", //optional
    reverseDNS:    "com.marketsniper" //required for macOS
});
//=====================================================

//=====================================================
// initialize settings
settings.setValue("Profile.username", ""); //username
settings.setValue("Profile.password", ""); //MD5 of password
settings.setValue("Profile.hwCode", ""); //HWID
settings.setValue("Profile.uid", ""); //profile UID
//settings.setValue("Profile.PHPSESSID", ""); //setValue dynamically
settings.setValue("Profile.access_token", ""); //setValue dynamically
settings.setValue("Profile.session_token", ""); //setValue dynamically

//initialize game constants
settings.setValue('GameConstants.GameMajor', "");
settings.setValue('GameConstants.UnityPlayerVersion', "");
settings.setValue('GameConstants.LauncherVersion', "");
settings.setValue('GameConstants.XUnityVersion', "");
settings.setValue('GameConstants.AppVersion', "");
//=====================================================
// main libraries
global.request 	= require('request');
global.fs		= require('fs');
global.zlib 	= require('zlib');
global.http 	= require('https');
//=====================================================
// global variables to change
global.gameVersion 		= ''; // should be auto updated
global.launcherVersion 	= ''; // should be auto updated
global.PHPSESSID 		= settings.value("Profile.PHPSESSID"); // this need to be empty it will updated by script
global.launcher_url 	= "launcher.escapefromtarkov.com"; 	// launcher backend
global.url 				= "prod.escapefromtarkov.com";	// game backend
global.url_trade 		= "trading.escapefromtarkov.com";	// trading backend
global.url_ragfair 		= "ragfair.escapefromtarkov.com";	// ragfair backend (not sure if im not done any typo there)
global.userAgent 		= settings.value("GameConstants.UnityPlayerVersion"); // take that in mind to update it from time to time
global.backendVersion 	= '6';
global.taxonomyVersion 	= '341';
// profile settings
global.hwCode = settings.value("Profile.hwCode");
global.access_token = '';
global.session_token = settings.value("Profile.session_token");
////////// 
global.integer = 0; 		// incrementor used to not get banned ? who fucking knows
global.cookieString = ''; 	// not use ?
global.L_TOKEN = ''; 		// not use ?
global.profileID = settings.value("Profile.uid"); 		// your profile ID you should update it after login to game
global.language = 'en'; 	// not use ?
//=====================================================
// Local Script files
global.util 	= require('./utility.js');
global.keepalive_f = require('./_keepalive.js');