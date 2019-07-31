const Twit = require('twit');
const request = require('request');
const keys = require("./keys");
const BitlyClient  = require('bitly').BitlyClient;

const bitly = new BitlyClient(keys.bitly_access_token);

const SECONDS_IN_DAY = 86400;

let T = new Twit({
    consumer_key:         keys.consumer_key,
    consumer_secret:      keys.consumer_secret,
    access_token:         keys.access_token,
    access_token_secret:  keys.access_token_secret,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
});

let currentTime = (new Date().getTime() / 1000);
let yesterdayTime = ((currentTime - currentTime % SECONDS_IN_DAY) - SECONDS_IN_DAY) + "";

let options = {
  uri: keys.URL,
  method: "POST",
  json: {
      "jsonrpc":"2.0",
      "method":"icx_call",
      "params":{
          "to": keys.SCORE,
          "dataType":"call",
          "data":{
              "method":"getStoryOfDate",
              "params":{
                  "date": yesterdayTime
              }
          }
      },
      "id":5
  }
};

request(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        let count = Object.keys(body.result.story).length;
        let s = "";
        for (let i = 0; i < count; i++) {
            s += body.result.story[i] + " ";
        }

        console.log(s); // Print the shortened url.

        let newDate = new Date(yesterdayTime * 1000);
        let newURL = "https://IconStory.online/en/" + newDate.getUTCFullYear() + ("0" +(newDate.getUTCMonth() + 1)).slice(-2) + ("0" + newDate.getUTCDate()).slice(-2);

        bitly
            .shorten(newURL)
            .then(function(result) {
                console.log(result);
                s += "\n" + result;
                postTweet(s);
            })
            .catch(function(error) {
                console.error(error);
            });
    }
});

function postTweet(s) {
    T.post('statuses/update', { status: s }, function(err, data, response) {
        console.log(data);
    });
}




