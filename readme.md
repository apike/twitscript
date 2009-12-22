Twitscript - a Server Side Javascript library to interface with Twitter (Node.js)
-----------------------------------------------------------------------------------
Node.js is an incredibly cool way to handle server-side Javascript. As I was hacking
on another project of mine (Luno - http://github.com/ryanmcgrath/luno), I found myself
wishing I had an easy to use Twitter API wrapper.

Now, I've already written one such library, albeit in 
Python (Twython - http://github.com/ryanmcgrath/twython), I decided... screw it, why
not see how quickly I could port my earlier work? 

Twitscript is the end product of 1.5 hours of work. It covers Twitter's main and search APIs;
OAuth and Streaming haven't been implemented in Twython yet, so there's no base to
pull from, in that respect. If you'd like to see these features, fork away! ;)


Using Twitscript
------------------------------------------------------------------------------------
It's pretty easy, to be honest. Throw Twiscript on your module path somewhere, require
it, and have a blast! Most of the calls mirror Twitter API calls directly, and the source
is very well documented - read through if you need anything.

    var twitscript = require("twitscript");
    
    var twitter = new twitscript({
        username: "username",
		password: "password",
		headers: "my headers",
		version: 1,
	});
	
	twitter.updateStatus({status: "I'm updating my status!", in_reply_to_status_id: "21242423"});

Beautiful, right? Thought so. If you have any questions, comments, complaints, whatever, feel free to hit
me on my email. I'm also on Twitter, if you'd like more up to date mundane information about my life.

ryan [at] venodesigns [dot] net
http://twitter.com/ryanmcgrath
