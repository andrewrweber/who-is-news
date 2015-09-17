var request = require('request');
var mongoose = require('mongoose');
var Entity = require('../db/Entity');
var getNews = require('./getNews');
var scraperCache = require('./../server/scraperCache');
var apiKeys = require('./api_keys');

var feeds = ['http://news.google.com/news?cf=all&hl=en&pz=1&ned=us&topic=n&output=rss',
             'http://www.pbs.org/newshour/topic/world/feed/',
             'http://news.yahoo.com/rss/us',
             'http://feeds.foxnews.com/foxnews/national?format=xml',
             'http://rss.cnn.com/rss/cnn_us.rss'];


var buildUrl = function(target_url) {
  var base_url = 'http://access.alchemyapi.com/calls/url/URLGetRankedNamedEntities';
  var output_mode = '&outputMode=json';
  var get_sentiment = '&sentiment=1'
  var api_key = '?apikey=' + apiKeys.alchemyApikey;
  var base_target = '&url=';

  return {url: base_url + api_key + output_mode + get_sentiment + base_target + target_url};
};

 
function processEntities(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    
    var entitiesArr = info.entities;

    for(var entity in entitiesArr){
      var text = entitiesArr[entity].text;
      var type = entitiesArr[entity].sentiment.type;

      if(entitiesArr[entity].type === 'Person'){
        addOrUpdateEntity(text, type);
      }
    }
  }
}

var addOrUpdateEntity = function(text, type){
  Entity.findOrCreate({name: text}, function(err, entity, created) {
    if(err){
      return handleError(err);
    }
    else{
      if(created){
        entity.sentiment = type;
        entity.count = 1;
        entity.negCount = 0;
        entity.posCount = 0;
      }

      else{
        entity.count++;
      }
      
      if(type === 'positive'){
        entity.posCount++;
      }
      else if(type === 'negative'){
        entity.negCount++;
      }

      // Check to see if overall sentiment is positive, negative, or neutral
      if(entity.negCount > entity.posCount){
        entity.sentiment = 'negative';
      }
      else if(entity.negCount < entity.posCount){
        entity.sentiment = 'positive';
      }
      else{
        entity.sentiment = 'neutral';
      }

      //Save newly created or updated entity to db
      entity.save(function(err){
        if (err) return handleError(err);
        //saved.
      });
    }
  });
}

module.exports = function(){

  var delay = 0;
  var trackingTimer = 0;

  for(var i = 0; i < feeds.length; i++){
   getNews(feeds[i], function(link){

     var boundBuild = buildUrl.bind(this)
     
     setTimeout(function() {
       var apiUrl = boundBuild(link);
       console.log("Fetching: ",apiUrl.url);
       request(apiUrl, processEntities);
     }, delay+=10000);
   }); 
  }

  function trackTime(){
    if(trackingTimer > delay + 20000){      
      
      Entity.find({}, null, {sort: '-count', limit:250}, function(err, data){
        scraperCache.data = data;
      });
      return;
    }
    trackingTimer += 1000;
    setTimeout(function(){trackTime()}, 1000);
  }
  trackTime();
}













