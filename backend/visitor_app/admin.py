"""
Admin configuration for visitor management system.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Host, VisitorLog, OIDCSession


@admin.register(Host)
class HostAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'total_visitors', 'last_visit', 'is_active', 'created_at']
    list_filter = ['department', 'is_active', 'created_at']
    search_fields = ['name', 'department']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at', 'total_visitors', 'last_visit']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'department', 'is_active')
        }),
        ('Statistics', {
            'fields': ('total_visitors', 'last_visit'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def total_visitors(self, obj):
        return obj.total_visitors
    total_visitors.short_description = 'Total Visitors'

    def last_visit(self, obj):
        if obj.last_visit:
            return obj.last_visit.strftime('%Y-%m-%d %H:%M')
        return 'Never'
    last_visit.short_description = 'Last Visit'


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'fayda_id', 'host', 'checkin_time', 
        'checkout_time', 'status', 'duration_display', 'created_by'
    ]
    list_filter = [
        'checkin_time', 'checkout_time', 'host__department', 
        'host', 'created_by'
    ]
    search_fields = ['name', 'fayda_id', 'host__name', 'reason']
    ordering = ['-checkin_time']
    readonly_fields = [
        'checkin_time', 'duration_display', 'is_active', 
        'photo_preview', 'additional_info_display'
    ]
    date_hierarchy = 'checkin_time'

    fieldsets = (
        ('Visitor Information', {
            'fields': ('fayda_id', 'name', 'photo_url', 'photo_preview')
        }),
        ('Visit Details', {
            'fields': ('host', 'reason', 'checkin_time', 'checkout_time')
        }),
        ('Status & Duration', {
            'fields': ('is_active', 'duration_display'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('additional_info_display', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    actions = ['force_checkout', 'export_selected']

    def status(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">Inside</span>'
            )
        else:
            return format_html(
                '<span style="color: blue;">Checked Out</span>'
            )
    status.short_description = 'Status'

    def duration_display(self, obj):
        if obj.duration:
            hours = obj.duration.seconds // 3600
            minutes = (obj.duration.seconds % 3600) // 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{minutes}m"
        elif obj.is_active:
            current_duration = timezone.now() - obj.checkin_time
            hours = current_duration.seconds // 3600
            minutes = (current_duration.seconds % 3600) // 60
            return f"{hours}h {minutes}m (ongoing)"
        return 'N/A'
    duration_display.short_description = 'Duration'

    def photo_preview(self, obj):
        if obj.photo_url:
            return format_html(
                '<img src="{}" width="100" height="100" style="border-radius: 8px;" />',
                obj.photo_url
            )
        return 'No photo'
    photo_preview.short_description = 'Photo Preview'

    def additional_info_display(self, obj):
        if obj.additional_info:
            info_items = []
            for key, value in obj.additional_info.items():
                info_items.append(f"{key}: {value}")
            return format_html('<br>'.join(info_items))
        return 'None'
    additional_info_display.short_description = 'Additional Info'

    def force_checkout(self, request, queryset):
        """Admin action to force checkout selected visitors."""
        count = 0
        for log in queryset.filter(checkout_time__isnull=True):
            log.checkout()
            count += 1
        
        self.message_user(
            request,
            f'Successfully checked out {count} visitors.'
        )
    force_checkout.short_description = 'Force checkout selected visitors'

    def export_selected(self, request, queryset):
        """Admin action to export selected logs."""
        # This would implement CSV export functionality
        self.message_user(
            request,
            f'Export functionality would export {queryset.count()} records.'
        )
    export_selected.short_description = 'Export selected logs'


@admin.register(OIDCSession)
class OIDCSessionAdmin(admin.ModelAdmin):
    list_display = ['fayda_id', 'state', 'created_at', 'expires_at', 'is_expired']
    list_filter = ['created_at', 'expires_at']
    search_fields = ['fayda_id', 'state']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'is_expired']

    def is_expired(self, obj):
        if obj.is_expired:
            return format_html(
                '<span style="color: red; font-weight: bold;">Expired</span>'
            )
        else:
            return format_html(
                '<span style="color: green;">Active</span>'
            )
    is_expired.short_description = 'Status'

    actions = ['cleanup_expired']

    def cleanup_expired(self, request, queryset):
        """Admin action to clean up expired sessions."""
        expired_count = queryset.filter(expires_at__lt=timezone.now()).count()
        queryset.filter(expires_at__lt=timezone.now()).delete()
        
        self.message_user(
            request,
            f'Cleaned up {expired_count} expired sessions.'
        )
    cleanup_expired.short_description = 'Clean up expired sessions'


# Customize admin site
admin.site.site_header = 'Fayda Visitor Access System'
admin.site.site_title = 'Fayda Admin'
admin.site.index_title = 'Visitor Management Administration'
