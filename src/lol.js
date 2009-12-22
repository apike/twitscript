var twit = require("./twitscript");
var sys = require("sys");

var twitter = new twit.init({username: "bert"});

twitter.getPublicTimeline(function(data) {
	for(var i = 0; i < data.length; i++) {
		sys.puts(data[i].text);
	}
});
