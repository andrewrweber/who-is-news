var FeedParser = require('feedparser')
  , request = require('request');

// Code from https://github.com/danmactough/node-feedparser
module.exports = function(feed, callback){
  var req = request(feed)
    , feedparser = new FeedParser();

  req.on('error', function (error) {
    // handle any request errors
  });
  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
  });


  feedparser.on('error', function(error) {
    // always handle errors
  });
  feedparser.on('readable', function() {
    // This is where the action is!
    var stream = this
      , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
      , item;

    while (item = stream.read()) {
      if(item.link.split('&url=').length > 1){
        callback(item.link.split('&url=')[1]);
      } else{
        callback(item.link);
      }
    }
  });
}