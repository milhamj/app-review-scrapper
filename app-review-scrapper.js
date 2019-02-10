var gplay = require('google-play-scraper');

var query = "online shopping"
var numberOfApps = 5
var numberOfPages = 2
var appCountry = "id"
var reviewLanguage = "id"

console.log("app_name,reviewer_name,review_title,review_text,score")

gplay.search({
	term: query,
	num: numberOfApps,
	country: appCountry,
	throttle: 10
}).then(getListOfApps);

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
		lang: reviewLanguage
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
			console.log(output)
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