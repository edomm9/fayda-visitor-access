"""
Serializers for the visitor management system API.
"""
from rest_framework import serializers
from .models import Host, VisitorLog


class HostSerializer(serializers.ModelSerializer):
    """Serializer for Host model."""
    total_visitors = serializers.ReadOnlyField()
    last_visit = serializers.ReadOnlyField()

    class Meta:
        model = Host
        fields = [
            'id', 'name', 'department', 'is_active',
            'total_visitors', 'last_visit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        """Validate host name."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()

    def validate_department(self, value):
        """Validate department name."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Department must be at least 2 characters long.")
        return value.strip()


class VisitorLogSerializer(serializers.ModelSerializer):
    """Serializer for VisitorLog model."""
    host_name = serializers.CharField(source='host.name', read_only=True)
    host_department = serializers.CharField(source='host.department', read_only=True)
    is_active = serializers.ReadOnlyField()
    duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = VisitorLog
        fields = [
            'id', 'fayda_id', 'name', 'photo_url', 'host', 'host_name', 
            'host_department', 'reason', 'checkin_time', 'checkout_time',
            'is_active', 'duration_minutes', 'additional_info'
        ]
        read_only_fields = ['checkin_time', 'checkout_time']

    def validate_fayda_id(self, value):
        """Validate Fayda ID format."""
        if not value.isdigit() or len(value) != 12:
            raise serializers.ValidationError("Fayda ID must be exactly 12 digits.")
        return value

    def validate_name(self, value):
        """Validate visitor name."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()

    def validate_reason(self, value):
        """Validate visit reason."""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Reason must be at least 5 characters long.")
        return value.strip()


class CheckinSerializer(serializers.Serializer):
    """Serializer for visitor check-in."""
    fayda_id = serializers.CharField(max_length=12)
    name = serializers.CharField(max_length=100)
    photo_url = serializers.URLField(required=False, allow_blank=True)
    host_id = serializers.IntegerField()
    reason = serializers.CharField()
    additional_info = serializers.JSONField(required=False, default=dict)

    def validate_fayda_id(self, value):
        """Validate Fayda ID format."""
        if not value.isdigit() or len(value) != 12:
            raise serializers.ValidationError("Fayda ID must be exactly 12 digits.")
        
        # Check if visitor is already checked in
        active_visit = VisitorLog.objects.filter(
            fayda_id=value,
            checkout_time__isnull=True
        ).first()
        
        if active_visit:
            raise serializers.ValidationError(
                f"Visitor is already checked in since {active_visit.checkin_time.strftime('%Y-%m-%d %H:%M')}."
            )
        
        return value

    def validate_host_id(self, value):
        """Validate host exists and is active."""
        try:
            host = Host.objects.get(id=value)
            if not host.is_active:
                raise serializers.ValidationError("Selected host is not active.")
            return value
        except Host.DoesNotExist:
            raise serializers.ValidationError("Selected host does not exist.")


class CheckoutSerializer(serializers.Serializer):
    """Serializer for visitor check-out."""
    fayda_id = serializers.CharField(max_length=12, required=False)
    visit_id = serializers.IntegerField(required=False)

    def validate(self, data):
        """Validate that either fayda_id or visit_id is provided."""
        if not data.get('fayda_id') and not data.get('visit_id'):
            raise serializers.ValidationError(
                "Either fayda_id or visit_id must be provided."
            )
        return data

    def validate_fayda_id(self, value):
        """Validate Fayda ID format."""
        if value and (not value.isdigit() or len(value) != 12):
            raise serializers.ValidationError("Fayda ID must be exactly 12 digits.")
        return value


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_visitors_today = serializers.IntegerField()
    active_visits = serializers.IntegerField()
    avg_duration = serializers.CharField()
    peak_hour = serializers.CharField()
    total_hosts = serializers.IntegerField()
    busiest_host = serializers.CharField()


class OIDCInitiateSerializer(serializers.Serializer):
    """Serializer for OIDC initiation."""
    fayda_id = serializers.CharField(max_length=12)

    def validate_fayda_id(self, value):
        """Validate Fayda ID format."""
        if not value.isdigit() or len(value) != 12:
            raise serializers.ValidationError("Fayda ID must be exactly 12 digits.")
        return value


class OIDCCallbackSerializer(serializers.Serializer):
    """Serializer for OIDC callback."""
    code = serializers.CharField()
    state = serializers.CharField()
