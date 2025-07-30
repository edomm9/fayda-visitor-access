"""
Models for the visitor management system.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Host(models.Model):
    """Model representing a person who can receive visitors."""
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.department}"

    @property
    def total_visitors(self):
        """Get total number of visitors for this host."""
        return self.visitor_logs.count()

    @property
    def last_visit(self):
        """Get the last visit date for this host."""
        last_log = self.visitor_logs.order_by('-checkin_time').first()
        return last_log.checkin_time if last_log else None


class VisitorLog(models.Model):
    """Model representing a visitor check-in/check-out log."""
    fayda_id = models.CharField(max_length=12, db_index=True)
    name = models.CharField(max_length=100)
    photo_url = models.URLField(blank=True, null=True)
    host = models.ForeignKey(Host, on_delete=models.CASCADE, related_name='visitor_logs')
    reason = models.TextField()
    checkin_time = models.DateTimeField(auto_now_add=True)
    checkout_time = models.DateTimeField(blank=True, null=True)
    additional_info = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-checkin_time']
        indexes = [
            models.Index(fields=['fayda_id', 'checkout_time']),
            models.Index(fields=['checkin_time']),
            models.Index(fields=['host', 'checkin_time']),
        ]

    def __str__(self):
        status = "Checked out" if self.checkout_time else "Inside"
        return f"{self.name} ({self.fayda_id}) - {status}"

    @property
    def is_active(self):
        """Check if the visitor is currently inside (not checked out)."""
        return self.checkout_time is None

    @property
    def duration(self):
        """Calculate visit duration."""
        if not self.checkout_time:
            return None
        return self.checkout_time - self.checkin_time

    @property
    def duration_minutes(self):
        """Get duration in minutes."""
        if not self.duration:
            return None
        return int(self.duration.total_seconds() / 60)

    def checkout(self):
        """Mark visitor as checked out."""
        if not self.checkout_time:
            self.checkout_time = timezone.now()
            self.save()
            return True
        return False


class OIDCSession(models.Model):
    """Model to store OIDC session data temporarily."""
    state = models.CharField(max_length=255, unique=True)
    fayda_id = models.CharField(max_length=12)
    code_verifier = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OIDC Session for {self.fayda_id}"

    @property
    def is_expired(self):
        """Check if the session has expired."""
        return timezone.now() > self.expires_at
