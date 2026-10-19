from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse, HttpResponseNotFound
from django.urls import include, path, re_path


def spa(request, *args, **kwargs):
    """Serve the built React app so client-side routes survive a page refresh."""
    index = settings.BASE_DIR / 'frontend' / 'dist' / 'index.html'
    if not index.exists():
        return HttpResponseNotFound(
            'Frontend not built. Run "npm run build" inside the frontend folder.'
        )
    return HttpResponse(index.read_text(encoding='utf-8'), content_type='text/html')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('members.urls')),
    path('api-auth/', include('rest_framework.urls')),
    # Everything else is handled by React Router.
    re_path(r'^(?!api/|api-auth/|admin/|static/).*$', spa),
]
