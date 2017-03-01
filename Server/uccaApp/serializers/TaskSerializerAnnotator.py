# Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University.

from rest_framework.generics import get_object_or_404

from uccaApp.util.exceptions import SaveTaskTypeDeniedException, CantChangeSubmittedTaskExeption
from uccaApp.util.functions import get_value_or_none, active_obj_or_raise_exeption
from uccaApp.util.tokenizer import isPunct
from uccaApp.models import Annotation_Remote_Units_Annotation_Units
from uccaApp.models import Annotation_Units_Tokens
from uccaApp.models import Categories
from uccaApp.models import Tokens, Annotation_Units
from uccaApp.models.Annotation_Units_Categories import Annotation_Units_Categories
from uccaApp.models.Tasks import *
from rest_framework import serializers

from uccaApp.serializers.AnnotationUnitsSerializer import Annotation_UnitsSerializer
from uccaApp.serializers.TaskSerializer import TaskInChartSerializer
from uccaApp.serializers.PassageSerializer import PassageSerializer
from uccaApp.serializers.ProjectSerializerForAnnotator import ProjectSerializerForAnnotator
from uccaApp.serializers.TokenSerializer import TokensSerializer
from uccaApp.serializers.UsersSerializer import DjangoUserSerializer_Simplify
import operator

class TaskSerializerAnnotator(serializers.ModelSerializer):
    created_by = DjangoUserSerializer_Simplify(many=False, read_only=True)
    passage = PassageSerializer(many=False, read_only=True, allow_null=True)
    project = ProjectSerializerForAnnotator(many=False, read_only=True, allow_null=False)
    user = serializers.SerializerMethodField()
    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    tokens = serializers.SerializerMethodField()
    annotation_units = serializers.SerializerMethodField()


    def get_user(self,obj):
        return DjangoUserSerializer_Simplify(obj.annotator).data

    def get_parent(self,obj):
        if obj.parent_task is not None:
            return TaskInChartSerializer(obj.parent_task).data
        else:
            return None

    def get_children(self, obj):
        children_tasks = Tasks.objects.all().filter(parent_task_id=obj.id)
        children_json = []
        for cl in children_tasks:
            children_json.append(TaskInChartSerializer(cl).data)
        return children_json


    def get_tokens(self, obj):
        if (obj.type == Constants.TASK_TYPES_JSON['TOKENIZATION']):
            tokens = Tokens.objects.all().filter(task_id=obj.id)
        else:
            # get the tokens array from the root tokenization task
            root_tokeniztion_task_id = self.get_root_task(obj)
            tokens = Tokens.objects.all().filter(task_id=root_tokeniztion_task_id)

        tokens_json = []
        for t in tokens:
            tokens_json.append(TokensSerializer(t).data)
        return tokens_json

    def get_annotation_units(self, obj):
        # **********************************
        #           AS ARRAY
        # **********************************
        annotation_units = Annotation_Units.objects.all().filter(task_id=obj.id).order_by('id')

        # handle new refinement or extention layer taks - get the parent annotation units - start
        if( len(annotation_units) == 0  and obj.parent_task is not None): # TODO: check if coarsening task is ok with that
            # get the parent task annotation units
            obj = obj.parent_task
            annotation_units = Annotation_Units.objects.all().filter(task_id=obj.id).order_by('id')
        # handle new refinement or extention layer taks - get the parent annotation units - end

        annotation_units_json = []
        remote_annotation_unit_array = []
        for au in annotation_units:
            # set as default is_remote_copy = False
            au.is_remote_copy = False

            # check if i have a remote units
            remote_units = Annotation_Remote_Units_Annotation_Units.objects.all().filter(unit_id=au)
            for ru in remote_units:
                # retrieve its original unit
                remote_original_unit = Annotation_Units.objects.get(id = ru.remote_unit_id.id, task_id=obj.id)
                # set the remote is_remote_copy = true
                remote_original_unit.is_remote_copy = True
                # set the parent_id to be the remote's one
                remote_original_unit.parent_id = ru.unit_id
                # add the remote original unit to the json output
                annotation_units_json.append(Annotation_UnitsSerializer(remote_original_unit).data)

            annotation_units_json.append(Annotation_UnitsSerializer(au).data)
        # return all array sorted with all the remote units in the end
        return sorted(annotation_units_json, key=operator.itemgetter('is_remote_copy'), reverse=False)

        # **********************************
        #           AS ROOT OBJECT
        # **********************************
        # try:
        #     au = Annotation_Units.objects.get(task_id_id=obj.id, parent_id=None)
        # except Annotation_Units.DoesNotExist:
        #     au = None
        # return Annotation_UnitsSerializer(au).data



    def get_root_task(self,task_instance):
        root_task = task_instance
        while (root_task.parent_task != None ):
            root_task = root_task.parent_task
        return root_task.id


    class Meta:
        model = Tasks
        fields = (
            'id',
            'parent',
            'children',
            'type',
            'status',
            'project',
            'user',
            'passage',
            'tokens',
            'annotation_units',
            'is_demo',
            'manager_comment',
            'is_active',
            'created_by',
            'created_at',
            'updated_at'
        )


    def update(self, instance, validated_data):
        # disable saving a SUBMITTED task
        if instance.status == 'SUBMITTED':
            raise CantChangeSubmittedTaskExeption

        save_type = self.initial_data['save_type']
        if(save_type  == 'draft'):
            self.save_draft(instance)
        elif (save_type  == 'submit'):
            self.submit(instance)

        return instance




    def save_draft(self,instance):
        instance.status = 'ONGOING'
        print('save_draft')
        if(instance.type == Constants.TASK_TYPES_JSON['TOKENIZATION']):
            self.save_tokenization_task(instance)
        elif (instance.type == Constants.TASK_TYPES_JSON['ANNOTATION']):
            self.save_annotation_task(instance)
        elif (instance.type == Constants.TASK_TYPES_JSON['REVIEW']):
            self.save_review_task(instance)
        instance.save()


    def save_tokenization_task(self,instance):
        print('save_tokenization_task - start')
        self.check_if_parent_task_ok_or_exception(instance)
        instance.tokens_set.all().delete()
        for token in self.initial_data['tokens']:
            newToken = Tokens()
            newToken.task_id_id = instance
            newToken.text = token['text']
            newToken.require_annotation = ( not isPunct(newToken.text) )
            newToken.start_index = token['start_index']
            newToken.end_index = token['end_index']
            instance.tokens_set.add(newToken,bulk=False)
        print('save_tokenization_task - end')






    def save_annotation_task(self,instance):
        print('save_annotation_task - start')
        # mainly saving an annotations units array
        self.check_if_parent_task_ok_or_exception(instance)
        self.reset_current_task(instance)
        remote_units_array = []
        for au in self.initial_data['annotation_units']:
            annotation_unit = Annotation_Units()
            annotation_unit.annotation_unit_tree_id = au['annotation_unit_tree_id']
            annotation_unit.task_id = instance
            annotation_unit.type = au['type']
            annotation_unit.comment = au['comment']
            annotation_unit.is_remote_copy = au['is_remote_copy']

            parent_id = None
            if au['parent_id']:
                parent_id = get_object_or_404(Annotation_Units, annotation_unit_tree_id=au['parent_id'],task_id=instance.id)

            annotation_unit.parent_id = parent_id
            annotation_unit.gui_status = au['gui_status']

            if annotation_unit.is_remote_copy == True:
                annotation_unit.remote_categories = get_value_or_none('categories', au)
                remote_units_array.append(annotation_unit)
            else:
                instance.annotation_units_set.add(annotation_unit,bulk=False)
                self.save_children_tokens(annotation_unit, get_value_or_none('children_tokens', au))
                self.save_annotation_categories(annotation_unit, get_value_or_none('categories', au))

        for annotation_unit in remote_units_array:
            remote_unit = self.save_annotation_remote_unit(annotation_unit)
            self.save_remote_annotation_categories(remote_unit,annotation_unit.remote_categories)

        print('save_annotation_task - end')


    def save_remote_annotation_categories(self,remote_annotation_unit,categories):
        print('save_remote_annotation_categories - start')
        for cat in categories:
            unit_category = Annotation_Units_Categories()
            unit_category.unit_id = remote_annotation_unit.remote_unit_id
            unit_category.category_id = Categories.objects.get(id=cat['id'])
            unit_category.remote_parent_id = remote_annotation_unit.unit_id
            unit_category.save()
        print('save_remote_annotation_categories - end')

    def reset_current_task(self,task_instance):
        # TODO: validate the new array of annotation units before deleting the current one
        print('reset_current_task - start')
        # reset Annotation_Units_Tokens
        # reset Annotation_Units_Categories
        # reset Annotation_Remote_Units_Annotation_Units
        # reset annotaion_units
        task_instance.annotation_units_set.all().delete()
        print('reset_current_task - end')


    def save_annotation_remote_unit(self,annotation_unit):
        remote_unit = Annotation_Remote_Units_Annotation_Units()
        # remote_unit.unit_id means that it is the parent
        remote_unit.unit_id = annotation_unit.parent_id
        # remote_unit.remote_unit_id means that it is the remote unit
        remote_unit_id = get_object_or_404(Annotation_Units, annotation_unit_tree_id=annotation_unit.annotation_unit_tree_id, task_id=annotation_unit.task_id )
        remote_unit.remote_unit_id = remote_unit_id
        remote_unit.save()
        return remote_unit

    def save_children_tokens(self,annotation_unit,tokens):
        if tokens != None:
            print('save_children_tokens - start')
            for t in tokens:
                annotation_units_token = Annotation_Units_Tokens()
                annotation_units_token.unit_id = annotation_unit
                annotation_units_token.token_id = Tokens.objects.get(id=t['id'])
                annotation_units_token.save()
            print('save_children_tokens - end')



    def save_annotation_categories(self,annotation_unit,categories):
        print('save_annotation_categories - start')
        for cat in categories:
            unit_category = Annotation_Units_Categories()
            unit_category.unit_id = annotation_unit
            unit_category.category_id = Categories.objects.get(id=cat['id'])
            unit_category.remote_parent_id = None
            unit_category.save()
        print('save_annotation_categories - end')



    def save_review_task(self,instance):
        # TODO: CHECK IF OK !!!!
        print('save_review_task - start')
        self.save_annotation_task(instance)
        print('save_review_task - end')


    def submit(self,instance):
        instance.status = 'SUBMITTED'
        print('submit')
        instance.save()

    def check_if_parent_task_ok_or_exception(self,instance):
        if instance.type == Constants.TASK_TYPES_JSON['TOKENIZATION']:
            if instance.parent_task != None:
                raise SaveTaskTypeDeniedException
        elif instance.parent_task == None:
            raise SaveTaskTypeDeniedException

