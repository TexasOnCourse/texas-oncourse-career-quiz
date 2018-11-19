/*global window*/
/*jslint browser:true */

let result = null;

/* === CONTAINER */

let surveyAnswers = [];
let jsonData = null;
let currStep = 0;
let prevStep = 0;

const survey = document.getElementById("surveyView");
const viewIntro = document.getElementById("intro");
const viewSurvey = document.getElementById("survey");
const viewResults = document.getElementById("results");
const progressbar = document.getElementById("surveyProgress");

/* === ANIMATE CHARACTERS ON MOBILE */

let characterCurr = 0;
const characterTotal = document.querySelectorAll(".js-character-animation span").length - 1;
const characterSlider = document.getElementsByClassName("js-character-animation")[0];

function slideCharacterLeft(index) {
	if(index < characterTotal) {
		let xpos = -Math.abs(150*index);
		characterSlider.style.marginLeft = xpos + "px";
		characterCurr = index;
	} else {
		clearInterval(slideCharacterTimer);
	}
}

let slideCharacterTimer = setInterval( function() {
	slideCharacterLeft(characterCurr + 1);
}, 1300);

/* === LOAD JSON */

function loadJSON(callback) {
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'data.json', true);
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == 200) {
            // .open will NOT return a value but simply returns undefined in async mode so use a callback
            callback(xobj.responseText);
        }
    }
    xobj.send(null);
}


/* === CALL JSON LOAD */

loadJSON(function(response) {
    jsonData = JSON.parse(response);
});

/* === Load Intro */

function showIntro(type) {
	let html = null;
	let container = document.getElementById("introView");
	let audiences = jsonData['audiences'][0];

	for ($type in audiences) {
		if($type == type) {
	   		html = '<h3 class="heading-3">' + audiences[$type]['headline'] + '</h3><p>' + audiences[$type]['body'] + '</p><a class="button" onclick="showIntro();return false;">Got it! Let’s continue.</a>';
	   	}
	}
	if(html == null) {
		container.classList.add("fadeout");
		setTimeout(function() {
			buildSurvey();
		}, 400);
	} else {
		container.classList.add("fadeout");
		setTimeout(function() {
			container.innerHTML = html;
			container.classList.remove("fadeout");
		}, 800);
	}
}

/* === Build Survey from JSON */

function buildSurvey() {
	"use strict";
	// init loader
	document.body.classList.add("loading");
	survey.parentNode.classList.add("initLoad");

	// Foreach question append to HTML
	[].forEach.call(jsonData['questions'], function (question, index, questions) {

		var a = question["answers"];
		var g = question["graphic"];
		var t = question["title"];
		var alt = question["alt"];
		var htmlQuestion = "",
			htmlAnswers = "",
			htmlContainer = "";

		/* === Question title and graphic */

		if(g !== "") {
			htmlQuestion += "<h3 class=\"heading-3 quiz-question-title\">" + t + "</h3>";
			htmlQuestion += "<div class=\"quiz-question-graphic\"><img src=\"assets/" + g + "\" alt=\"" + alt + "\"></div>";
		} else {
			htmlQuestion += "<h3 class=\"heading-3 quiz-question-title\">" + t + "</h3>";
		}

		/* === Question answers and icons */

	    htmlAnswers += "<div class=\"quiz-question-options\">";
	    for (var o in a) {
	    	if(a[o].icon !== "") {
	    		htmlAnswers += "<div class=\"quiz-question-option grid\" data-options=\"" + a[o].points + "\">";
	    		htmlAnswers += "<div class=\"title\"><span>" + a[o].text + "</span></div>";
	    		htmlAnswers += "<img src=\"assets/" + a[o].icon + "\" alt=\"" + a[o].text + "\"></div>";
	    	} else {
	    		htmlAnswers += "<div class=\"quiz-question-option\" data-options=\"" + a[o].points + "\">";
	    		htmlAnswers += "<div class=\"title\"><span>" + a[o].text + "</span></div></div>";
	    	}
	    }
	    htmlAnswers += "</div>";

	    /* === Wrap it all together */

	    htmlContainer += "<div class=\"section-survey-step\" data-step=\"incomplete\">";
	    htmlContainer += htmlQuestion;
	    htmlContainer += htmlAnswers;
	    htmlContainer += "</div></div>";

	    survey.innerHTML += htmlContainer;

	    /* === If last question trigger show survey */
	    if(index === jsonData['questions'].length - 1) {
			initSurvey();
		}

	});
}

/* === Initiate Survey */

function initSurvey() {

	// Fade out intro
	viewIntro.classList.remove("inview");
	viewSurvey.classList.add("inview");

	// Transition to survey styles
	setTimeout( function() {
		document.body.classList.remove("loading","init");
		
		// INIT
		setupQuestions();
		changeQuestion(0,"next");

		setTimeout( function() {
			survey.parentNode.classList.remove("initLoad");
		}, 1200);

	}, 800);

}

function toggleSelected(options,selected) {
	[].forEach.call(options, function (item) {
		item.classList.remove("selected");
	});
	selected.classList.add("selected");
}

/* === Setup Question */
/* For each question setup listener events */

function changeQuestion(id,direction) {

	const steps = document.querySelectorAll("[data-step]");
	const backButton = document.getElementById("surveyBack");

	let curr = steps[id];
	let prev, next;

	let options = document.getElementsByClassName('quiz-question-option');

	backButton.style.visibility = "hidden";
	progressbar.classList.remove("visible");
	
	/* --- Detect change/direction for question */

	if(id >= steps.length) { // last question

		loadResults(result);

	} else {

		if(direction == "next") {

			if(id == 0) {

				next = curr.nextSibling;
				curr.setAttribute('data-step', 'active');
				resetYPos();

			} else {

				prev = curr.previousSibling;
				next = curr.nextSibling;

				prev.setAttribute('data-step', 'processing');
			   	// Set completed
			    setTimeout(function() {
			       	prev.setAttribute('data-step', 'completed');
			    }, 500);
			    // Set active
			    setTimeout(function() {
			    	prev.style.display = "none";
					curr.setAttribute('data-step', 'active');
					resetYPos();
					backButton.style.visibility = "visible";
					checkProgress(id);
			    }, 1500);

			}

		}

		if(direction == "back") {

			[].forEach.call(options, function (item) {
				// Add listener event
				item.classList.remove("selected");
			});

			if(id == 0) {

				next = curr.nextSibling;

				next.setAttribute('data-step', 'incomplete');
				curr.style.display = null;
				setTimeout( function() {
					curr.setAttribute('data-step', 'active');
					resetYPos();
				}, 200);

			} else {

				next = curr;
				target = curr.nextSibling;

				target.setAttribute('data-step', 'incomplete');
				next.style.display = null;
				setTimeout( function() {
				 	next.setAttribute('data-step', 'active');
					 backButton.style.visibility = "visible";
					 resetYPos();
				}, 200);
			}

		}

	}

	function checkProgress(index) {
		if(index == Math.round(steps.length/5)) {
			notifyProgress(jsonData['progress'][0]);
		}
		if(index == Math.round(steps.length/2)) {
			notifyProgress(jsonData['progress'][1]);
		}
		if(index == Math.round(steps.length - 3)) {
			notifyProgress(jsonData['progress'][2]);
		}
	}

	function notifyProgress(text) {

		progressbar.textContent = text;
		progressbar.classList.add("visible");
		
		setTimeout(function() {
        	progressbar.classList.remove("visible");
        }, 2000);

	}

	function resetYPos() {
		viewSurvey.scrollTop = 0;
	}

	currStep = id;
	calculateResults();

}

function setupQuestions() {

	let options = document.getElementsByClassName('quiz-question-option');
	
	/* --- Add listener to option */

	[].forEach.call(options, function (item) {
		item.addEventListener("click", function(event) {
			event.preventDefault();
			let $id = currStep;
			let $dir = "next";
			let next = $id + 1;
			this.classList.add("selected");
			let $options = this.getAttribute('data-options');
				$options = $options.split(',');
			updateAnswer($id, $options);
			changeQuestion(next,$dir);
		}, false);
	});
}


function prevQuestion() {

	var next = currStep - 1;

	console.clear();
			
	if(next == 0) {
		surveyAnswers = [];
	} else {
		surveyAnswers.splice(currStep, 1);
	}

	changeQuestion(next,"back");

}


/* === Update Answer */

function updateAnswer(id, options) {

	// Set temp array
	let tmpArray = [{
		realistic: 0,
		investigative: 0,
		artistic: 0,
		social: 0,
		enterprising: 0,
		conventional: 0
	}];

	// Check options and add totals to temp array
	for( let i = 0; i < options.length; i++) {
		tmpArray.forEach(function (arr, index) {
  			for(opt in arr) {
  				if(opt == options[i]) {
  					arr[opt] = arr[opt] + 1;
  				}
			}
		});
	}

	// Push temp array to position based on ID
	surveyAnswers.splice(id, 1, tmpArray);
	// Proceed with survey
	// setupQuestion(next,"next");

}

function calculateResults() {

	console.log('calculating results...');

	let resultTotals = [{
		realistic: 0,
		investigative: 0,
		artistic: 0,
		social: 0,
		enterprising: 0,
		conventional: 0
	}];

	// Loop thru survey answers and add up totals
	for( let i = 0; i < surveyAnswers.length; i++) {

		// Get options for answer
		surveyAnswers[i].forEach(function (options) {

			let loopcnt = 0;
			const totals = Object.values(options);
			console.log('%c Question ' + (i+1) + ' ', 'background-color:black;color:white;font-weight: bold;')
			for( opt in options ) {
				resultTotals.forEach(function (items) {
					for(item in items) {
						if(item == opt) {
							if(totals[loopcnt] == 1) {
								items[item] = items[item] + 1;
							}
							console.log(totals[loopcnt] + ' – ' + item);
						}
						result = Object.keys(items).reduce(function(a, b){ return items[a] > items[b] ? a : b });
					}
				});
				loopcnt++;
			}
		});
	}

	console.log('--------------------------------------------');
	console.log('%cIt\'s looking like: ' + (result == null ? "Get Started" : result), 'font-weight: bold;text-transform:uppercase');
	console.log('********************************************');
}


function loadResults(page) {

	const result_page = page + '.html';
    const content_div = document.getElementById('results');

	function load_() {

       let xmlHttp = new XMLHttpRequest();

       xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
               content_div.innerHTML = xmlHttp.responseText;
            }
        };
        let start = new Date().getTime();
        xmlHttp.open("GET", result_page, true);
        xmlHttp.send(null);

    }

    load_();

	const view_survey = document.getElementById("survey");
	const view_results = document.getElementById("results");

	document.body.classList.add("loading");

	setTimeout(function() {
		document.body.classList.remove("loading");
		view_results.classList.add("inview")
		view_survey.classList.remove("inview");
	}, 800);

}

