
/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
  'use strict';

  angular.module('zAdmin.theme.components')
    .controller('BaSidebarCtrl', BaSidebarCtrl);

  /** @ngInject */
  function BaSidebarCtrl($scope, baSidebarService,Core) {

    $scope.menuItems = baSidebarService.getMenuItems();

    $scope.defaultSidebarState = $scope.menuItems[0].stateRef;

    setShowOnSideBar();

    $scope.hoverItem = function ($event) {
      $scope.showHoverElem = true;
      $scope.hoverElemHeight =  $event.currentTarget.clientHeight;
      var menuTopValue = 66;
      $scope.hoverElemTop = $event.currentTarget.getBoundingClientRect().top - menuTopValue;
    };

    $scope.$on('$stateChangeSuccess', function () {
      if (baSidebarService.canSidebarBeHidden()) {
        baSidebarService.setMenuCollapsed(true);
      }
    });

    function setShowOnSideBar(){
      $scope.menuItems.forEach(function(menuItem){
          if(menuItem.showOnSideBar == false){
            menuItem.showOnSideBar= Core.checkForPagePermissions(menuItem.state_id);
          }
      })
    }
  }
})();