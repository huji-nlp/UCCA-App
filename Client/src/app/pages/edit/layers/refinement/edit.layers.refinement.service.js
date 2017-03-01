
(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.layers.refinement')
        .service('editRefinementLayerService', editRefinementLayerService);

    /** @ngInject */
    function editRefinementLayerService(apiService, Core, ENV_CONST) {
        /*apiService.sources.getSourceTableData().then(function (res){
         angular.copy(res.data.results, service.tableData);
         });*/
        var service = {
            Data:[],
            getEditTableStructure: function(){
                return apiService.edit.layers.refinement.getEditLayerTableStructure().then(function (res){return res.data});
            },
            getLayerData: function(id){
                var _service = this;
                return apiService.edit.layers.refinement.getLayerData(id).then(function (res){
                    _service.initData(res.data);
                    return res.data
                });
            },
            saveLayerDetails: function(smartTableStructure){
                prepareLayerCategoriesForSend(smartTableStructure);
                var bodyData = Core.extractDataFromStructure(smartTableStructure);
                service.clearData();
                return !bodyData.id ? apiService.edit.layers.refinement.postLayerData(bodyData).then(function (res){return res.data}) :  apiService.edit.layers.refinement.putLayerData(bodyData).then(function (res){return res.data});
            },
            initData:function(data){
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
            initDataForRefinementLayer: function(){
                var _service = this;
                var initialData = _service.Data;
                _service.clearData();
                _service.Data.type = "Refinement";
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
                    "type": ENV_CONST.LAYER_TYPE.REFINEMENT,
                    "tooltip": "",
                    "projects": [  ],
                    "categories": [],
                    "restrictions": [],
                    "created_by": {
                        "first_name":"",
                        "last_name":"",
                        "name":""
                    },
                    "is_active": false,
                    "created_at": "",
                    "updated_at": ""
                };
            }
        };
        return service;
    }

    function prepareLayerCategoriesForSend(smartTableStructure){
        smartTableStructure.forEach(function(rowObj){
            if(rowObj.key == 'categories'){
                console.log(rowObj);
                var parsedCategories = [];
                rowObj.value.forEach(function(valueObj){
                    valueObj.category.forEach(function(categoryObj){
                        var category = {
                            id: categoryObj.id,
                            name: categoryObj.name,
                            parent: {
                                id: valueObj.parent_category[0].id,
                                name: valueObj.parent_category[0].name
                            }
                        }
                        parsedCategories.push(category)
                    })
                })
                rowObj.value = parsedCategories;
            }
        });
    }

})();
