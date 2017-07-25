/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.layers.extension.categories', [

    ])
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider) {
        $stateProvider
            .state('edit.layers.extension.categories', {
                url: '/categories',
                template: '<ui-view></ui-view>',
                title: 'Edit Extension Layers',
                abstract:true,
                controllerAs: 'vm',
                resolve:{
                    EditTableStructure:function(editExtensionLayerCategoriesService){
                        return editExtensionLayerCategoriesService.getEditTableStructure()
                    },
                    EditTableData:function(editExtensionLayerCategoriesService){
                        return editExtensionLayerCategoriesService.getTableData()
                    }
                }
            })
            .state('edit.layers.extension.categories.manage', {
                url: '/categories',
                templateUrl: 'app/pages/edit/layers/extension/categories/edit.layers.extension.categories.html',
                title: 'Edit Extension Layers',
                controller: 'EditExtensionLayerCategoriesCtrl',
                controllerAs: 'vm',
                resolve:{
                    EditTableStructure:function(editExtensionLayerCategoriesService){
                        return editExtensionLayerCategoriesService.getEditTableStructure()
                    }
                }
            })
            .state('edit.layers.extension.categories.create', {
                url: '/newctegories',
                templateUrl: 'app/pages/edit/layers/extension/categories/edit.layers.extension.categories.create.html',
                title: 'Edit Extension Layers',
                controller: 'EditCategoriesCtrl',
                controllerAs: 'vm',
                resolve:{
                    EditTableStructure:function(editCategoriesService){
                        return editCategoriesService.getEditTableStructure()
                    }
                }
            })
        ;
    }

})();