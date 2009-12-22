var twit = require("./src/twitscript"),
	sys = require("sys");

var twitter = new twit.init({
	username: "example_username", 
	password: "example_password"
});

twitter.updateStatus({status: "I'm about to push this project up"}, function(data) {
	sys.puts("Sent?");
});

/*twitter.getPublicTimeline(function(data) {
	for(var i = 0; i < data.length; i++) {
		sys.puts(data[i].text);
	}
}); */
