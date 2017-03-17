'use strict';

const request = require("request"),
			cheerio = require("cheerio");
let url = 'https://moikrug.ru/onerussel';

// An array with varying endings
const monthForms = ['месяц', 'месяца', 'месяцев'];
const yearForms = ['год', 'года', 'лет'];
// Function-helper for getting a correct ending
function getEnding(number, variants) {
	const lastDiget = number % 10;
	if(lastDiget == 1) {
		return variants[0];
		// last diget <= 4 excluding 0 and cases where number itself is >= 11 AND <= 19
	} else if (lastDiget <= 4 && lastDiget != 0 && !((number >= 11) && (number <= 19))) {
		return variants[1];
	} else {
		return variants[2]
	}
}

// Function-helper for getting the period out of a string
function calculatePeriod(text) {
	const years = text.replace(/\D+/g, '');
	const d = new Date();
	const currentYear = d.getFullYear();
	const begunInYear = parseInt(years.substr(0,4));
	const endedInYear = parseInt(years.substr(4,8)); // if only one year specified, no worries, just gets as an empty string
	const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
	let period;

	// One year specified AND this year is equal to the current one
	if(years.length == 4 && begunInYear == currentYear) {
		const m = d.getMonth();
		let begunInMonth = text.split(' ')[0];
		let parsedMonth;

		MONTHS.forEach(function(month, i) {
			month == begunInMonth ? parsedMonth = i : null
		});

		period = m - parsedMonth;
		if(period == 0) {return 'Меньше месяца'};
		return period + ' ' +  getEnding(period,monthForms);

	// One year specified BUT it is not equal to the current one
	} else if (years.length == 4) {

		period = currentYear - begunInYear;
		return period + ' ' + getEnding(period,yearForms);
	// First year is equal to the second one
	} else if (begunInYear == endedInYear) {

		const begunInMonth = text.split(' ')[0];
		const endedInMonth = text.split(' ')[3];
		let parsedBegin, parsedEnd;

		MONTHS.forEach(function(month, i) {
			month == begunInMonth ? parsedBegin = i : null;
			month == endedInMonth ? parsedEnd = i :  null;
		});

		period = parsedEnd - parsedBegin;
		if(period == 0) {return 'Меньше месяца'};
		return period + ' ' + getEnding(period,monthForms);

	// Two different years specified
	} else {

		period = endedInYear - begunInYear;
		return period + ' ' + getEnding(period,yearForms);
	}

}

// Function that does all the work :)
function logData(url) {

	request(url, function (error, response, html) {
		if (!error) {
			const $ = cheerio.load(html);
			const output = [];

			// Gets name and profession and logs it
			$('.user_info').filter(function() {
				const data = $(this);

				const name = data.find('.user_name').children().text();
				const profession = data.find('.profession').text();

				console.log('\x1b[1m', name);
				console.log('\x1b[0m\x1b[36m', profession + '\n');

			})

			// Gets work experiences, stores it into an array, then logs it
			$('.work_experiences').filter(function() {
				const data = $(this);

				data.children().each(function() {
					const information = {};
					information.period = calculatePeriod($(this).children().first().text());
					information.companyName = $(this).find('.company_name').text();
					output.push(information);
				});

				output.map(function(el) {
					console.log('\x1b[33m', el.companyName + ' - ' + el.period);
				})
			})   
		} else {
			console.log("Произошла ошибка: " + error);
		}

	});

}

logData(url);