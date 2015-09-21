'use strict';

angular.module('whoIsNews')
  .controller('DashboardCtrl',['$scope', 'Entities', function ($scope, Entities) {
    
    var currentGrouping = 'all';
    $scope.noRecords = false;
    
    $scope.data = {};

    Entities.then(function(response){
      if(response.data.length === 0){
        $scope.noRecords = true;
      }
      drawD3Chart(response.data);
    });

    var drawD3Chart = function(data){

      var width = 1000, height = 575;
      var fill = d3.scale.ordinal()
        .domain(["positive", "negative", "neutral"])
        .range(["green", "red", "blue"])

      var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

      var max_amount = d3.max(data, function (d) { return parseInt(d.count)})
      var radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85])

      _.each(data, function (elem) {
        elem.radius = radius_scale(elem.count)*.4;
        elem.all = 'all';
        elem.x = _.random(0, width);
        elem.y = _.random(0, height);
      })

      var padding = 4;
      var maxRadius = d3.max(_.pluck(data, 'radius'));

      var sentiment_centers = {
        "positive": {name:"Positive", x: 800, y: 250},
        "negative": {name:"Negative", x: 200, y: 250},
        "neutral": {name:"Neutral", x: 500, y: 250}
      }

      var all_center = { "all": {name:"", x: 500, y: 300}};

      var nodes = svg.selectAll("circle")
        .data(data);

      var circles = nodes.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("r", 1)
        .attr("title", function (d){ return d.name; })
        .style("fill", function (d) { return fill(d.sentiment); })
        .on("mouseover", function (d) { showPopover.call(this, d); })
        .on("mouseout", function (d) { removePopovers(); })
        .on("click", function (d){
            var newsBaseUrl = "https://www.google.com/search?hl=en&gl=us&tbm=nws&authuser=0&q=";
            function OpenInNewTab(url) {
              var win = window.open(url, '_blank');
              win.focus();
            }

            OpenInNewTab(newsBaseUrl+d.name);
          });

      nodes.transition().delay(500).duration(5000)
        .attr("r", function (d) { return d.radius; })

      var force = d3.layout.force();

      draw('all');

      $( ".btn" ).click(function() {
        if(currentGrouping === 'all'){
          draw('sentiment');
          currentGrouping = 'sentiment';
        }
        else{
          draw('all');
          currentGrouping = 'all';
        }
        
      });

      function draw (varname) {
        //console.log("varname: ", varname);
        var foci = varname === "all" ? all_center: sentiment_centers;
        force.on("tick", tick(foci, varname));
        labels(foci)
        force.start();
      }

      function tick (foci, varname) {
        return function (e) {
          for (var i = 0; i < data.length; i++) {
            var o = data[i];
            var f = foci[o[varname]];
            o.y += (f.y - o.y) * e.alpha;
            o.x += (f.x - o.x) * e.alpha;
          }
          nodes
            .each(collide(.1))
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });
        }
      }

      function labels (foci) {
        svg.selectAll(".label").remove();

        svg.selectAll(".label")
        .data(_.toArray(foci)).enter().append("text")
        .attr("class", "label")
        .text(function (d) { return d.name })
        .attr("transform", function (d) {
          return "translate(" + (d.x - ((d.name.length)*3)) + ", " + (d.y - 225) + ")";
        });
      }

      function removePopovers () {
        $('.popover').each(function() {
          $(this).remove();
        }); 
      }

      function showPopover (d) {
        $(this).popover({
          placement: 'auto top',
          container: 'body',
          trigger: 'manual',
          html : true,
          content: function() { 
            return "Negative Mentions: " + d.negCount + "<br/>Positive Mentions: " + d.posCount + 
                   "<br/>Total Mentions: " + d.count + "<br/> <strong>Click to Search</strong>"; }
        });
        $(this).popover('show')
      }

      function collide(alpha) {
        var quadtree = d3.geom.quadtree(data);
        return function(d) {
          var r = d.radius + maxRadius + padding,
              nx1 = d.x - r,
              nx2 = d.x + r,
              ny1 = d.y - r,
              ny2 = d.y + r;
          quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
              var x = d.x - quad.point.x,
                  y = d.y - quad.point.y,
                  l = Math.sqrt(x * x + y * y),
                  r = d.radius + quad.point.radius + padding;
              if (l < r) {
                l = (l - r) / l * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
              }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
          });
        };
      }

    }  

  }]);
