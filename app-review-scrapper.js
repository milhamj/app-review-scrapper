var gplay = require('google-play-scraper');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

var query = ""
var numberOfApps = 10
var numberOfPages = 100
var appCountry = "id"
var reviewLanguage = "id"
var fileName = "result.csv"

handleArguments()
initOutputFile()
doSearch()

function handleArguments() {
	console.log(argv)
	if (argv) {
		if (argv["query"]) {
			query = argv["query"]
		} else {
			throw "Please specify your query using -query \"Your query here\""
		}

		if (argv["apps"]) {
			numberOfApps = argv["app"]
		}

		if (argv["pages"]) {
			numberOfPages = argv["pages"]
		}

		if (argv["country"]) {
			appCountry = argv["country"]
		}

		if (argv["lang"]) {
			reviewLanguage = argv["lang"]
		}
	} else {
		throw "Please specify your query using -query \"Your query here\""
	}
}

function initOutputFile() {
	let outputDir = "./output"
	let header = "app_name,reviewer_name,review_title,review_text,score"

	if (!fs.existsSync(outputDir)){
		fs.mkdirSync(outputDir);
	}

	fs.writeFile(outputDir + "/" + fileName, header, function (err) {
		if (err) throw err;
	})
}

function doSearch() {
	gplay.search({
		term: query,
		num: numberOfApps,
		country: appCountry,
		throttle: 10
	}).then(getListOfApps)
}

function getListOfApps(listOfApps)  {
	listOfApps.forEach(function(app) {
		for (i = 0; i < numberOfPages; i++) {
			getListOfReviews(app, i)
		}
	})
}

function getListOfReviews(app, page) {
	gplay.reviews({
		appId: app["appId"],
		page: page,
		sort: gplay.sort.HELPFULNESS,
		lang: reviewLanguage,
		throttle: 10
	}).then(function(reviews) {
		reviews.forEach(function(review) {
			let output = new CsvLineBuilder()
							.append(sanitize(app["title"]))
							.append(sanitize(review["userName"]))
							.append(sanitize(review["title"]))
							.append(sanitize(review["text"]))
							.append(review["score"])
							.getLine()
		})
	})
}

function CsvLineBuilder() {
	this.line = ""

	this.append = function(string) {
		if (this.line !== "") {
			this.line += `,`
		}
		this.line += `"${string}"`

		return this
	}

	this.getLine = function() {
		return this.line
	}
}

function sanitize(string) {
	if (!string) {
		string = ""
	}
	return string.replace(/"/g, ``)
}