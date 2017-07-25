
/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
  'use strict';

  angular.module('zAdmin.theme')
      .factory('baPanel', baPanel);

  /** @ngInject */
  function baPanel() {

    /** Base baPanel directive */
    return {
      restrict: 'A',
      transclude: true,
      scope:true,
      link:function($scope,elem){
        $scope.togglePannel = togglePannel;

        function togglePannel(){
          $scope.hideBody = !$scope.hideBody;
          $(elem).find('.panel-body').slideToggle(300)
        }
      },
      template: function(elem, attrs) {
        var res = '<div class="panel-body" ng-transclude></div>';
        if (attrs.baPanelTitle) {
          var titleTpl = '<div class="panel-heading clearfix"><h3 class="panel-title">' + attrs.baPanelTitle + '<i class="pannel-toggler ion-chevron-{{!!hideBody ? \'up\' : \'down\'}}" ng-click="togglePannel()"></h3></div>';
          res = titleTpl + res; // title should be before
        }

        return res;
      }
    };
  }

})();
