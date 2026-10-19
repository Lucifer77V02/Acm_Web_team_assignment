from rest_framework import serializers

from .models import Member, Membership, Team


class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'member_count', 'created_at']

    def get_member_count(self, obj):
        return obj.memberships.count()


class MembershipSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    member = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all())
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all())

    class Meta:
        model = Membership
        fields = ['id', 'member', 'team', 'team_name', 'designation', 'start_date']


class MemberSerializer(serializers.ModelSerializer):
    memberships = MembershipSerializer(many=True, read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'name', 'email', 'department',
            'year', 'status', 'date_joined', 'memberships',
        ]

    def validate_year(self, value):
        # Enforced on the server too, not only in the React form.
        if not 1 <= value <= 4:
            raise serializers.ValidationError('Year must be between 1 and 4.')
        return value
