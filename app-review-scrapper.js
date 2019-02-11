var gplay = require('google-play-scraper');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

var query = ""
var numberOfApps = 10
var numberOfPages = 100
var appCountry = "id"
var reviewLanguage = "id"
var throttle = 50

var outputDir = "./output"
var fileName = "result.csv"
var outputPath = outputDir + "/" + fileName

var counter = 0

var TIME_TAG = 'Processed all pages for'
console.time(TIME_TAG);

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

		if (argv["throttle"]) {
			throttle = argv["throttle"]
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
	let searchParams = {
		term: query,
		num: numberOfApps,
		country: appCountry
	}

	if (throttle != 0) {
		searchParams["throttle"] = throttle
	}

	gplay.search(searchParams).then(getListOfApps)
}

function getListOfApps(listOfApps)  {
	listOfApps.forEach(function(app) {
		for (i = 0; i < numberOfPages; i++) {
			getListOfReviews(app, i)
		}
	})
}

function getListOfReviews(app, page) {
	let reviewsParams = {
		appId: app["appId"],
		page: page,
		sort: gplay.sort.HELPFULNESS,
		lang: reviewLanguage
	}

	if (throttle != 0) {
		reviewsParams["throttle"] = throttle
	}

	gplay.reviews(reviewsParams).then(function(reviews) {
		let output = ""
		reviews.forEach(function(review) {
			let line = new CsvLineBuilder()
							.append(sanitize(app["title"]))
							.append(sanitize(review["userName"]))
							.append(sanitize(review["title"]))
							.append(sanitize(review["text"]))
							.append(review["score"])
							.getLine()
			output += line
		})
		fs.appendFile(outputPath, `${output}`, function (err) {
			if (err) throw err;
		})

		updateProgress()
	}, function(error) {
		console.log(``)
		console.log(`Error while processing ${app["title"]} page ${page}`)
		console.log(error)
		console.log(``)
		updateProgress()
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
		return this.line + `\r\n`
	}
}

function sanitize(string) {
	if (!string) {
		string = ""
	}
	return string.replace(/"/g, ``)
}

function formatFloat(float) {
	return Math.round(float * 100) / 100;
}

function updateProgress() {
	counter++
	let totalPages = numberOfApps * numberOfPages
	let percentage = formatFloat((counter / totalPages) * 100)

	printProgress(`Processed ${counter} of ${totalPages} total pages (${percentage}%)`)

	if (counter == totalPages) {
		console.log(``)
		console.timeEnd(TIME_TAG);
	}
}

function printProgress(progress){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(progress);
}