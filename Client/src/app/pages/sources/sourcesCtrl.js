
/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
  'use strict';

  angular.module('zAdmin.pages.sources')
      .controller('sourcesCtrl', sourcesCtrl);

  /** @ngInject */
  function sourcesCtrl($state, sourcesService, TableStructure, Core, TableData) {

    var vm = this;
    vm.smartTableData = TableData;
    Core.init(vm,TableStructure,sourcesService);

    vm.editRow = editRow;

    function editRow (obj,index){
      console.log("editRow",obj);
      $state.go('edit.sources',{id:obj.id})
    }


  }

})();
