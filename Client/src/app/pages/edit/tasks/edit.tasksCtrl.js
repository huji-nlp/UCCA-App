
(function () {
    'use strict';

    angular.module('zAdmin.pages.edit.tasks')
        .controller('EditTasksCtrl', EditTasksCtrl);

    /** @ngInject */
    function EditTasksCtrl($scope,$state, $timeout) {
        var vm = this;
        vm.upsert = upsert;
        vm.back = back;
        vm.choosePassage = choosePassage;
        vm.refreshData = refreshData;

        function upsert(obj){
            console.log("edit",obj);
            editTasksService.saveTaskDetails(obj).then(function(response){
                $state.go("tasks")
            },function(err){
                $state.go("tasks")
            })
        }

        function back(){
            $state.go('tasks');
        }

        function choosePassage(){
            $state.go('edit.tasks.passages.manage');
        }

        function refreshData(key){
            // set values from service
            vm.smartTableStructure.forEach(function(obj){
                key == obj.key ? obj.value = editTasksService.get(obj.key) : "";
            })

            $timeout(function(){
                $scope.$apply();
            })

            // $state.go('edit.layers');
        }
    }

})();
