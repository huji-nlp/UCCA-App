/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.layers.root.restrictions', [

    ])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('edit.layers.root.restrictions', {
                url: '/restrictions/:id',
                templateUrl: 'app/pages/edit/layers/root/restrictions/edit.layers.root.restrictions.html',
                title: 'Edit Root Layer',
                controller: 'EditRootLayerRestrictionsCtrl',
                controllerAs: 'vm',
                params:{
                    chosenItem: null,
                    itemRowIndex: null
                },
                resolve:{
                    EditTableStructure:function(editRootLayerRestrictionsService){
                        return editRootLayerRestrictionsService.getEditTableStructure()
                    },
                    EditTableData:function(editRootLayerService){
                        return editRootLayerService.get('categories');
                    }
                }
            })
        ;
    }

})();