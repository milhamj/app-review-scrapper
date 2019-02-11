var gplay = require('google-play-scraper');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

var query = ""
var numberOfApps = 10
var numberOfPages = 100
var appCountry = "id"
var reviewLanguage = "id"
var outputDir = "./output"
var fileName = "result.csv"
var outputPath = outputDir + "/" + fileName

handleArguments()
initOutputFile()
doSearch()

function handleArguments() {
	if (argv) {
		if (argv["query"]) {
			query = argv["query"]
		} else {
			throw "Please specify your query using --query \"Your query here\""
		}

		if (argv["apps"]) {
			numberOfApps = argv["apps"]
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

		if (argv["output"]) {
			fileName = argv["output"]
			outputPath = outputDir + "/" + fileName
		}

		console.log(``)
		console.log(`Searching for reviews of ${numberOfApps} apps with query: "${query}", number of pages: ${numberOfPages}, country: ${appCountry}, and language: ${reviewLanguage}`)
		console.log(`The output will be saved at ${outputPath}`)
		console.log(``)
	} else {
		throw "Please specify your query using --query \"Your query here\""
	}
}

function initOutputFile() {
	let header = "app_name,reviewer_name,review_title,review_text,score"

	if (!fs.existsSync(outputDir)){
		fs.mkdirSync(outputDir);
	}

	fs.writeFile(outputPath, `${header}\r\n`, function (err) {
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
			fs.appendFile(outputPath, `${output}\r\n`, function (err) {
				if (err) throw err;
			})
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