import rest_framework_filters as filters

from uccaApp.models import Categories


class CategoriesFilter(filters.FilterSet):
    id = filters.NumberFilter(name='id', lookup_type='exact')
    name = filters.CharFilter(name='name', lookup_type='icontains')
    description = filters.CharFilter(name='description', lookup_type='icontains')
    tooltip = filters.CharFilter(name='tooltip', lookup_type='icontains')
    abbreviation = filters.CharFilter(name='abbreviation', lookup_type='exact')
    is_default = filters.BooleanFilter(name='is_default', lookup_type='exact')
    is_active = filters.BooleanFilter(name='is_active', lookup_type='exact')
    created_by = filters.NumberFilter(name='created_by', lookup_type='exact')
    class Meta:
        model = Categories
        fields = {
            'id',
            'name',
            'description',
            'tooltip',
            'abbreviation',
            'is_default',
            'created_by',
            'is_active',
        }
        # fields = {'name': ['exact','in', 'startswith']}
