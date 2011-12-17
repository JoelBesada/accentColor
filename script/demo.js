/*             ACCENTCOLOR DEMO CODE
 * 	      by Joel Besada (http://joelb.me)
 *                (cba commenting)            
 */
$(document).ready(init);
var tvScreen, 
	tvNoise,
	offTimeout, 
	inputForm,
	loading = false,
	tvOn = false,
	PROXY = "proxy/proxy.php";

function init() {
	tvScreen = $(".tv .screen");
	tvNoise = $(".tv .screen .noise");
	inputForm = $(".demo .input form");
	$("header .color-text span").each(function() {
		var $this = $(this);
		$this.css("color", randomColor())
		setInterval(function() {
			$this.css("color", randomColor())
		}, 2500);
	});

	$(".examples .plain a").each(function() {
		var $this = $(this);
		getAccentColor({ proxy: PROXY,
						url: this.href,
						onComplete: function(color) {
							$this.css("color", color);
							$(".examples .border a[href=\""+$this.attr("href")+"\"]").css("border-color", color);
							$(".examples .background a[href=\""+$this.attr("href")+"\"]").css("background-color", color);
						}}); 
	});

	$(".docs a").not(".internal").each(function() {
		var $this = $(this);
		getAccentColor({ proxy: PROXY,
						url: this.href,
						onComplete: function(color) {
							$this.css("color", color);
						}});
	});
	setInterval(animateNoise, 50);
}

function animateNoise() {
	if(loading) {
		var pos = Math.random() * 100 + "% " + Math.random() * 100 + "%";
		tvNoise.css("background-position", pos);
	}
}


function randomColor() {
	return "rgb(" + parseInt(Math.random()*200 + 55, 10) + ", " + parseInt(Math.random()*200 + 55, 10) + ", " + parseInt(Math.random()*200 + 55, 10) + ")";
}

function getColor() {
	if(loading) {
		return;
	}
	var url = inputForm[0].url.value;
	loadStart();
	if(!tvOn) {
		screenOn();
	}
	getAccentColor({ proxy: PROXY,
					url: url, 
					onComplete: setColor,
					onError: setError
					});
	if(offTimeout) {
		clearTimeout(offTimeout);
	}
	offTimeout = setTimeout(screenOff, 30 * 1000);
}

function setColor(color) {
	loadEnd();
	tvScreen.css("background", color);
}

function setError(error) {
	loadEnd();
	debug(error);
	tvScreen.css("background", "url(assets/error.png)");
}

function loadStart() {
	loading = true;
	tvNoise.css("opacity", 1.0);
}

function loadEnd() {
	setTimeout(function() {loading = false;}, 500);
	tvNoise.css("opacity", 0);
}

function screenOn() {
	tvScreen.css("background", "url(assets/white-noise.png)").removeClass("off").addClass("on");
	tvOn = true;
}

function screenOff() {
	tvScreen.removeClass("on").addClass("off");
	tvOn = false;
}

function debug(){
	if(console) {
		if(console.log) {
			console.log(arguments);	
		}
	}
}