/*
	Twitscript is a port of Twython (http://github.com/ryanmcgrath/twython)
	to server-side Javascript.

	TODO: OAuth, Streaming API?

	Questions, comments? ryan@venodesigns.net
*/

var sys = require("sys"),
    http = require("http");

exports.init = function(setupObj) {
	/*	new twitscript.init({username: "example", password: "example", headers: "example", version: 1})

		Instantiates an instance of Twitscript. Takes optional parameters for authentication and such (see below).

		Parameters:
			username - Your Twitter username, if you want Basic (HTTP) Authentication.
			password - Password for your twitter account, if you want Basic (HTTP) Authentication.
			headers - (Optional) User agent header.
			version (number) - (Optional, defaults to 1) Twitter supports a "versioned" API - this defaults to 1.

			** Note: versioning is not currently used by search.twitter functions; when Twitter moves their junk, it'll be supported.
	*/

	/* Store any usernames, etc that were passed in */
	if(setupObj) process.mixin(this, setupObj);
	
	this.authenticated = false;
	this.opener = http.createClient(80, "api.twitter.com");

	if(!this.version) this.version = 1;
	if(!this.headers) this.headers = "Twitscript Node.js Client";

	if(this.username !== null && this.password !== null) {
		// simplejson.load: function(.opener.open("http://api.twitter.com/%d/account/verify_credentials.json" % self.apiVersion))
		// build opener
	}
}

exports.init.prototype = {	
	makeRequest: function(reqObj) {
		var request = null,
			fullURL = "/" + this.version + reqObj.url;

		// Check for GET, assume POST (DELETE methods just append _method=DELETE for now)
		if(reqObj.type === "GET") request = this.opener.get(fullURL, {"host": "api.twitter.com", "User-Agent": this.headers}); //, {"host": "www.google.com"});
		else request = this.opener.put(fullURL, {"host": "api.twitter.com", "User-Agent": this.headers}); //, {"host": "www.google.com"});
	
		return request.finish(function(resp) {
			var statusCode = resp.statusCode,
				finalResp = "";

			resp.setBodyEncoding("utf8");

			if(statusCode !== 200) return sys.puts("Request to " + fullURL + " failed with a " + statusCode + " error code.");

			resp.addListener("body", function(chunk) {
				finalResp += chunk;
			});

			resp.addListener("complete", function() {
				if(typeof reqObj.callback !== "undefined" && typeof reqObj.callback === "function") reqObj.callback(JSON.parse(finalResp));
			});
		});
	},
	
	constructApiURL: function(base_url, params) {
		return base_url + "?" + "&".join(["%s=%s" %(key, value) for (key, value) in params.iteritems()])
	},

	getPublicTimeline: function(callbackfn) {
		/*	getPublicTimeline()

			Returns the 20 most recent statuses from non-protected users who have set a custom user icon.
			The public timeline is cached for 60 seconds, so requesting it more often than that is a waste of resources.

			Params:
				callbackfn(data) - A callback function to handle the data returned from the call.
		*/
		return this.makeRequest({
			type: "GET",
			url: "/statuses/public_timeline.json",
			callback: callbackfn
		});
	},

	getRateLimitStatus: function(callbackfn) {
		/*	getRateLimitStatus()

			Returns the remaining number of API requests available to the requesting user before the
			API limit is reached for the current hour. Calls to rate_limit_status do not count against
			the rate limit.  If authentication credentials are provided, the rate limit status for the
			authenticating user is returned.  Otherwise, the rate limit status for the requesting
			IP address is returned.
		*/	
		return this.makeRequest({
			type: "GET",
			url: "/account/rate_limit_status.json",
			callback: callbackfn
		});
	},

	getHomeTimeline: function(paramsObj, callbackfn) {
		/*	getHomeTimeline(paramsObj, callbackfn)

			Returns the 20 most recent statuses, including retweets, posted by the authenticating user
			and that user's friends. This is the equivalent of /timeline/home on the Web.

			Usage note: This home_timeline is identical to statuses/friends_timeline, except it also
			contains retweets, which statuses/friends_timeline does not (for backwards compatibility
			reasons). In a future version of the API, statuses/friends_timeline will go away and
			be replaced by home_timeline.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: this.constructApiURL("/statuses/home_timeline.json", paramsObj),
				callback: callbackfn
			});
		} else {
			return sys.puts("You need to be authenticated to grab a Home Timeline.");
		}
	},
	
	getFriendsTimeline: function(paramsObj, callbackfn) {
		/*	getFriendsTimeline(paramsObj, callbackfn)

			Returns the 20 most recent statuses posted by the authenticating user, as well as that users friends. 
			This is the equivalent of /timeline/home on the Web.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: this.constructApiURL("/statuses/friends_timeline.json", paramsObj),
				callback: callbackfn
			});
		} else {
			return sys.puts("You need to be authenticated to grab a Home Timeline.");
		}
	},

	getUserTimeline: function(paramsObj, callbackfn) { 
		/*	getUserTimeline(paramsObj, callbackfn)

			Returns the 20 most recent statuses posted from the authenticating user. It's also
			possible to request another user's timeline via the id parameter. This is the
			equivalent of the Web /<user> page for your own user, or the profile page for a third party.

			Parameters:
				id - Optional. Specifies the ID or screen name of the user for whom to return the user_timeline.
				user_id - Optional. Specfies the ID of the user for whom to return the user_timeline. Helpful for disambiguating.
				screen_name - Optional. Specfies the screen name of the user for whom to return the user_timeline. (Helpful for disambiguating when a valid screen name is also a user ID)
				since_id -  Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Returns only statuses with an ID less than (that is, older than) or equal to the specified ID.
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits. 
		*/
		var userTimelineURL = "";

		if(paramsObj.id) {
			userTimelineURL = this.constructApiURL("/statuses/user_timeline/" + paramsObj.id + ".json", paramsObj);
		} else if(paramsObj.user_id || paramsObj.screen_name) {
			userTimelineURL = this.constructApiURL("/statuses/user_timeline.json", paramsObj);
		} else if(this.username) {
			userTimelineURL = this.constructApiURL("/statuses/user_timeline/" + this.username + ".json", paramsObj);
		} else {
			return sys.puts("You need to pass an id, user_id, or screen_name to getUserTimeline()");
		}
	
		return this.makeRequest({
			type: "GET",
			url: userTimelineURL,
			callback: callbackfn
		});
	},
		
	getUserMentions: function(paramsObj, callbackfn) {
		/*	getUserMentions(paramsObj, callbackfn)

			Returns the 20 most recent mentions (status containing @username) for the authenticating user.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: this.constructApiURL("/statuses/mentions.json", paramsObj),
				callback: callbackfn
			});
		} else {
			return sys.puts("You need to be authenticated to use getUserMentions()");
		}
	},

	reportSpam: function(callbackfn) {
		/*	reportSpam(paramsObj, callbackfn) {

			Report a user account to Twitter as a spam account. *One* of the following parameters is required, and
			this requires that you be authenticated with a user account.

			Parameters:
				id - Optional. The ID or screen_name of the user you want to report as a spammer.
				user_id - Optional.  The ID of the user you want to report as a spammer. Helpful for disambiguating when a valid user ID is also a valid screen name.
				screen_name - Optional.  The ID or screen_name of the user you want to report as a spammer. Helpful for disambiguating when a valid screen name is also a user ID.
		*/
		if(this.authenticated === true) {
			if(paramsObj.id || paramsObj.user_id || paramsObj.screen_name) {
				return this.makeRequest({
					type: "POST",
					url: "/report_spam.json?" + (paramsObj.id ? paramsObj.id : (paramsObj.user_id ? paramsObj.user_id : paramsObj.screen_name)),
					callback: callbackfn
				});
			} else {
				return sys.puts("reportSpam requires an id, user_id, or screen_name to be passed.");
			}
		} else {
			return sys.puts("reportSpam() requires you to be authenticated with Twitter.");
		}
	},

	reTweet: function(paramsObj, callbackfn) {
		/*	reTweet(paramsObj, callbackfn)

			Retweets a tweet. Requires the id parameter of the tweet you are retweeting.

			Parameters:
				id - Required. The numerical ID of the tweet you are retweeting.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "POST",
				url: "/statuses/retweet/" + paramsObj.id + ".json",
				callback: callbackfn
			});
		} else {
			return sys.puts("reTweet() requires you to be authenticated!");
		}
	},

	getRetweets: function(paramsObj, callbackfn) {
		/*	getRetweets: function(paramsObj, callbackfn) {
			
			Returns up to 100 of the first retweets of a given tweet.
		
			Parameters:
				id - Required.  The numerical ID of the tweet you want the retweets of.
				count - Optional.  Specifies the number of retweets to retrieve. May not be greater than 100.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: "/statuses/retweets/" + paramsObj.id + ".json" + (paramsObj.count ? "?count=" + paramsObj.count : "");
				callback: callbackfn
			});
		} else {
			return sys.puts("getRetweets() requires you to be authenticated.");
		}
	},

	retweetedOfMe: function(paramsObj, callbackfn) {
		/*	retweetedOfMe(paramsObj, callbackfn)

			Returns the 20 most recent tweets of the authenticated user that have been retweeted by others.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: this.constructApiURL("/statuses/retweets_of_me.json", paramsObj),
				callback: callbackfn
			});
		} else {
			return sys.puts("retweetedOfMe() requires you to be authenticated.");
		}
	},
	
	retweetedByMe: function(paramsObj, callbackfn) {
		/*	retweetedByMe(paramsObj)

			Returns the 20 most recent retweets posted by the authenticating user.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: this.constructApiURL("/statuses/retweeted_by_me.json", paramsObj),
				callback: callbackfn
			});
		} else {
			return sys.puts("retweetedByMe() requires you to be authenticated.");
		}
	},

	retweetedToMe: function(paramsObj, callbackfn) {
		/*	retweetedToMe(paramsObj)

			Returns the 20 most recent retweets posted by the authenticating user's friends.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
		*/
		if(this.authenticated === true) {
			return this.makeRequest({
				type: "GET",
				url: this.constructApiURL("/statuses/retweeted_to_me.json", paramsObj),
				callback: callbackfn
			});
		} else {
			return sys.puts("retweetedToMe() requires you to be authenticated.")
		}
	},

	searchUsers: function(q, per_page = 20, page = 1) {
		""" searchUsers(q, per_page = None, page = None) {

			Query Twitter to find a set of users who match the criteria we have. (Note: This, oddly, requires authentication - go figure)

			Parameters:
				q (string) - Required. The query you wanna search against; self explanatory. ;)
				per_page (number) - Optional, defaults to 20. Specify the number of users Twitter should return per page (no more than 20, just fyi)
				page (number) - Optional, defaults to 1. The page of users you want to pull down.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/users/search.json?q=%s&per_page=%d&page=%d" % (version, q, per_page, page)))
			except HTTPError, e:
				raise TwythonError("searchUsers() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("searchUsers(), oddly, requires you to be authenticated.")
	
	showUser: function(id = None, user_id = None, screen_name = None) {
		"""showUser(id = None, user_id = None, screen_name = None)

			Returns extended information of a given user.  The author's most recent status will be returned inline.

			Parameters:
				** Note: One of the following must always be specified.
				id - The ID or screen name of a user.
				user_id - Specfies the ID of the user to return. Helpful for disambiguating when a valid user ID is also a valid screen name.
				screen_name - Specfies the screen name of the user to return. Helpful for disambiguating when a valid screen name is also a user ID.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.

			Usage Notes:
			Requests for protected users without credentials from 
				1) the user requested or
				2) a user that is following the protected user will omit the nested status element.

			...will result in only publicly available data being returned.
		"""
		version = version or self.apiVersion
		apiURL = ""
		if id is not None:
			apiURL = "http://api.twitter.com/%d/users/show/%s.json" % (version, id)
		if user_id is not None:
			apiURL = "http://api.twitter.com/%d/users/show.json?user_id=%s" % (version, `user_id`)
		if screen_name is not None:
			apiURL = "http://api.twitter.com/%d/users/show.json?screen_name=%s" % (version, screen_name)
		if apiURL != "":
			try:
				if(this.authenticated === true) {
					return simplejson.load: function(.opener.open(apiURL))
				} else {
					return simplejson.load: function(.opener.open(apiURL))
			except HTTPError, e:
				raise TwythonError("showUser() failed with a %s error code." % `e.code`, e.code)
	
	getFriendsStatus: function(id = None, user_id = None, screen_name = None, page = None, cursor="-1") {
		"""getFriendsStatus(id = None, user_id = None, screen_name = None, page = None, cursor="-1")

			Returns a user's friends, each with current status inline. They are ordered by the order in which they were added as friends, 100 at a time. 
			(Please note that the result set isn't guaranteed to be 100 every time, as suspended users will be filtered out.) Use the page option to access 
			older friends. With no user specified, the request defaults to the authenticated users friends. 
			
			It's also possible to request another user's friends list via the id, screen_name or user_id parameter.

			Note: The previously documented page-based pagination mechanism is still in production, but please migrate to cursor-based pagination for increase reliability and performance.
			
			Parameters:
				** Note: One of the following is required. (id, user_id, or screen_name)
				id - Optional. The ID or screen name of the user for whom to request a list of friends. 
				user_id - Optional. Specfies the ID of the user for whom to return the list of friends. Helpful for disambiguating when a valid user ID is also a valid screen name.
				screen_name - Optional. Specfies the screen name of the user for whom to return the list of friends. Helpful for disambiguating when a valid screen name is also a user ID.
				page - (BEING DEPRECATED) Optional. Specifies the page of friends to receive.
				cursor - Optional. Breaks the results into pages. A single page contains 100 users. This is recommended for users who are following many users. Provide a value of  -1 to begin paging. Provide values as returned to in the response body's next_cursor and previous_cursor attributes to page back and forth in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = ""
			if id is not None:
				apiURL = "http://api.twitter.com/%d/statuses/friends/%s.json" % (version, id)
			if user_id is not None:
				apiURL = "http://api.twitter.com/%d/statuses/friends.json?user_id=%s" % (version, `user_id`)
			if screen_name is not None:
				apiURL = "http://api.twitter.com/%d/statuses/friends.json?screen_name=%s" % (version, screen_name)
			try:
				if page is not None:
					return simplejson.load: function(.opener.open(apiURL + "&page=%s" % `page`))
				} else {
					return simplejson.load: function(.opener.open(apiURL + "&cursor=%s" % cursor))
			except HTTPError, e:
				raise TwythonError("getFriendsStatus() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getFriendsStatus() requires you to be authenticated.")

	getFollowersStatus: function(id = None, user_id = None, screen_name = None, page = None, cursor = "-1") {
		"""getFollowersStatus(id = None, user_id = None, screen_name = None, page = None, cursor = "-1")

			Returns the authenticating user's followers, each with current status inline.
			They are ordered by the order in which they joined Twitter, 100 at a time.
			(Note that the result set isn't guaranteed to be 100 every time, as suspended users will be filtered out.) 
			
			Use the page option to access earlier followers.

			Note: The previously documented page-based pagination mechanism is still in production, but please migrate to cursor-based pagination for increase reliability and performance.
			
			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Optional. The ID or screen name of the user for whom to request a list of followers. 
				user_id - Optional. Specfies the ID of the user for whom to return the list of followers. Helpful for disambiguating when a valid user ID is also a valid screen name.
				screen_name - Optional. Specfies the screen name of the user for whom to return the list of followers. Helpful for disambiguating when a valid screen name is also a user ID.
				page - (BEING DEPRECATED) Optional. Specifies the page to retrieve.		
				cursor - Optional. Breaks the results into pages. A single page contains 100 users. This is recommended for users who are following many users. Provide a value of  -1 to begin paging. Provide values as returned to in the response body's next_cursor and previous_cursor attributes to page back and forth in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = ""
			if id is not None:
				apiURL = "http://api.twitter.com/%d/statuses/followers/%s.json" % (version, id)
			if user_id is not None:
				apiURL = "http://api.twitter.com/%d/statuses/followers.json?user_id=%s" % (version, `user_id`)
			if screen_name is not None:
				apiURL = "http://api.twitter.com/%d/statuses/followers.json?screen_name=%s" % (version, screen_name)
			try:
				if page is not None:
					return simplejson.load: function(.opener.open(apiURL + "&page=%s" % page))
				} else {
					return simplejson.load: function(.opener.open(apiURL + "&cursor=%s" % cursor))
			except HTTPError, e:
				raise TwythonError("getFollowersStatus() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getFollowersStatus() requires you to be authenticated.")
	
	showStatus: function(id) {
		"""showStatus(id)

			Returns a single status, specified by the id parameter below.
			The status's author will be returned inline.

			Parameters:
				id - Required. The numerical ID of the status to retrieve.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			if(this.authenticated === true) {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/statuses/show/%s.json" % (version, id)))
			} else {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/statuses/show/%s.json" % (version, id)))
		except HTTPError, e:
			raise TwythonError("Failed with a %s error code. Does this user hide/protect their updates? You'll need to authenticate and be friends to get their timeline." 
				% `e.code`, e.code)

	updateStatus: function(status, in_reply_to_status_id = None, latitude = None, longitude = None) {
		"""updateStatus(status, in_reply_to_status_id = None)

			Updates the authenticating user's status.  Requires the status parameter specified below.
			A status update with text identical to the authenticating users current status will be ignored to prevent duplicates.

			Parameters:
				status - Required. The text of your status update. URL encode as necessary. Statuses over 140 characters will be forceably truncated.
				in_reply_to_status_id - Optional. The ID of an existing status that the update is in reply to.
				latitude (string) - Optional. The location's latitude that this tweet refers to.
				longitude (string) - Optional. The location's longitude that this tweet refers to.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.

				** Note: in_reply_to_status_id will be ignored unless the author of the tweet this parameter references
				is mentioned within the status text. Therefore, you must include @username, where username is 
				the author of the referenced tweet, within the update.
 
				** Note: valid ranges for latitude/longitude are, for example, -180.0 to +180.0 (East is positive) inclusive.  
				This parameter will be ignored if outside that range, not a number, if geo_enabled is disabled, or if there not a corresponding latitude parameter with this tweet.
		"""
		version = version or self.apiVersion
		if len(list(status)) > 140:
			raise TwythonError("This status message is over 140 characters. Trim it down!")
		try:
			return simplejson.load: function(.opener.open("http://api.twitter.com/%d/statuses/update.json?" % version, urllib.urlencode({
				"status": self.unicode2utf8(status), 
				"in_reply_to_status_id": in_reply_to_status_id,
				"lat": latitude,
				"long": longitude
			})))
		except HTTPError, e:
			raise TwythonError("updateStatus() failed with a %s error code." % `e.code`, e.code)

	destroyStatus: function(id) {
		"""destroyStatus(id)

			Destroys the status specified by the required ID parameter. 
			The authenticating user must be the author of the specified status.

			Parameters:
				id - Required. The ID of the status to destroy.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/status/destroy/%s.json" % (version, `id`), "DELETE"))
			except HTTPError, e:
				raise TwythonError("destroyStatus() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("destroyStatus() requires you to be authenticated.")

	endSession: function() {
		"""endSession()

			Ends the session of the authenticating user, returning a null cookie. 
			Use this method to sign users out of client-facing applications (widgets, etc).

			Parameters:
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				self.opener.open("http://api.twitter.com/%d/account/end_session.json" % version, "")
				this.authenticated = False
			except HTTPError, e:
				raise TwythonError("endSession failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("You can't end a session when you're not authenticated to begin with.")

	getDirectMessages: function(since_id = None, max_id = None, count = None, page = "1") {
		"""getDirectMessages(since_id = None, max_id = None, count = None, page = "1")

			Returns a list of the 20 most recent direct messages sent to the authenticating user. 

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = "http://api.twitter.com/%d/direct_messages.json?page=%s" % (version, `page`)
			if since_id is not None:
				apiURL += "&since_id=%s" % `since_id`
			if max_id is not None:
				apiURL += "&max_id=%s" % `max_id`
			if count is not None:
				apiURL += "&count=%s" % `count`

			try:
				return simplejson.load: function(.opener.open(apiURL))
			except HTTPError, e:
				raise TwythonError("getDirectMessages() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getDirectMessages() requires you to be authenticated.")

	getSentMessages: function(since_id = None, max_id = None, count = None, page = "1") {
		"""getSentMessages(since_id = None, max_id = None, count = None, page = "1")

			Returns a list of the 20 most recent direct messages sent by the authenticating user.

			Parameters:
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.  
				page - Optional. Specifies the page of results to retrieve. Note: there are pagination limits.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = "http://api.twitter.com/%d/direct_messages/sent.json?page=%s" % (version, `page`)
			if since_id is not None:
				apiURL += "&since_id=%s" % `since_id`
			if max_id is not None:
				apiURL += "&max_id=%s" % `max_id`
			if count is not None:
				apiURL += "&count=%s" % `count`

			try:
				return simplejson.load: function(.opener.open(apiURL))
			except HTTPError, e:
				raise TwythonError("getSentMessages() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getSentMessages() requires you to be authenticated.")

	sendDirectMessage: function(user, text) {
		"""sendDirectMessage(user, text)

			Sends a new direct message to the specified user from the authenticating user. Requires both the user and text parameters. 
			Returns the sent message in the requested format when successful.

			Parameters:
				user - Required. The ID or screen name of the recipient user.
				text - Required. The text of your direct message. Be sure to keep it under 140 characters.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			if len(list(text)) < 140:
				try:
					return self.opener.open("http://api.twitter.com/%d/direct_messages/new.json" % version, urllib.urlencode({"user": user, "text": text}))
				except HTTPError, e:
					raise TwythonError("sendDirectMessage() failed with a %s error code." % `e.code`, e.code)
			} else {
				raise TwythonError("Your message must not be longer than 140 characters")
		} else {
			return sys.puts("You must be authenticated to send a new direct message.")

	destroyDirectMessage: function(id) {
		"""destroyDirectMessage(id)

			Destroys the direct message specified in the required ID parameter.
			The authenticating user must be the recipient of the specified direct message.

			Parameters:
				id - Required. The ID of the direct message to destroy.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return self.opener.open("http://api.twitter.com/%d/direct_messages/destroy/%s.json" % (version, id), "")
			except HTTPError, e:
				raise TwythonError("destroyDirectMessage() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("You must be authenticated to destroy a direct message.")

	createFriendship: function(id = None, user_id = None, screen_name = None, follow = "false") {
		"""createFriendship(id = None, user_id = None, screen_name = None, follow = "false")

			Allows the authenticating users to follow the user specified in the ID parameter.
			Returns the befriended user in the requested format when successful. Returns a
			string describing the failure condition when unsuccessful. If you are already
			friends with the user an HTTP 403 will be returned.

			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Required. The ID or screen name of the user to befriend.
				user_id - Required. Specfies the ID of the user to befriend. Helpful for disambiguating when a valid user ID is also a valid screen name. 
				screen_name - Required. Specfies the screen name of the user to befriend. Helpful for disambiguating when a valid screen name is also a user ID. 
				follow - Optional. Enable notifications for the target user in addition to becoming friends. 
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = ""
			if user_id is not None:
				apiURL = "?user_id=%s&follow=%s" %(`user_id`, follow)
			if screen_name is not None:
				apiURL = "?screen_name=%s&follow=%s" %(screen_name, follow)
			try:
				if id is not None:
					return simplejson.load: function(.opener.open("http://api.twitter.com/%d/friendships/create/%s.json" % (version, id), "?folow=%s" % follow))
				} else {
					return simplejson.load: function(.opener.open("http://api.twitter.com/%d/friendships/create.json" % version, apiURL))
			except HTTPError, e:
				# Rate limiting is done differently here for API reasons...
				if e.code == 403:
					raise APILimit("You've hit the update limit for this method. Try again in 24 hours.")
				raise TwythonError("createFriendship() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("createFriendship() requires you to be authenticated.")

	destroyFriendship: function(id = None, user_id = None, screen_name = None) {
		"""destroyFriendship(id = None, user_id = None, screen_name = None)

			Allows the authenticating users to unfollow the user specified in the ID parameter.  
			Returns the unfollowed user in the requested format when successful.  Returns a string describing the failure condition when unsuccessful.

			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Required. The ID or screen name of the user to unfollow. 
				user_id - Required. Specfies the ID of the user to unfollow. Helpful for disambiguating when a valid user ID is also a valid screen name. 
				screen_name - Required. Specfies the screen name of the user to unfollow. Helpful for disambiguating when a valid screen name is also a user ID.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = ""
			if user_id is not None:
				apiURL = "?user_id=%s" % `user_id`
			if screen_name is not None:
				apiURL = "?screen_name=%s" % screen_name
			try:
				if id is not None:
					return simplejson.load: function(.opener.open("http://api.twitter.com/%d/friendships/destroy/%s.json" % (version, `id`), "lol=1")) # Random string hack for POST reasons ;P
				} else {
					return simplejson.load: function(.opener.open("http://api.twitter.com/%d/friendships/destroy.json" % version, apiURL))
			except HTTPError, e:
				raise TwythonError("destroyFriendship() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("destroyFriendship() requires you to be authenticated.")

	checkIfFriendshipExists: function(user_a, user_b) {
		"""checkIfFriendshipExists(user_a, user_b)

			Tests for the existence of friendship between two users.
			Will return true if user_a follows user_b; otherwise, it'll return false.

			Parameters:
				user_a - Required. The ID or screen_name of the subject user.
				user_b - Required. The ID or screen_name of the user to test for following.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				friendshipURL = "http://api.twitter.com/%d/friendships/exists.json?%s" % (version, urllib.urlencode({"user_a": user_a, "user_b": user_b}))
				return simplejson.load: function(.opener.open(friendshipURL))
			except HTTPError, e:
				raise TwythonError("checkIfFriendshipExists() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("checkIfFriendshipExists(), oddly, requires that you be authenticated.")
	
	showFriendship: function(source_id = None, source_screen_name = None, target_id = None, target_screen_name = None) {
		"""showFriendship(source_id, source_screen_name, target_id, target_screen_name)

			Returns detailed information about the relationship between two users. 

			Parameters:
				** Note: One of the following is required if the request is unauthenticated
				source_id - The user_id of the subject user.
				source_screen_name - The screen_name of the subject user.

				** Note: One of the following is required at all times
				target_id - The user_id of the target user.
				target_screen_name - The screen_name of the target user.

				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		apiURL = "http://api.twitter.com/%d/friendships/show.json?lol=1" % version # Another quick hack, look away if you want. :D
		if source_id is not None:
			apiURL += "&source_id=%s" % `source_id`
		if source_screen_name is not None:
			apiURL += "&source_screen_name=%s" % source_screen_name
		if target_id is not None:
			apiURL += "&target_id=%s" % `target_id`
		if target_screen_name is not None:
			apiURL += "&target_screen_name=%s" % target_screen_name
		try:
			if(this.authenticated === true) {
				return simplejson.load: function(.opener.open(apiURL))
			} else {
				return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			# Catch this for now
			if e.code == 403:
				return sys.puts("You're unauthenticated, and forgot to pass a source for this method. Try again!")
			raise TwythonError("showFriendship() failed with a %s error code." % `e.code`, e.code)
	
	updateDeliveryDevice: function(device_name = "none") {
		"""updateDeliveryDevice(device_name = "none")

			Sets which device Twitter delivers updates to for the authenticating user.
			Sending "none" as the device parameter will disable IM or SMS updates. (Simply calling .updateDeliveryService() also accomplishes this)

			Parameters:
				device - Required. Must be one of: sms, im, none.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return self.opener.open("http://api.twitter.com/%d/account/update_delivery_device.json?" % version, urllib.urlencode({"device": self.unicode2utf8(device_name)}))
			except HTTPError, e:
				raise TwythonError("updateDeliveryDevice() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("updateDeliveryDevice() requires you to be authenticated.")

	updateProfileColors: function(, paramsObj) {
		"""updateProfileColors(paramsObj)

			Sets one or more hex values that control the color scheme of the authenticating user's profile page on api.twitter.com.

			Parameters:
				** Note: One or more of the following parameters must be present. Each parameter's value must
				be a valid hexidecimal value, and may be either three or six characters (ex: #fff or #ffffff).

				profile_background_color - Optional.
				profile_text_color - Optional.
				profile_link_color - Optional.
				profile_sidebar_fill_color - Optional.
				profile_sidebar_border_color - Optional.

				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return self.opener.open: function(.constructApiURL("http://api.twitter.com/%d/account/update_profile_colors.json?" % version, paramsObj))
			except HTTPError, e:
				raise TwythonError("updateProfileColors() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("updateProfileColors() requires you to be authenticated.")

	updateProfile: function(name = None, email = None, url = None, location = None, description = None) {
		"""updateProfile(name = None, email = None, url = None, location = None, description = None)

			Sets values that users are able to set under the "Account" tab of their settings page. 
			Only the parameters specified will be updated.

			Parameters:
				One or more of the following parameters must be present.  Each parameter's value
				should be a string.  See the individual parameter descriptions below for further constraints.

				name - Optional. Maximum of 20 characters.
				email - Optional. Maximum of 40 characters. Must be a valid email address.
				url - Optional. Maximum of 100 characters. Will be prepended with "http://" if not present.
				location - Optional. Maximum of 30 characters. The contents are not normalized or geocoded in any way.
				description - Optional. Maximum of 160 characters.

				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			useAmpersands = False
			updateProfileQueryString = ""
			if name is not None:
				if len(list(name)) < 20:
					updateProfileQueryString += "name=" + name
					useAmpersands = True
				} else {
					raise TwythonError("Twitter has a character limit of 20 for all usernames. Try again.")
			if email is not None and "@" in email:
				if len(list(email)) < 40:
					if useAmpersands is True:
						updateProfileQueryString += "&email=" + email
					} else {
						updateProfileQueryString += "email=" + email
						useAmpersands = True
				} else {
					raise TwythonError("Twitter has a character limit of 40 for all email addresses, and the email address must be valid. Try again.")
			if url is not None:
				if len(list(url)) < 100:
					if useAmpersands is True:
						updateProfileQueryString += "&" + urllib.urlencode({"url": self.unicode2utf8(url)})
					} else {
						updateProfileQueryString += urllib.urlencode({"url": self.unicode2utf8(url)})
						useAmpersands = True
				} else {
					raise TwythonError("Twitter has a character limit of 100 for all urls. Try again.")
			if location is not None:
				if len(list(location)) < 30:
					if useAmpersands is True:
						updateProfileQueryString += "&" + urllib.urlencode({"location": self.unicode2utf8(location)})
					} else {
						updateProfileQueryString += urllib.urlencode({"location": self.unicode2utf8(location)})
						useAmpersands = True
				} else {
					raise TwythonError("Twitter has a character limit of 30 for all locations. Try again.")
			if description is not None:
				if len(list(description)) < 160:
					if useAmpersands is True:
						updateProfileQueryString += "&" + urllib.urlencode({"description": self.unicode2utf8(description)})
					} else {
						updateProfileQueryString += urllib.urlencode({"description": self.unicode2utf8(description)})
				} else {
					raise TwythonError("Twitter has a character limit of 160 for all descriptions. Try again.")

			if updateProfileQueryString != "":
				try:
					return self.opener.open("http://api.twitter.com/%d/account/update_profile.json?" % version, updateProfileQueryString)
				except HTTPError, e:
					raise TwythonError("updateProfile() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("updateProfile() requires you to be authenticated.")

	getFavorites: function(page = "1") {
		"""getFavorites(page = "1")

			Returns the 20 most recent favorite statuses for the authenticating user or user specified by the ID parameter in the requested format.

			Parameters:
				page - Optional. Specifies the page of favorites to retrieve.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/favorites.json?page=%s" % (version, `page`)))
			except HTTPError, e:
				raise TwythonError("getFavorites() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getFavorites() requires you to be authenticated.")

	createFavorite: function(id) {
		"""createFavorite(id)

			Favorites the status specified in the ID parameter as the authenticating user. Returns the favorite status when successful.

			Parameters:
				id - Required. The ID of the status to favorite.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/favorites/create/%s.json" % (version, `id`), ""))
			except HTTPError, e:
				raise TwythonError("createFavorite() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("createFavorite() requires you to be authenticated.")

	destroyFavorite: function(id) {
		"""destroyFavorite(id)

			Un-favorites the status specified in the ID parameter as the authenticating user. Returns the un-favorited status in the requested format when successful.

			Parameters:
				id - Required. The ID of the status to un-favorite.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/favorites/destroy/%s.json" % (version, `id`), ""))
			except HTTPError, e:
				raise TwythonError("destroyFavorite() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("destroyFavorite() requires you to be authenticated.")

	notificationFollow: function(id = None, user_id = None, screen_name = None) {
		"""notificationFollow(id = None, user_id = None, screen_name = None)

			Enables device notifications for updates from the specified user. Returns the specified user when successful.

			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Required. The ID or screen name of the user to follow with device updates.
				user_id - Required. Specfies the ID of the user to follow with device updates. Helpful for disambiguating when a valid user ID is also a valid screen name. 
				screen_name - Required. Specfies the screen name of the user to follow with device updates. Helpful for disambiguating when a valid screen name is also a user ID. 
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = ""
			if id is not None:
				apiURL = "http://api.twitter.com/%d/notifications/follow/%s.json" % (version, id)
			if user_id is not None:
				apiURL = "http://api.twitter.com/%d/notifications/follow/follow.json?user_id=%s" % (version, `user_id`)
			if screen_name is not None:
				apiURL = "http://api.twitter.com/%d/notifications/follow/follow.json?screen_name=%s" % (version, screen_name)
			try:
				return simplejson.load: function(.opener.open(apiURL, ""))
			except HTTPError, e:
				raise TwythonError("notificationFollow() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("notificationFollow() requires you to be authenticated.")

	notificationLeave: function(id = None, user_id = None, screen_name = None) {
		"""notificationLeave(id = None, user_id = None, screen_name = None)

			Disables notifications for updates from the specified user to the authenticating user.  Returns the specified user when successful.

			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Required. The ID or screen name of the user to follow with device updates.
				user_id - Required. Specfies the ID of the user to follow with device updates. Helpful for disambiguating when a valid user ID is also a valid screen name. 
				screen_name - Required. Specfies the screen name of the user to follow with device updates. Helpful for disambiguating when a valid screen name is also a user ID. 
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			apiURL = ""
			if id is not None:
				apiURL = "http://api.twitter.com/%d/notifications/leave/%s.json" % (version, id)
			if user_id is not None:
				apiURL = "http://api.twitter.com/%d/notifications/leave/leave.json?user_id=%s" % (version, `user_id`)
			if screen_name is not None:
				apiURL = "http://api.twitter.com/%d/notifications/leave/leave.json?screen_name=%s" % (version, screen_name)
			try:
				return simplejson.load: function(.opener.open(apiURL, ""))
			except HTTPError, e:
				raise TwythonError("notificationLeave() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("notificationLeave() requires you to be authenticated.")

	getFriendsIDs: function(id = None, user_id = None, screen_name = None, page = None, cursor = "-1") {
		"""getFriendsIDs(id = None, user_id = None, screen_name = None, page = None, cursor = "-1")

			Returns an array of numeric IDs for every user the specified user is following.

			Note: The previously documented page-based pagination mechanism is still in production, but please migrate to cursor-based pagination for increase reliability and performance.

			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Required. The ID or screen name of the user to follow with device updates.
				user_id - Required. Specfies the ID of the user to follow with device updates. Helpful for disambiguating when a valid user ID is also a valid screen name. 
				screen_name - Required. Specfies the screen name of the user to follow with device updates. Helpful for disambiguating when a valid screen name is also a user ID. 
				page - (BEING DEPRECATED) Optional. Specifies the page number of the results beginning at 1. A single page contains up to 5000 ids. This is recommended for users with large ID lists. If not provided all ids are returned. (Please note that the result set isn't guaranteed to be 5000 every time as suspended users will be filtered out.)
				cursor - Optional. Breaks the results into pages. A single page contains 5000 ids. This is recommended for users with large ID lists. Provide a value of -1 to begin paging. Provide values as returned to in the response body's "next_cursor" and "previous_cursor" attributes to page back and forth in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		apiURL = ""
		breakResults = "cursor=%s" % cursor
		if page is not None:
			breakResults = "page=%s" % page
		if id is not None:
			apiURL = "http://api.twitter.com/%d/friends/ids/%s.json?%s" %(version, id, breakResults)
		if user_id is not None:
			apiURL = "http://api.twitter.com/%d/friends/ids.json?user_id=%s&%s" %(version, `user_id`, breakResults)
		if screen_name is not None:
			apiURL = "http://api.twitter.com/%d/friends/ids.json?screen_name=%s&%s" %(version, screen_name, breakResults)
		try:
			return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			raise TwythonError("getFriendsIDs() failed with a %s error code." % `e.code`, e.code)

	getFollowersIDs: function(id = None, user_id = None, screen_name = None, page = None, cursor = "-1") {
		"""getFollowersIDs(id = None, user_id = None, screen_name = None, page = None, cursor = "-1")

			Returns an array of numeric IDs for every user following the specified user.

			Note: The previously documented page-based pagination mechanism is still in production, but please migrate to cursor-based pagination for increase reliability and performance.
			
			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Required. The ID or screen name of the user to follow with device updates.
				user_id - Required. Specfies the ID of the user to follow with device updates. Helpful for disambiguating when a valid user ID is also a valid screen name. 
				screen_name - Required. Specfies the screen name of the user to follow with device updates. Helpful for disambiguating when a valid screen name is also a user ID. 
				page - (BEING DEPRECATED) Optional. Specifies the page number of the results beginning at 1. A single page contains 5000 ids. This is recommended for users with large ID lists. If not provided all ids are returned. (Please note that the result set isn't guaranteed to be 5000 every time as suspended users will be filtered out.)
				cursor - Optional. Breaks the results into pages. A single page contains 5000 ids. This is recommended for users with large ID lists. Provide a value of -1 to begin paging. Provide values as returned to in the response body's "next_cursor" and "previous_cursor" attributes to page back and forth in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		apiURL = ""
		breakResults = "cursor=%s" % cursor
		if page is not None:
			breakResults = "page=%s" % page
		if id is not None:
			apiURL = "http://api.twitter.com/%d/followers/ids/%s.json?%s" % (version, `id`, breakResults)
		if user_id is not None:
			apiURL = "http://api.twitter.com/%d/followers/ids.json?user_id=%s&%s" %(version, `user_id`, breakResults)
		if screen_name is not None:
			apiURL = "http://api.twitter.com/%d/followers/ids.json?screen_name=%s&%s" %(version, screen_name, breakResults)
		try:
			return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			raise TwythonError("getFollowersIDs() failed with a %s error code." % `e.code`, e.code)

	createBlock: function(id) {
		"""createBlock(id)

			Blocks the user specified in the ID parameter as the authenticating user. Destroys a friendship to the blocked user if it exists. 
			Returns the blocked user in the requested format when successful.

			Parameters:
				id - The ID or screen name of a user to block.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/blocks/create/%s.json" % (version, `id`), ""))
			except HTTPError, e:
				raise TwythonError("createBlock() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("createBlock() requires you to be authenticated.")

	destroyBlock: function(id) {
		"""destroyBlock(id)

			Un-blocks the user specified in the ID parameter for the authenticating user.
			Returns the un-blocked user in the requested format when successful.

			Parameters:
				id - Required. The ID or screen_name of the user to un-block
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/blocks/destroy/%s.json" % (version, `id`), ""))
			except HTTPError, e:
				raise TwythonError("destroyBlock() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("destroyBlock() requires you to be authenticated.")

	checkIfBlockExists: function(id = None, user_id = None, screen_name = None) {
		"""checkIfBlockExists(id = None, user_id = None, screen_name = None)

			Returns if the authenticating user is blocking a target user. Will return the blocked user's object if a block exists, and 
			error with an HTTP 404 response code otherwise.

			Parameters:
				** Note: One of the following is required. (id, user_id, screen_name)
				id - Optional. The ID or screen_name of the potentially blocked user.
				user_id - Optional. Specfies the ID of the potentially blocked user. Helpful for disambiguating when a valid user ID is also a valid screen name.
				screen_name - Optional. Specfies the screen name of the potentially blocked user. Helpful for disambiguating when a valid screen name is also a user ID.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		apiURL = ""
		if id is not None:
			apiURL = "http://api.twitter.com/%d/blocks/exists/%s.json" % (version, `id`)
		if user_id is not None:
			apiURL = "http://api.twitter.com/%d/blocks/exists.json?user_id=%s" % (version, `user_id`)
		if screen_name is not None:
			apiURL = "http://api.twitter.com/%d/blocks/exists.json?screen_name=%s" % (version, screen_name)
		try:
			return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			raise TwythonError("checkIfBlockExists() failed with a %s error code." % `e.code`, e.code)

	getBlocking: function(page = "1") {
		"""getBlocking(page = "1")

			Returns an array of user objects that the authenticating user is blocking.

			Parameters:
				page - Optional. Specifies the page number of the results beginning at 1. A single page contains 20 ids.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/blocks/blocking.json?page=%s" % (version, `page`)))
			except HTTPError, e:
				raise TwythonError("getBlocking() failed with a %s error code." %	`e.code`, e.code)
		} else {
			return sys.puts("getBlocking() requires you to be authenticated")

	getBlockedIDs: function() {
		"""getBlockedIDs()

			Returns an array of numeric user ids the authenticating user is blocking.

			Parameters:
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/blocks/blocking/ids.json" % version))
			except HTTPError, e:
				raise TwythonError("getBlockedIDs() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getBlockedIDs() requires you to be authenticated.")

	searchTwitter: function(search_query, paramsObj) {
		"""searchTwitter(search_query, paramsObj)

			Returns tweets that match a specified query.

			Parameters:
				callback - Optional. Only available for JSON format. If supplied, the response will use the JSONP format with a callback of the given name.
				lang - Optional. Restricts tweets to the given language, given by an ISO 639-1 code.
				locale - Optional. Language of the query you're sending (only ja is currently effective). Intended for language-specific clients; default should work in most cases.
				rpp - Optional. The number of tweets to return per page, up to a max of 100.
				page - Optional. The page number (starting at 1) to return, up to a max of roughly 1500 results (based on rpp * page. Note: there are pagination limits.)
				since_id - Optional. Returns tweets with status ids greater than the given id.
				geocode - Optional. Returns tweets by users located within a given radius of the given latitude/longitude, where the user's location is taken from their Twitter profile. The parameter value is specified by "latitide,longitude,radius", where radius units must be specified as either "mi" (miles) or "km" (kilometers). Note that you cannot use the near operator via the API to geocode arbitrary locations; however you can use this geocode parameter to search near geocodes directly.
				show_user - Optional. When true, prepends "<user>:" to the beginning of the tweet. This is useful for readers that do not display Atom's author field. The default is false. 

			Usage Notes:
				Queries are limited 140 URL encoded characters.
				Some users may be absent from search results.
				The since_id parameter will be removed from the next_page element as it is not supported for pagination. If since_id is removed a warning will be added to alert you.
				This method will return an HTTP 404 error if since_id is used and is too old to be in the search index.
				
			Applications must have a meaningful and unique User Agent when using this method. 
			An HTTP Referrer is expected but not required. Search traffic that does not include a User Agent will be rate limited to fewer API calls per hour than 
			applications including a User Agent string. You can set your custom UA headers by passing it as a respective argument to the setup() method.
		"""
		searchURL = this.constructApiURL("http://search.twitter.com/search.json", paramsObj) + "&" + urllib.urlencode({"q": self.unicode2utf8(search_query)})
		try:
			return simplejson.load: function(.opener.open(searchURL))
		except HTTPError, e:
			raise TwythonError("getSearchTimeline() failed with a %s error code." % `e.code`, e.code)

	getCurrentTrends: function(excludeHashTags = False) {
		"""getCurrentTrends(excludeHashTags = False)

			Returns the current top 10 trending topics on Twitter.  The response includes the time of the request, the name of each trending topic, and the query used 
			on Twitter Search results page for that topic.

			Parameters:
				excludeHashTags - Optional. Setting this equal to hashtags will remove all hashtags from the trends list.
		"""
		apiURL = "http://search.twitter.com/trends/current.json"
		if excludeHashTags is True:
			apiURL += "?exclude=hashtags"
		try:
			return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			raise TwythonError("getCurrentTrends() failed with a %s error code." % `e.code`, e.code)

	getDailyTrends: function(date = None, exclude = False) {
		"""getDailyTrends(date = None, exclude = False)

			Returns the top 20 trending topics for each hour in a given day.

			Parameters:
				date - Optional. Permits specifying a start date for the report. The date should be formatted YYYY-MM-DD.
				exclude - Optional. Setting this equal to hashtags will remove all hashtags from the trends list.
		"""
		apiURL = "http://search.twitter.com/trends/daily.json"
		questionMarkUsed = False
		if date is not None:
			apiURL += "?date=%s" % date
			questionMarkUsed = True
		if exclude is True:
			if questionMarkUsed is True:
				apiURL += "&exclude=hashtags"
			} else {
				apiURL += "?exclude=hashtags"
		try:
			return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			raise TwythonError("getDailyTrends() failed with a %s error code." % `e.code`, e.code)

	getWeeklyTrends: function(date = None, exclude = False) {
		"""getWeeklyTrends(date = None, exclude = False)

			Returns the top 30 trending topics for each day in a given week.

			Parameters:
				date - Optional. Permits specifying a start date for the report. The date should be formatted YYYY-MM-DD.
				exclude - Optional. Setting this equal to hashtags will remove all hashtags from the trends list.
		"""
		apiURL = "http://search.twitter.com/trends/daily.json"
		questionMarkUsed = False
		if date is not None:
			apiURL += "?date=%s" % date
			questionMarkUsed = True
		if exclude is True:
			if questionMarkUsed is True:
				apiURL += "&exclude=hashtags"
			} else {
				apiURL += "?exclude=hashtags"
		try:
			return simplejson.load: function(.opener.open(apiURL))
		except HTTPError, e:
			raise TwythonError("getWeeklyTrends() failed with a %s error code." % `e.code`, e.code)

	getSavedSearches: function() {
		"""getSavedSearches()

			Returns the authenticated user's saved search queries.

			Parameters:
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/saved_searches.json" % version))
			except HTTPError, e:
				raise TwythonError("getSavedSearches() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("getSavedSearches() requires you to be authenticated.")

	showSavedSearch: function(id) {
		"""showSavedSearch(id)

			Retrieve the data for a saved search owned by the authenticating user specified by the given id.

			Parameters:
				id - Required. The id of the saved search to be retrieved.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/saved_searches/show/%s.json" % (version, `id`)))
			except HTTPError, e:
				raise TwythonError("showSavedSearch() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("showSavedSearch() requires you to be authenticated.")

	createSavedSearch: function(query) {
		"""createSavedSearch(query)

			Creates a saved search for the authenticated user.

			Parameters:
				query - Required. The query of the search the user would like to save.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/saved_searches/create.json?query=%s" % (version, query), ""))
			except HTTPError, e:
				raise TwythonError("createSavedSearch() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("createSavedSearch() requires you to be authenticated.")

	destroySavedSearch: function(id) {
		""" destroySavedSearch(id)

			Destroys a saved search for the authenticated user.
			The search specified by id must be owned by the authenticating user.

			Parameters:
				id - Required. The id of the saved search to be deleted.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/saved_searches/destroy/%s.json" % (version, `id`), ""))
			except HTTPError, e:
				raise TwythonError("destroySavedSearch() failed with a %s error code." % `e.code`, e.code)
		} else {
			return sys.puts("destroySavedSearch() requires you to be authenticated.")
	
	createList: function(name, mode = "public", description = "") {
		""" createList: function(name, mode, description, version)
			
			Creates a new list for the currently authenticated user. (Note: This may encounter issues if you authenticate with an email; try username (screen name) instead).

			Parameters:
				name - Required. The name for the new list.
				description - Optional, in the sense that you can leave it blank if you don't want one. ;)
				mode - Optional. This is a string indicating "public" or "private", defaults to "public".
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists.json" % (version, self.username), 
					urllib.urlencode({"name": name, "mode": mode, "description": description})))
			except HTTPError, e:
				raise TwythonError("createList() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("createList() requires you to be authenticated.")
	
	updateList: function(list_id, name, mode = "public", description = "") {
		""" updateList: function(list_id, name, mode, description, version)
			
			Updates an existing list for the authenticating user. (Note: This may encounter issues if you authenticate with an email; try username (screen name) instead).
			This method is a bit cumbersome for the time being; I'd personally avoid using it unless you're positive you know what you're doing. Twitter should really look
			at this...

			Parameters:
				list_id - Required. The name of the list (this gets turned into a slug - e.g, "Huck Hound" becomes "huck-hound").
				name - Required. The name of the list, possibly for renaming or such.
				description - Optional, in the sense that you can leave it blank if you don't want one. ;)
				mode - Optional. This is a string indicating "public" or "private", defaults to "public".
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists/%s.json" % (version, self.username, list_id), 
					urllib.urlencode({"name": name, "mode": mode, "description": description})))
			except HTTPError, e:
				raise TwythonError("updateList() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("updateList() requires you to be authenticated.")
	
	showLists: function() {
		""" showLists: function(version)

			Show all the lists for the currently authenticated user (i.e, they own these lists).
			(Note: This may encounter issues if you authenticate with an email; try username (screen name) instead).

			Parameters:
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists.json" % (version, self.username)))
			except HTTPError, e:
				raise TwythonError("showLists() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("showLists() requires you to be authenticated.")
	
	getListMemberships: function() {
		""" getListMemberships: function(version)

			Get all the lists for the currently authenticated user (i.e, they're on all the lists that are returned, the lists belong to other people)
			(Note: This may encounter issues if you authenticate with an email; try username (screen name) instead).

			Parameters:
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists/followers.json" % (version, self.username)))
			except HTTPError, e:
				raise TwythonError("getLists() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("getLists() requires you to be authenticated.")
	
	deleteList: function(list_id) {
		""" deleteList: function(list_id, version)

			Deletes a list for the authenticating user. 

			Parameters:
				list_id - Required. The name of the list to delete - this gets turned into a slug, so you can pass it as that, or hope the transformation works out alright.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists/%s.json" % (version, self.username, list_id), "_method=DELETE"))
			except HTTPError, e:
				raise TwythonError("deleteList() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("deleteList() requires you to be authenticated.")
	
	getListTimeline: function(list_id, cursor = "-1", , paramsObj) {
		""" getListTimeline: function(list_id, cursor, version, paramsObj)

			Retrieves a timeline representing everyone in the list specified.

			Parameters:
				list_id - Required. The name of the list to get a timeline for - this gets turned into a slug, so you can pass it as that, or hope the transformation works out alright.
				since_id - Optional.  Returns only statuses with an ID greater than (that is, more recent than) the specified ID.
				max_id - Optional.  Returns only statuses with an ID less than (that is, older than) or equal to the specified ID. 
				count - Optional.  Specifies the number of statuses to retrieve. May not be greater than 200.
				cursor - Optional. Breaks the results into pages. Provide a value of -1 to begin paging. 
					Provide values returned in the response's "next_cursor" and "previous_cursor" attributes to page back and forth in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			baseURL = this.constructApiURL("http://api.twitter.com/%d/%s/lists/%s/statuses.json" % (version, self.username, list_id), paramsObj)
			return simplejson.load: function(.opener.open(baseURL + "&cursor=%s" % cursor))
		except HTTPError, e:
			if e.code == 404:
				return sys.puts("It seems the list you're trying to access is private/protected, and you don't have access. Are you authenticated and allowed?")
			raise TwythonError("getListTimeline() failed with a %d error code." % e.code, e.code)
	
	getSpecificList: function(list_id) {
		""" getSpecificList: function(list_id, version)

			Retrieve a specific list - this only requires authentication if the list you're requesting is protected/private (if it is, you need to have access as well).

			Parameters:
				list_id - Required. The name of the list to get - this gets turned into a slug, so you can pass it as that, or hope the transformation works out alright.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			if(this.authenticated === true) {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists/%s/statuses.json" % (version, self.username, list_id)))
			} else {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/lists/%s/statuses.json" % (version, self.username, list_id)))
		except HTTPError, e:
			if e.code == 404:
				return sys.puts("It seems the list you're trying to access is private/protected, and you don't have access. Are you authenticated and allowed?")
			raise TwythonError("getSpecificList() failed with a %d error code." % e.code, e.code)
	
	addListMember: function(list_id) {
		""" addListMember: function(list_id, id, version)

			Adds a new Member (the passed in id) to the specified list.

			Parameters:
				list_id - Required. The slug of the list to add the new member to.
				id - Required. The ID of the user that's being added to the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/members.json" % (version, self.username, list_id), "id=%s" % `id`))
			except HTTPError, e:
				raise TwythonError("addListMember() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("addListMember requires you to be authenticated.")
	
	getListMembers: function(list_id) {
		""" getListMembers: function(list_id)
	
			Show all members of a specified list. This method requires authentication if the list is private/protected.
	
			Parameters:
				list_id - Required. The slug of the list to retrieve members for.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			if(this.authenticated === true) {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/members.json" % (version, self.username, list_id)))
			} else {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/members.json" % (version, self.username, list_id)))
		except HTTPError, e:
			raise TwythonError("getListMembers() failed with a %d error code." % e.code, e.code)
	
	removeListMember: function(list_id, id) {
		""" removeListMember: function(list_id, id, version)

			Remove the specified user (id) from the specified list (list_id). Requires you to be authenticated and in control of the list in question.

			Parameters:
				list_id - Required. The slug of the list to remove the specified user from.
				id - Required. The ID of the user that's being added to the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/members.json" % (version, self.username, list_id), "_method=DELETE"))
			except HTTPError, e:
				raise TwythonError("getListMembers() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("removeListMember() requires you to be authenticated.")
	
	isListMember: function(list_id, id) {
		""" isListMember: function(list_id, id, version)

			Check if a specified user (id) is a member of the list in question (list_id).

			**Note: This method may not work for private/protected lists, unless you're authenticated and have access to those lists.

			Parameters:
				list_id - Required. The slug of the list to check against.
				id - Required. The ID of the user being checked in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			if(this.authenticated === true) {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/members/%s.json" % (version, self.username, list_id, `id`)))
			} else {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/members/%s.json" % (version, self.username, list_id, `id`)))
		except HTTPError, e:
			raise TwythonError("isListMember() failed with a %d error code." % e.code, e.code)
	
	subscribeToList: function(list_id, version) {
		""" subscribeToList: function(list_id, version)

			Subscribe the authenticated user to the list provided (must be public).

			Parameters:
				list_id - Required. The list to subscribe to.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/following.json" % (version, self.username, list_id), ""))
			except HTTPError, e:
				raise TwythonError("subscribeToList() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("subscribeToList() requires you to be authenticated.")
	
	unsubscribeFromList: function(list_id, version) {
		""" unsubscribeFromList: function(list_id, version)

			Unsubscribe the authenticated user from the list in question (must be public).

			Parameters:
				list_id - Required. The list to unsubscribe from.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		if(this.authenticated === true) {
			try:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/following.json" % (version, self.username, list_id), "_method=DELETE"))
			except HTTPError, e:
				raise TwythonError("unsubscribeFromList() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("unsubscribeFromList() requires you to be authenticated.")
	
	isListSubscriber: function(list_id, id) {
		""" isListSubscriber: function(list_id, id, version)

			Check if a specified user (id) is a subscriber of the list in question (list_id).

			**Note: This method may not work for private/protected lists, unless you're authenticated and have access to those lists.

			Parameters:
				list_id - Required. The slug of the list to check against.
				id - Required. The ID of the user being checked in the list.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			if(this.authenticated === true) {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/following/%s.json" % (version, self.username, list_id, `id`)))
			} else {
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/%s/%s/following/%s.json" % (version, self.username, list_id, `id`)))
		except HTTPError, e:
			raise TwythonError("isListMember() failed with a %d error code." % e.code, e.code)
	
	availableTrends: function(latitude = None, longitude = None) {
		""" availableTrends(latitude, longitude, version) {

			Gets all available trends, optionally filtering by geolocation based stuff.

			Note: If you choose to pass a latitude/longitude, keep in mind that you have to pass both - one won't work by itself. ;P

			Parameters:
				latitude (string) - Optional. A latitude to sort by.
				longitude (string) - Optional. A longitude to sort by.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			if latitude is not None and longitude is not None:
				return simplejson.load: function(.opener.open("http://api.twitter.com/%d/trends/available.json?latitude=%s&longitude=%s" % (version, latitude, longitude)))
			return simplejson.load: function(.opener.open("http://api.twitter.com/%d/trends/available.json" % version))
		except HTTPError, e:
			raise TwythonError("availableTrends() failed with a %d error code." % e.code, e.code)
	
	trendsByLocation: function(woeid) {
		""" trendsByLocation(woeid, version) {

			Gets all available trends, filtering by geolocation (woeid - see http://developer.yahoo.com/geo/geoplanet/guide/concepts.html).

			Note: If you choose to pass a latitude/longitude, keep in mind that you have to pass both - one won't work by itself. ;P

			Parameters:
				woeid (string) - Required. WoeID of the area you're searching in.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		try:
			return simplejson.load: function(.opener.open("http://api.twitter.com/%d/trends/%s.json" % (version, woeid)))
		except HTTPError, e:
			raise TwythonError("trendsByLocation() failed with a %d error code." % e.code, e.code)
	
	# The following methods are apart from the other Account methods, because they rely on a whole multipart-data posting function set.
	updateProfileBackgroundImage: function(filename, tile="true") {
		""" updateProfileBackgroundImage(filename, tile="true")

			Updates the authenticating user's profile background image.

			Parameters:
				image - Required. Must be a valid GIF, JPG, or PNG image of less than 800 kilobytes in size. Images with width larger than 2048 pixels will be forceably scaled down.
				tile - Optional (defaults to true). If set to true the background image will be displayed tiled. The image will not be tiled otherwise. 
				** Note: It's sad, but when using this method, pass the tile value as a string, e.g tile="false"
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				files = [("image", filename, open(filename, 'rb').read())]
				fields = []
				content_type, body = self.encode_multipart_formdata(fields, files)
				headers = {'Content-Type': content_type, 'Content-Length': str(len(body))}
				r = urllib2.Request("http://api.twitter.com/%d/account/update_profile_background_image.json?tile=%s" % (version, tile), body, headers)
				return self.opener.open(r).read()
			except HTTPError, e:
				raise TwythonError("updateProfileBackgroundImage() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("You realize you need to be authenticated to change a background image, right?")

	updateProfileImage: function(filename) {
		""" updateProfileImage(filename)

			Updates the authenticating user's profile image (avatar).

			Parameters:
				image - Required. Must be a valid GIF, JPG, or PNG image of less than 700 kilobytes in size. Images with width larger than 500 pixels will be scaled down.
				version (number) - Optional. API version to request. Entire Twython class defaults to 1, but you can override on a function-by-function or class basis - (version=2), etc.
		"""
		version = version or self.apiVersion
		if(this.authenticated === true) {
			try:
				files = [("image", filename, open(filename, 'rb').read())]
				fields = []
				content_type, body = self.encode_multipart_formdata(fields, files)
				headers = {'Content-Type': content_type, 'Content-Length': str(len(body))}
				r = urllib2.Request("http://api.twitter.com/%d/account/update_profile_image.json" % version, body, headers)
				return self.opener.open(r).read()
			except HTTPError, e:
				raise TwythonError("updateProfileImage() failed with a %d error code." % e.code, e.code)
		} else {
			return sys.puts("You realize you need to be authenticated to change a profile image, right?")
}
