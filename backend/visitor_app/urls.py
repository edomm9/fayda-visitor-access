"""
URL configuration for visitor_app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Host management
    path('hosts/', views.HostListCreateView.as_view(), name='host-list-create'),
    path('hosts/<int:pk>/', views.HostDetailView.as_view(), name='host-detail'),
    
    # Visitor management
    path('checkin/', views.checkin_visitor, name='checkin-visitor'),
    path('checkout/find-active/', views.find_active_visit, name='find-active-visit'),
    path('checkout/', views.checkout_visitor, name='checkout-visitor'),
    path('checkout/force/', views.force_checkout, name='force-checkout'),
    
    # Dashboard and reporting
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('visitor-logs/', views.VisitorLogListView.as_view(), name='visitor-logs'),
    path('visitor-logs/export/', views.export_visitor_logs, name='export-visitor-logs'),
    
    # OIDC endpoints
    path('oidc/initiate/', views.OIDCInitiateView.as_view(), name='oidc-initiate'),
    path('oidc/callback/', views.OIDCCallbackView.as_view(), name='oidc-callback'),
    
    # Authentication (stub)
    path('auth/login/', views.login, name='login'),
]
