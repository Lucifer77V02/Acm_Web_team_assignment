from django.contrib import admin
from .models import Member, Team, Membership

admin.site.register(Member)
admin.site.register(Team)
admin.site.register(Membership)