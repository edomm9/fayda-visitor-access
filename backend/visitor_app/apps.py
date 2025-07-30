"""
App configuration for visitor_app.
"""
from django.apps import AppConfig


class VisitorAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'visitor_app'
    verbose_name = 'Visitor Management'

    def ready(self):
        """Initialize app when Django starts."""
        # Import signals or perform other initialization
        pass
