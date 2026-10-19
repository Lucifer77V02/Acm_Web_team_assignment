from django.db.models import Count
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Member, Membership, Team
from .permissions import IsAdminOrReadOnly
from .serializers import MemberSerializer, MembershipSerializer, TeamSerializer

# NOTE: every viewset uses IsAdminOrReadOnly:
#   - anonymous users            -> rejected (403)
#   - logged-in "viewer" users   -> read-only (GET / HEAD / OPTIONS)
#   - admins (is_staff)          -> full create / update / delete


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().order_by('name')
    serializer_class = MemberSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'department']
    ordering_fields = ['name', 'year', 'date_joined']

    def get_queryset(self):
        queryset = (
            Member.objects.all()
            .order_by('name')
            .prefetch_related('memberships__team')
        )
        params = self.request.query_params

        status_param = params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        team = params.get('team')
        if team:
            queryset = queryset.filter(memberships__team_id=team)

        year = params.get('year')
        if year:
            queryset = queryset.filter(year=year)

        department = params.get('department')
        if department:
            queryset = queryset.filter(department=department)

        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard numbers, all computed from the database."""
        total = Member.objects.count()
        active = Member.objects.filter(status='active').count()
        inactive = Member.objects.filter(status='inactive').count()
        by_department = list(
            Member.objects.values('department')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        by_year = list(
            Member.objects.values('year')
            .annotate(count=Count('id'))
            .order_by('year')
        )
        recent = MemberSerializer(
            Member.objects.order_by('-date_joined', '-id')[:5],
            many=True,
        ).data

        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
            'by_department': by_department,
            'by_year': by_year,
            'recent_members': recent,
        })


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        team = self.get_object()
        memberships = team.memberships.select_related('member')
        data = [
            {
                'id': m.member.id,
                'name': m.member.name,
                'email': m.member.email,
                'department': m.member.department,
                'year': m.member.year,
                'status': m.member.status,
                'designation': m.designation,
            }
            for m in memberships
        ]
        return Response(data)


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.select_related('member', 'team')
    serializer_class = MembershipSerializer
    permission_classes = [IsAdminOrReadOnly]
