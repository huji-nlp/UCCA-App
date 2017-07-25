
/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.layers.coarsening')
        .service('editCoarseningLayerService', editCoarseningLayerService);

    /** @ngInject */
    function editCoarseningLayerService(apiService, Core, ENV_CONST) {
        /*apiService.sources.getSourceTableData().then(function (res){
         angular.copy(res.data.results, service.tableData);
         });*/
        var service = {
            Data:[],
            getEditTableStructure: function(){
                return apiService.edit.layers.coarsening.getEditLayerTableStructure().then(function (res){return res.data});
            },
            getLayerData: function(id){
                var _service = this;
                return apiService.edit.layers.coarsening.getLayerData(id).then(function (res){
                    _service.initData(res.data);
                    return res.data
                });
            },
            saveLayerDetails: function(smartTableStructure){
                var structure = prepareLayerCategoriesForSend(smartTableStructure);
                var bodyData = Core.extractDataFromStructure(structure);
                service.clearData();
                return !bodyData.id ? apiService.edit.layers.coarsening.postLayerData(bodyData).then(function (res){return res.data}) :  apiService.edit.layers.coarsening.putLayerData(bodyData).then(function (res){return res.data});
            },
            initData:function(data){
                var categories = prepareCoarsningCategories(data.categories);
                if(categories.length){
                    data.categories = categories;
                }
                service.Data = data;
            },
            get:function(key){
                return this.Data[key];
            },
            getInnerSmartTableStructure: function(key){
                return this.Data[key].tableStructure;
            },
            set:function(key,obj,indexToInsert){
                if(angular.isArray(this.Data[key])){
                    indexToInsert == null ? this.Data[key].push(obj) : this.Data[key][indexToInsert] = obj;
                    
                }else{                    
                    this.Data[key][0] = obj;
                }
            },
            initStructureForCoarseningLayer: function(){
                var _service = this;
                return apiService.edit.layers.getCoarseningLayerTableStructure().then(function (res){
                    return res.data
                });
            },
            initDataForCoarseningLayer: function(){
                var _service = this;
                var initialData = _service.Data;
                _service.clearData();
                _service.Data.type = ENV_CONST.LAYER_TYPE.COARSENING;
                _service.Data.parent = initialData;
            },
            deleteItemInData: function(key,index){
                service.Data[key].splice(index,1);
            },
            clearData: function(){
                service.Data = {
                    "name": "",
                    "description": "",
                    "id": "",
                    "parent": false,
                    "children": [],
                    "type": ENV_CONST.LAYER_TYPE.COARSENING,
                    "tooltip": "",
                    "projects": [  ],
                    "categories": [],
                    "restrictions": [],
                    "created_by": {
                        "first_name":"",
                        "last_name":"",
                        "name":""
                    },
                    "is_active": true,
                    "created_at": "",
                    "updated_at": ""
                };
            }
        };
        return service;
    }

    /*
    * transform the categories array to group by childCategory
    */
    function prepareCoarsningCategories(categories){
        if(!categories){
            return categories;
        }else{
            var response = [];
            var childCategories = {};
            var pairs = {};

            categories.forEach(function(cat){
                childCategories[cat.id] = cat;
            });

            Object.keys(childCategories).forEach(function(parentId){
                pairs[parentId] = {
                    'parent_category': [],
                    'category': [childCategories[parentId]]
                }
            });

            categories.forEach(function(cat){
                if(cat.parent){
                    pairs[cat.id].parent_category.push(cat.parent)
                }
            });
            
            Object.keys(pairs).forEach(function(parentId){
                response.push(pairs[parentId])
            });
            
            return response;
        }
    }

    function prepareLayerCategoriesForSend(smartTableStructure){
        var structure = angular.copy(smartTableStructure, structure)
        structure.forEach(function(rowObj){
            if(rowObj.key == 'categories'){
                console.log(rowObj);
                var parsedCategories = [];
                rowObj.value.forEach(function(valueObj){
                    valueObj.parent_category.forEach(function(parentCategoryObj){
                        var category = {
                            id: valueObj.category[0].id,
                            name: valueObj.category[0].name,
                            parent: {
                                id: parentCategoryObj.id,
                                name: parentCategoryObj.name
                            }
                        }
                        parsedCategories.push(category)
                    })
                })
                rowObj.value = parsedCategories;
            }
        });
        return structure;
    }


})();
