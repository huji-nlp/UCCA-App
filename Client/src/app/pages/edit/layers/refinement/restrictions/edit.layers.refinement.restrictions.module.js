/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.layers.refinement.restrictions', [

    ])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('edit.layers.refinement.restrictions', {
                url: '/restrictions/:id',
                templateUrl: 'app/pages/edit/layers/refinement/restrictions/edit.layers.refinement.restrictions.html',
                title: 'Edit Refinement Layer',
                controller: 'EditRefinementLayerRestrictionsCtrl',
                controllerAs: 'vm',
                params:{
                    chosenItem: null,
                    itemRowIndex: null
                },
                resolve:{
                    EditTableStructure:function(editRefinementLayerRestrictionsService){
                        return editRefinementLayerRestrictionsService.getEditTableStructure()
                    },
                    EditTableData:function(editRefinementLayerService){
                        return editRefinementLayerService.get('categories');
                    }
                }
            })
        ;
    }

})();