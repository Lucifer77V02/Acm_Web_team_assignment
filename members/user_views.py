from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status


def user_row(u):
    return {
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': 'admin' if u.is_staff else 'viewer',
        'date_joined': u.date_joined.date().isoformat(),
    }


@api_view(['GET'])
@permission_classes([IsAdminUser])  # IsAdminUser = is_staff, so viewers get 403
def list_users(request):
    users = User.objects.all().order_by('username')
    return Response([user_row(u) for u in users])


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def set_user_role(request, user_id):
    role = request.data.get('role')
    if role not in ('admin', 'viewer'):
        return Response({'error': "Role must be 'admin' or 'viewer'."},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if role == 'viewer':
        if target.id == request.user.id:
            return Response({'error': "You can't remove your own admin role."},
                            status=status.HTTP_400_BAD_REQUEST)
        if target.is_staff and User.objects.filter(is_staff=True).count() <= 1:
            return Response({'error': 'At least one admin must remain.'},
                            status=status.HTTP_400_BAD_REQUEST)

    target.is_staff = (role == 'admin')
    target.save(update_fields=['is_staff'])
    return Response(user_row(target))
