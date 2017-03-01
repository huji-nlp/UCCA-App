# Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University.

from rest_framework import serializers
from uccaApp.models.Layers_Categories_Restrictions import Layers_Categories_Restrictions


class LayersCategoriesResrictionsSerializer(serializers.ModelSerializer):
  type = serializers.SerializerMethodField('resriction_type_referance')

  def resriction_type_referance(self, obj):
    return obj.resriction_type

  categories_1 = serializers.SerializerMethodField('category_ids1_referance')


  def category_ids1_referance(self, obj):
    return obj.category_ids1

  categories_2 = serializers.SerializerMethodField('category_ids2_referance')

  def category_ids2_referance(self, obj):
    return obj.category_ids2


  class Meta:
    model = Layers_Categories_Restrictions
    fields = ('type','categories_1','categories_2')

  def create(self, validated_data):
    return Layers_Categories_Restrictions.objects.create(**validated_data)


# layer_id = models.ForeignKey(Layers, related_name="resriction_layer_id", db_column="layer_id", on_delete=models.PROTECT)


