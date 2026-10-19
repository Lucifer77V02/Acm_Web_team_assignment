from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, TeamViewSet, MembershipViewSet
from .auth_views import register_view, login_view, logout_view, me_view
from .user_views import list_users, set_user_role

router = DefaultRouter()
router.register(r'members', MemberViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'memberships', MembershipViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register_view),
    path('auth/login/', login_view),
    path('auth/logout/', logout_view),
    path('auth/me/', me_view),
    path('users/', list_users),
    path('users/<int:user_id>/role/', set_user_role),
]
