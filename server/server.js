var express     = require('express'),
    mongoose    = require('mongoose'),
    bodyParser = require('body-parser')
var db = require('../db/db');
var Entity = require('../db/Entity');

var scraper = require('../sentimentScraper/sentimentScraper.js');
var scraperCache = require('./scraperCache');

var app = express();

var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/../app'));
app.use(express.static(__dirname + '/../'));

app.use(bodyParser.json());

// Initialize the cache
Entity.find({}, null, {sort: '-count', limit:275}, function(err, data){
  scraperCache.data = data;
});

// Scrape the news every 6 hours
// 21600000 ms
setInterval(function(){
  Entity.remove({}, function(err){
    console.log('starting scraper');
    scraper();
  });
}, 21600000)

app.get('/api/entities', function(req, res){
  console.log('sending cache');
  res.json(scraperCache.data);
});

app.listen(port, function(){
  console.log("Listening on Port: ", port);
});

module.exports = app;