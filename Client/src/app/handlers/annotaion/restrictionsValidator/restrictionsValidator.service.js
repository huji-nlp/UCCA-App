

/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
    'use strict';

    angular.module('zAdmin.restrictionsValidator',[
        'zAdmin.const'
    ])
        .service('restrictionsValidatorService', restrictionsValidatorService);

    /** @ngInject */
    function restrictionsValidatorService($timeout,$rootScope,$location,ENV_CONST,$uibModal,Core) {
        /*
            %NAME%, %NAME_1%, %NAME_2%
            will change to the category name in the alert modal
        */
        var errorMasseges ={
            FORBID_ANY_CHILD : 'Category %NAME% cannot have any child.',
            FORBID_CHILD : 'Category %NAME_1% cannot have child with category %NAME_2%.',
            FORBID_SIBLING: 'Category %NAME_1% cannot have sibling with category %NAME_2%.',
            REQUIRE_SIBLING: 'Category %NAME_1% fails on a require_sibling constraint.',
            REQUIRE_CHILD: 'Category %NAME_1% fails on a require_child constraint.',
            UNIT_CONTAIN_ONLY_PUNCTUATIONS : 'You cannot create annotation unit only from punctuation tokens',
            NOT_COMPLETE : "All non-punctuation tokens must either be in a unit of their own or in an unanalyzable unit."
        };
        var restrictionsTables;
        var handler = {
          initRestrictionsTables: initRestrictionsTables,
          checkRestrictionsBeforeInsert: checkRestrictionsBeforeInsert,
          checkRestrictionsOnFinish: checkRestrictionsOnFinish,
          evaluateFinishAll: evaluateFinishAll
        };
        return handler;

        function initRestrictionsTableObject(){
            restrictionsTables = {
                FORBID_ANY_CHILD: {},
                FORBID_CHILD:{},
                FORBID_SIBLING:{},
                REQUIRE_CHILD: {},
                REQUIRE_SIBLING:{}
            };
        }

        function initRestrictionsTables(layer_restrictions){
            initRestrictionsTableObject();
            // console.log(layer_restrictions);
            layer_restrictions.forEach(function(restriction){
                addRestrictionToTable(restriction);
            });
            // console.log(restrictionsTables);

        }

        function addRestrictionToTable(restriction){
            var categories_1 = restriction.categories_1[0].id ? restriction.categories_1 : JSON.parse(restriction.categories_1.replace(/'/g,'"'));
            var categories_2 = restriction.categories_2[0] ? restriction.categories_2[0].id ? restriction.categories_2 : JSON.parse(restriction.categories_2.replace(/'/g,'"')) : [];
            switch(restriction.type){
                case 'FORBID_ANY_CHILD':
                    categories_1.forEach(function(category_1){
                        restrictionsTables.FORBID_ANY_CHILD[category_1.id] = 'All'
                    });
                    break;
                default:
                    categories_1.forEach(function(category_1){
                        restrictionsTables[restriction.type][category_1.id] = {};
                        categories_2.forEach(function(category_2){
                            restrictionsTables[restriction.type][category_1.id][category_2.id] = category_2.name;
                        });
                    });
                    break;
            }
        }

        function checkRestrictionsBeforeInsert(parentAnnotationUnit, newAnnotationUnit,tokensHashTable,newCategory){
            newAnnotationUnit.children_tokens = newAnnotationUnit.tokens;
            var result = newAnnotationUnit.unitType != "IMPLICIT" && doesUnitContainsOnlyPunctuation(newAnnotationUnit,tokensHashTable);
            if(result){
                var msg = errorMasseges['UNIT_CONTAIN_ONLY_PUNCTUATIONS'];
                showErrorModal(msg);
                return false;
            }
            result = checkIfUnitViolateForbidAnyChildRestriction(parentAnnotationUnit);
            if(result){
                var replacements  = {"%NAME%":result.name};
                var msg = errorMasseges['FORBID_ANY_CHILD'].replace(/%\w+%/g, function(all) {
                    return replacements[all] || all;
                });
                showErrorModal(msg);
                return false;
            }
            result = checkIfUnitViolateForbidChildRestriction(parentAnnotationUnit,newAnnotationUnit);
            if(result){
                var replacements  = {"%NAME_1%":result[0].name, "%NAME_2%":result[1].name};
                var msg = errorMasseges['FORBID_CHILD'].replace(/%\w+%/g, function(all) {
                    return replacements[all] || all;
                });
                showErrorModal(msg);
                return false;
            }
            result = checkIfUnitViolateForbidSiblingRestriction(parentAnnotationUnit,newAnnotationUnit,newCategory);
            if(result){
                var replacements  = {"%NAME_1%":result[0].name, "%NAME_2%":result[1].name};
                var msg = errorMasseges['FORBID_SIBLING'].replace(/%\w+%/g, function(all) {
                    return replacements[all] || all;
                });
                showErrorModal(msg);
                return false;
            }
            return true;
        }

        function doesUnitContainsOnlyPunctuation(newAnnotationUnit,tokensHashTable){
            var isOnlyPunc = true;
            newAnnotationUnit.children_tokens.forEach(function(token){
                var currentToken = tokensHashTable[token.id];
                if(currentToken.require_annotation == true){
                    isOnlyPunc = false;
                }
            })
            return isOnlyPunc;
        }

        function checkIfUnitViolateForbidAnyChildRestriction(parentAnnotationUnit){
            if(parentAnnotationUnit.annotation_unit_tree_id != "0"){
                //Go through all of the parent annotation unit categories and check if they exists in the FORBID_ANY_CHILD restrictions table.
                for(var i=0; i< parentAnnotationUnit.categories.length; i++){
                    var currentCategory = parentAnnotationUnit.categories[i];
                    if(currentCategory && restrictionsTables['FORBID_ANY_CHILD'][currentCategory.id]){
                        return currentCategory;
                    }
                }
                return false;
            }
            return false;
        }

        function checkIfUnitViolateForbidChildRestriction(parentAnnotationUnit,newAnnotationUnit){
            if(parentAnnotationUnit.annotation_unit_tree_id != "0"){
                //Go through all of the parent annotation unit categories and check if they exists in the FORBID_CHILD restrictions table.
                for(var i=0; i< parentAnnotationUnit.categories.length; i++){
                    var currentCategory = parentAnnotationUnit.categories[i];
                    if(currentCategory && restrictionsTables['FORBID_CHILD'][currentCategory.id]){
                        for(var j=0; j< newAnnotationUnit.categories.length; j++){
                            var newAnnotationCurrentCategory = newAnnotationUnit.categories[j];
                            if(currentCategory && newAnnotationCurrentCategory && restrictionsTables['FORBID_CHILD'][currentCategory.id] && restrictionsTables['FORBID_CHILD'][currentCategory.id][newAnnotationCurrentCategory.id]){
                                return [currentCategory,newAnnotationCurrentCategory];
                            }
                        }
                    }
                }
                return false;
            }
            return false;
        }

        function checkIfUnitViolateForbidSiblingRestriction(parentAnnotationUnit,newAnnotationUnit,newCategory){
            for(var i=0; i< parentAnnotationUnit.AnnotationUnits.length; i++){

                if(parentAnnotationUnit.AnnotationUnits[i] == undefined){
                  continue
                }

                var currentAnnotationUnitSibling = parentAnnotationUnit.AnnotationUnits[i];

                var updatetedCurrentCategory = angular.copy(currentAnnotationUnitSibling.categories);

                if(newCategory && currentAnnotationUnitSibling.annotation_unit_tree_id === newAnnotationUnit.annotation_unit_tree_id){
                    updatetedCurrentCategory = updatetedCurrentCategory.concat([newCategory]);
                }

                for(var j=0; j< updatetedCurrentCategory.length; j++){

                    var currentCategory = updatetedCurrentCategory[j];

                    var updatetedNewCurrentCategory = angular.copy(newAnnotationUnit.categories);

                    if(newCategory && currentAnnotationUnitSibling.annotation_unit_tree_id === newAnnotationUnit.annotation_unit_tree_id){
                        updatetedNewCurrentCategory = updatetedNewCurrentCategory.concat([newCategory]);
                    }

                    for(var k=0; k< updatetedNewCurrentCategory.length; k++){
                        var newAnnotationUnitCategory = updatetedNewCurrentCategory[k];
                        if(currentCategory && newAnnotationUnitCategory && restrictionsTables['FORBID_SIBLING'][newAnnotationUnitCategory.id] && restrictionsTables['FORBID_SIBLING'][newAnnotationUnitCategory.id][currentCategory.id]){
                            return [currentCategory,newAnnotationUnitCategory];
                        } else if(currentCategory && restrictionsTables['FORBID_SIBLING'][currentCategory.id] && restrictionsTables['FORBID_SIBLING'][currentCategory.id][newAnnotationUnitCategory.id]){
                            return [currentCategory,newAnnotationUnitCategory];
                        }
                    }

                }
            }
            return false;
        }

        var VIOLATED_CATEGORY = {}
        function checkRestrictionsOnFinish(annotationUnit,parentUnit,hashTables){
            VIOLATED_CATEGORY = {}
            var vaiolate = false;
            var categories_hash = hashTables.categoriesHashTable;

            var violateUnitsCategoriesAmount = false; //changed by Omri Abend 24.7 because restriction is not working properly //checkIfAllUnitsHaveAtLeastOneCategory(annotationUnit,categories_hash);
            // console.log("violateUnitsCategoriesAmount",violateUnitsCategoriesAmount);

            if(!violateUnitsCategoriesAmount){
                var vaiolateForbidSibling = checkIfForbidSiblingHandler(annotationUnit,parentUnit);
                // console.log('vaiolateForbidSibling',vaiolateForbidSibling);
                if(!vaiolateForbidSibling){
                    var vaiolateForbidChild = checkIfForbidChildHandler(annotationUnit);
                    // console.log('vaiolateForbidChild',vaiolateForbidChild);
                    if(!vaiolateForbidChild){
                        var vaiolateRequireSibling  = checkIfUnitViolateRequireSiblingAndAlert(annotationUnit,parentUnit,true)
                        // console.log('vaiolateRequireSibling',vaiolateRequireSibling);
                        if(!vaiolateRequireSibling){
                            var violateRequireChild = checkIfUnitViolateRequireChildRestrictionAndAlert(annotationUnit);
                            // console.log('violateRequireChild',violateRequireChild);
                            if(!violateRequireChild){
                                var voilateEachTokenInUnit = checkIfVoilateEachTokenInUnit(annotationUnit);
                                if(voilateEachTokenInUnit){
                                    vaiolate = true
                                }
                            }else{
                                vaiolate = true;
                            }
                        }else{
                            vaiolate = true;
                        }
                    }else{
                        vaiolate = true;
                    }
                }else{
                    vaiolate = true;
                }
            }else{
                vaiolate = true;
            }


            if(!vaiolate){
               annotationUnit.gui_status = 'HIDDEN'
            }

            return !vaiolate;
        }



        function checkIfForbidChildHandler(annotationUnit){
            var isVaioled =  false
            for(var i=0; i<annotationUnit.AnnotationUnits.length; i++){
                var currentChild = annotationUnit.AnnotationUnits[i];
                var result = checkIfUnitViolateForbidChildRestriction(annotationUnit,currentChild);
                restrictionResultHandleForForbidChild(result,annotationUnit);

                if(result){
                    return isVaioled = true
                }

            }
            return isVaioled
        }

        function checkIfForbidSiblingHandler(annotationUnit,parentUnit){
            var isVaioled =  false
            for(var i=0; i<parentUnit.AnnotationUnits.length; i++){
                var currentChild = parentUnit.AnnotationUnits[i];
                var result = checkIfUnitViolateForbidSiblingRestriction(parentUnit,currentChild);
                restrictionResultHandleForForbidSibling(result,annotationUnit);

                if(result){
                    return isVaioled = true
                }

            }
            return isVaioled
        }

        function checkIfVoilateEachTokenInUnit(annotationUnit){
            var isViolated = false;
            var sumOfNonPuctuationTokens = annotationUnit.tokens.filter(function(token) {
                return token.require_annotation === false ;
            });

            if(annotationUnit.tokens.length - sumOfNonPuctuationTokens.length === 1){
                //The unit contains only one require_annotation token
                return false;
            }else{
                if(!Core.isEmptyObject(restrictionsTables["FORBID_ANY_CHILD"]) && oneOfTheUnitCategoriesHasForbidAnyChildRestriction(annotationUnit.categories)) {
                    //Unit has forbid_any_child restriction
                    return false;
                }else{
                    for (var i = 0; i < annotationUnit.tokens.length; i++) {
                        var unitToken = annotationUnit.tokens[i];
                        if(unitToken.require_annotation){
                            var tokenInUnit = unitToken.inUnit;
                            if(tokenInUnit === null){
                                // isViolated = true;
                                console.log(unitToken);
                                console.log(annotationUnit);
                                showErrorModal(errorMasseges['NOT_COMPLETE']);
                                return true;
                            }else{
                                var elementPos = annotationUnit.AnnotationUnits.map(function(x) {return x.annotation_unit_tree_id; }).indexOf(tokenInUnit);
                                if(elementPos > -1){
                                    var result = checkIfVoilateEachTokenInUnit(annotationUnit.AnnotationUnits[elementPos]);
                                    if(result){
                                        return true;
                                    }
                                }

                            }
                        }
                    };
                    return false;
                }
            }
        }

        function oneOfTheUnitCategoriesHasForbidAnyChildRestriction(categories){
            var result = false;
            for (var i = 0; i < categories.length; i++) {
                if(restrictionsTables["FORBID_ANY_CHILD"][categories[i].id]){
                    result = true;
                    break;
                }
            };
            return result;
        }

        function checkIfVoilateEachTokenInUnitRestriction(annotationUnit){

        }

        function checkIfUnitViolateRequireSiblingAndAlert(annotationUnit,parentUnit,isCallingUnit){

            var result = checkIfUnitViolateRequireSiblingRestriction(annotationUnit,parentUnit);

            if (result) {
                if (isCallingUnit) {
                    restrictionResultHandler(result,annotationUnit,'REQUIRE_SIBLING');
                }
                return result;
            }

            for (var i = 0; i < annotationUnit.AnnotationUnits.length; i++) {
                var result = checkIfUnitViolateRequireSiblingAndAlert(annotationUnit.AnnotationUnits[i],annotationUnit,false);
                if (result) {
                   if (isCallingUnit) {
                        restrictionResultHandler(result,annotationUnit,'REQUIRE_SIBLING');
                   }
                   return result;
                }
            };

            return false;
        }

        function checkIfUnitViolateRequireSiblingRestriction(annotationUnit,parentUnit){
            var result = false;
            for(var i=0; i< annotationUnit.categories.length; i++){
                // Go over all the unit categories,
                // and look if there is any category that exists in the restrictionsTables['REQUIRE_SIBLING'];
                var currentCategory = annotationUnit.categories[i];
                if(restrictionsTables['REQUIRE_SIBLING'][currentCategory.id]){
                    // Prepare hash table that will hold the final result.
                    // whether we found all the required categories.
                    var categoriesIdToLookForFoundNotFoundTable = createCategoriesIdToLookForFoundNotFoundTable({
                        parentCategory: currentCategory,
                        childCategory:restrictionsTables['REQUIRE_SIBLING'][currentCategory.id]
                    });

                    //Go over all the unit siblings and look for the required categories.
                    console.log('REQUIRE_SIBLING annotationUnit',parentUnit);
                    for(var j=0; j<parentUnit.AnnotationUnits.length; j++){
                        var currentAnnotationUnitSibling = parentUnit.AnnotationUnits[j];

                        if(currentAnnotationUnitSibling.annotation_unit_tree_id == annotationUnit.annotation_unit_tree_id){
                            continue
                        }

                        //Go over all the current siblings categories.
                        for(var k=0; k<currentAnnotationUnitSibling.categories.length; k++){
                            var currentAnnotationUnitSiblingCategory = currentAnnotationUnitSibling.categories[k];

                            if(categoriesIdToLookForFoundNotFoundTable.hasOwnProperty(currentAnnotationUnitSiblingCategory.id)){
                                categoriesIdToLookForFoundNotFoundTable[currentAnnotationUnitSiblingCategory.id].isFound = true;
                            }
                        }
                    }
                }
            }

            result = checkIfAtLeastOneRequiredCategoriesWasFound(categoriesIdToLookForFoundNotFoundTable);
            if(result != false){
                console.log("annotationUnit " + annotationUnit.annotation_unit_tree_id + " is not valid");
                return result;
            }else{
                console.log("annotationUnit " + annotationUnit.annotation_unit_tree_id + " is valid");
                return result;
            }
        }

        function checkIfUnitViolateRequireChildRestrictionAndAlert(annotationUnit){
            var result = checkIfUnitViolateRequireChildRestrictionDeep(annotationUnit);
            restrictionResultHandler(result,annotationUnit,'REQUIRE_CHILD')
            return result;
        }
        function checkIfUnitViolateRequireChildRestrictionDeep(annotationUnit){
            for(var i=0; i<annotationUnit.AnnotationUnits.length; i++){
                checkIfUnitViolateRequireChildRestrictionDeep(annotationUnit.AnnotationUnits[i]);
            }
            if(!!VIOLATED_CATEGORY && !!VIOLATED_CATEGORY.unFoundCategory && VIOLATED_CATEGORY.unFoundCategory.isFound==false){
                return VIOLATED_CATEGORY;
            }
            VIOLATED_CATEGORY = checkIfUnitViolateRequireChildRestriction(annotationUnit);
            console.log('VIOLATED_CATEGORY',VIOLATED_CATEGORY);
            return VIOLATED_CATEGORY
        }

        function restrictionResultHandler(result,annotationUnit,restrictionType){
            if(result){
                var replacements  = {"%NAME_1%": result.parentCategory.name, "%NAME_2%": result.unFoundCategory.name};
                var msg = errorMasseges[restrictionType].replace(/%\w+%/g, function(all) {
                    return replacements[all] || all;
                });
                showErrorModal(msg);
                return false;
            }
            else {
                // annotationUnit.gui_status = 'HIDDEN';
                return true;
            }
        }

        function restrictionResultHandleForForbidChild(result,annotationUnit){
            if(result){
                var replacements  = {"%NAME_1%":result[0].name, "%NAME_2%":result[1].name};
                var msg = errorMasseges['FORBID_CHILD'].replace(/%\w+%/g, function(all) {
                    return replacements[all] || all;
                });
                showErrorModal(msg);
                return false;
            }
        }

        function restrictionResultHandleForForbidSibling(result,annotationUnit){
            if(result){
                var replacements  = {"%NAME_1%":result[0].name, "%NAME_2%":result[1].name};
                var msg = errorMasseges['FORBID_SIBLING'].replace(/%\w+%/g, function(all) {
                    return replacements[all] || all;
                });
                showErrorModal(msg);
                return false;
            }
        }

        function checkIfUnitViolateRequireChildRestriction(annotationUnit){
            var result = false;
            for(var i=0; i< annotationUnit.categories.length; i++){
                // Go over all the unit categories, and look if there is any category that exists in the restrictionsTables['REQUIRE_CHILD'];
                var currentCategory = annotationUnit.categories[i];
                if(restrictionsTables['REQUIRE_CHILD'][currentCategory.id]){
                    // Prepare hash table that will hold the final result. whether we found all the required categories.
                    var categoriesIdToLookForFoundNotFoundTable = createCategoriesIdToLookForFoundNotFoundTable({
                        parentCategory: currentCategory,
                        childCategory:restrictionsTables['REQUIRE_CHILD'][currentCategory.id]
                    });

                    // Go over all the unit children and look for the required categories.
                    for(var j=0; j<annotationUnit.AnnotationUnits.length; j++){
                        var currentAnnotationUnitChild = annotationUnit.AnnotationUnits[j];

                        // Go over all the current child categories.
                        for(var k=0; k<currentAnnotationUnitChild.categories.length; k++){
                            var currentAnnotationUnitChildCategory = currentAnnotationUnitChild.categories[k];

                            if(categoriesIdToLookForFoundNotFoundTable.hasOwnProperty(currentAnnotationUnitChildCategory.id)){
                                categoriesIdToLookForFoundNotFoundTable[currentAnnotationUnitChildCategory.id].isFound = true;
                            }
                        }
                    }
                }
            }

            result = checkIfAtLeastOneRequiredCategoriesWasFound(categoriesIdToLookForFoundNotFoundTable);
            if(result != false){
                console.log("annotationUnit " + annotationUnit.annotation_unit_tree_id + " is not valid");
                return result;
            }else{
                console.log("annotationUnit " + annotationUnit.annotation_unit_tree_id + " is valid");
                return result;
            }

        }

        function createCategoriesIdToLookForFoundNotFoundTable(requiredCategoriesObject){
            var table = {};
            for(var key in requiredCategoriesObject.childCategory){
                table[key] = {
                    isFound :false,
                    name: requiredCategoriesObject.childCategory[key],
                    parentCategory : requiredCategoriesObject.parentCategory
                }
            }
            return table;
        }

        function checkIfAtLeastOneRequiredCategoriesWasFound(requiredCategoriesTable){
            var result = false;
            for(var key in requiredCategoriesTable){
                if(!requiredCategoriesTable[key].isFound){
                    result = {
                        unFoundCategory :requiredCategoriesTable[key],
                        parentCategory : requiredCategoriesTable[key].parentCategory
                    }
                }else{
                    return false;
                }
            }
            return result;
        }

        var NOT_ALL_TOKENS_IN_UNIT_ERROR = false;
        function evaluateFinishAll(mainPassage,fromSubmit,hashTables){
            var evaluationResult = true;

            if(fromSubmit){
                var hash_tokens = hashTables.tokensHashTable;
                // Commented out by Omri Abend, 24/7 because it is not working properly
                //checkIfAllTokenThatRequireAnnotationIsInUnit(mainPassage,hash_tokens,true);
                //if(NOT_ALL_TOKENS_IN_UNIT_ERROR){
                //    evaluationResult = false;
                //}
                NOT_ALL_TOKENS_IN_UNIT_ERROR = false;
            }

            if(!evaluationResult){
                showErrorModal("Not all non-punctuation tokens are in units.")
                return false
            }else{
                for(var i=0; i<mainPassage.AnnotationUnits.length; i++){
                    evaluationResult = checkRestrictionsOnFinish(mainPassage.AnnotationUnits[i],mainPassage,hashTables);
                    if(!evaluationResult){
                        return false
                    }
                }
                return true;
            }

        }

        function isForbidAnyChild(unit){
            if(unit.annotation_unit_tree_id != "0"){
                //Go through all of the parent annotation unit categories and check if they exists in the FORBID_ANY_CHILD restrictions table.
                for(var i=0; i< unit.categories.length; i++){
                    var currentCategory = unit.categories[i];
                    if(restrictionsTables['FORBID_ANY_CHILD'][currentCategory.id]){
                        return true;
                    }
                }
                return false;
            }
        }

        function checkIfAllTokenThatRequireAnnotationIsInUnit(rootUnit,hash_tokens,checkIfOk){
            var rootUnit = rootUnit;
            if(NOT_ALL_TOKENS_IN_UNIT_ERROR){
                return checkIfOk = false
            }
            Object.keys(rootUnit.children_tokens_hash).some(function(tokenId){
                var token = hash_tokens[tokenId];
                // if there is only one token and its non pangtuation
                if(rootUnit.annotation_unit_tree_id == "0"){
                    rootUnit.children_tokens = rootUnit.children_tokens_hash;
                }
                if(token.require_annotation && Object.keys(rootUnit.children_tokens).length > 1){

                    if(token.inUnit === null){
                        checkIfOk = false;
                        NOT_ALL_TOKENS_IN_UNIT_ERROR = true;
                        console.log("REQUIRE_ANNOTATION",token);
                        return true; // its only break from the some loop
                    }
                    // check if the current rootUnit has category that forbid_any_child
                    // if(isForbidAnyChild(rootUnit) == false){
                    //     checkIfOk = false;
                    //     NOT_ALL_TOKENS_IN_UNIT_ERROR = true;
                    //     // console.log("REQUIRE_ANNOTATION",token);
                    //     return true; // its only break from the some loop
                    // }
                }
            })

            rootUnit.AnnotationUnits.forEach(function(unit){
                if(NOT_ALL_TOKENS_IN_UNIT_ERROR){
                    return checkIfOk = false
                }
                return checkIfAllTokenThatRequireAnnotationIsInUnit(unit,hash_tokens,checkIfOk)
            });
            return checkIfOk;
        }

        function checkAtLeastOneCategoryRecursion(parentUnit,categories_hash){
            // console.log(parentUnit.annotation_unit_tree_id);
            if(parentUnit.categories == undefined){
                return false;
            }else if(!parentUnit.categories.length){
                return false;
            }else{

                // check if at least one category is not default
                var atLeastOnNotDefault = false;

                parentUnit.categories.some(function(currentCategory){
                    return atLeastOnNotDefault = (categories_hash[currentCategory.id] && categories_hash[currentCategory.id].was_default === false)
                })

                if(atLeastOnNotDefault){

                    var foundErrorResult = parentUnit.AnnotationUnits.some(function(unit){
                        if(checkAtLeastOneCategoryRecursion(unit,categories_hash) === false){
                            return true
                        }
                    })

                    return !foundErrorResult;

                }else{
                    return atLeastOnNotDefault; // = false
                }
            }
        }

        function checkIfAllUnitsHaveAtLeastOneCategory(parentUnit,categories_hash){
            var allOk = checkAtLeastOneCategoryRecursion(parentUnit,categories_hash);
            if(!allOk){
                showErrorModal("All units must have at least one non-default category");
            }
            return !allOk;
        }

        function showErrorModal(message){
            $uibModal.open({
                animation: true,
                templateUrl: 'app/pages/annotation/templates/errorModal.html',
                size: 'md',
                controller: function($scope){
                    $scope.message = message;
                }
            });
        }
    }

})();
