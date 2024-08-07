game("rdr3")
fx_version("cerulean")
rdr3_warning(
'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.')

version("1.0.0")
author("Zerio")
description("W.I.P Voice system for FiveM")

shared_script("dist/shared/shared.js")
client_script("dist/client/client.js")
server_scripts({
	"scripts/buildDetector.js",
	"dist/server/server.js",
})

files({
	"dist/html/index.html",
	"dist/html/assets/*.css",
	"dist/html/assets/*.js",
	"dist/html/*.ogg",
	"config.json",
	"translations.json",
})

ui_page("dist/html/index.html")
-- ui_page("http://localhost:5173")
