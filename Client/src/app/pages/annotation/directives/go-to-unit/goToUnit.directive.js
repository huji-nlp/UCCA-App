(function() {
    'use strict';

    angular
        .module('zAdmin.annotation.directives')
        .directive('goToUnit',goToUnitDirective);

    function goToUnitDirective($rootScope,DataService,AnnotationTextService) {
        return {
            restrict: 'A',
            scope: true,
            bindToController: true,
            link: function ($scope, elem) {

                $(elem).click(function(){

                    // highlight the unit, and make its parent row focused

                    var unitId = $(this).attr('unit-wrapper-id');
                    var splittedUnitID = unitId.split('-');

                    var parentContainerId = $(event.toElement).attr('parent-index');

                    var parentContainer = $(this.parentElement.parentElement.parentElement).addClass('selected-row');
                    // $('.highlight-unit').removeClass('highlight-unit');
                    // $("[unit-wrapper-id="+unitId+"]").toggleClass('highlight-unit');

                    event.stopPropagation();

                    DataService.unitType == 'REGULAR' ? $rootScope.clickedUnit = unitId : '';

                    focusUnit(parentContainer,$rootScope,DataService);
                })
                $(elem).dblclick(function(){
                    $('.highlight-unit').removeClass('highlight-unit');
                    var childUnitId = $(this).attr('child-unit-id');
                    var parentContainerId = $(event.toElement).attr('parent-index');
                    // $('.selected-row').removeClass('selected-row');

                    var parentContainer = $('#directive-info-data-container-'+childUnitId).addClass('selected-row');
                    // var childUnitId = splittedUnitID.slice(3,splittedUnitID.length).join('-');
                    var annotationUnit = $('#directive-info-data-container-'+childUnitId).parents('.categorized-word')

                    var expandBtn = annotationUnit[1] ? $(annotationUnit[1]).find('.expand-btn') : $(annotationUnit[0]).find('.expand-btn');
                    // annotationUnit.removeClass('hidden');
                    $scope.$apply(function(){
                        DataService.getUnitById(childUnitId).gui_status = 'OPEN';
                        AnnotationTextService.toggleAnnotationUnitView(expandBtn[0]);
                    })

                    event.stopPropagation();

                    focusUnit(parentContainer,$rootScope,DataService);

                    DataService.lastInsertedUnitIndex = $rootScope.clckedLine;
                });
            }
        };
    }

    /**
     * Handle click on row - update the current selected row.
     */
    function focusUnit(element,rootScope,DataService){

        var dataWordId = $(element).attr('data-wordid');
        if(dataWordId == undefined){
            var clickedRowId = [];
            if(element.toElement){
                clickedRowId = $(element.toElement).attr('id').split('-');
            }
            else{
                clickedRowId = $(element).attr('id').split('-');
            }
            rootScope.clckedLine = clickedRowId.slice(4,clickedRowId.length).join('-');
            /*$rootScope.clckedLine = clickedRowId[clickedRowId.length-1];*/
        }else{
            var clickedRowId = $(element.toElement).attr('parent-index').split('-');
            clickedRowId.length == 1 ? rootScope.clckedLine = clickedRowId[0] : rootScope.clckedLine = clickedRowId.slice(1,clickedRowId.length).join('-');
            /*rootScope.clckedLine = clickedRowId[clickedRowId.length-1];*/
        }
        $('.selected-row').removeClass('selected-row').delay(500);
        if(element.toElement){
            $(element.toElement).addClass('selected-row').delay(500);
        }else{
            $(element).addClass('selected-row').delay(500);
        }    

        // $('.selectable-word').removeClass('clickedToken');
        // rootScope.selectedTokensArray = [];    
    }



})();