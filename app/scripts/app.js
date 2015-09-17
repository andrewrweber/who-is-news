'use strict';

var underscore = angular.module('underscore', []);
underscore.factory('_', ['$window', function($window) {
 return $window._; // assumes underscore has already been loaded on the page
}]);

angular
  .module('whoIsNews', [
    'ngRoute',
    'underscore',
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        controllerAs: 'dash'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .factory('Entities', ['$http', function($http){
    return $http.get('/api/entities');
  }]);






















