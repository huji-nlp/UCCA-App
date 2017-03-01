(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.projects.layers', [

    ])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('edit.projects.layers', {
                url: '/layers',
                templateUrl: 'app/pages/edit/projects/layers/edit.projects.layers.html',
                title: 'Edit Project layer',
                controller: 'EditProjectsLayersCtrl',
                controllerAs: 'vm',
                resolve:{
                    EditTableStructure:function(editProjectLayerService){
                        return editProjectLayerService.getEditTableStructure()
                    },
                    LayersTableData: function(editProjectLayerService){
                        return editProjectLayerService.getLayersTableData()
                    }
                }
            });
    }

})();