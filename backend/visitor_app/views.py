"""
API views for the visitor management system.
"""
from datetime import datetime, timedelta
from django.db.models import Count, Q, Avg
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
import csv
import logging

from .models import Host, VisitorLog, OIDCSession
from .serializers import (
    HostSerializer, VisitorLogSerializer, CheckinSerializer,
    CheckoutSerializer, DashboardStatsSerializer, OIDCInitiateSerializer,
    OIDCCallbackSerializer
)
from .oidc import VeriFaydaOIDC

logger = logging.getLogger('visitor_app')


class HostListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating hosts."""
    queryset = Host.objects.filter(is_active=True)
    serializer_class = HostSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Save the host instance."""
        host = serializer.save()
        logger.info(f"Host created: {host.name} - {host.department}")


class HostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for retrieving, updating, and deleting hosts."""
    queryset = Host.objects.all()
    serializer_class = HostSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        """Update the host instance."""
        host = serializer.save()
        logger.info(f"Host updated: {host.name} - {host.department}")

    def perform_destroy(self, instance):
        """Soft delete the host by marking as inactive."""
        instance.is_active = False
        instance.save()
        logger.info(f"Host deactivated: {instance.name}")


class VisitorLogListView(generics.ListAPIView):
    """API view for listing visitor logs with filtering."""
    serializer_class = VisitorLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get filtered queryset based on query parameters."""
        queryset = VisitorLog.objects.select_related('host').all()
        
        # Date filtering
        date_range = self.request.query_params.get('date_range')
        if date_range:
            today = timezone.now().date()
            if date_range == 'today':
                queryset = queryset.filter(checkin_time__date=today)
            elif date_range == 'yesterday':
                yesterday = today - timedelta(days=1)
                queryset = queryset.filter(checkin_time__date=yesterday)
            elif date_range == 'week':
                week_ago = today - timedelta(days=7)
                queryset = queryset.filter(checkin_time__date__gte=week_ago)
            elif date_range == 'month':
                month_ago = today - timedelta(days=30)
                queryset = queryset.filter(checkin_time__date__gte=month_ago)

        # Status filtering
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(checkout_time__isnull=True)
        elif status_filter == 'completed':
            queryset = queryset.filter(checkout_time__isnull=False)

        # Host filtering
        host_id = self.request.query_params.get('host')
        if host_id and host_id != 'all':
            queryset = queryset.filter(host_id=host_id)

        # Search filtering
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(fayda_id__icontains=search) |
                Q(host__name__icontains=search)
            )

        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkin_visitor(request):
    """API endpoint for visitor check-in."""
    serializer = CheckinSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Get host
            host = Host.objects.get(id=serializer.validated_data['host_id'])
            
            # Create visitor log
            visitor_log = VisitorLog.objects.create(
                fayda_id=serializer.validated_data['fayda_id'],
                name=serializer.validated_data['name'],
                photo_url=serializer.validated_data.get('photo_url', ''),
                host=host,
                reason=serializer.validated_data['reason'],
                additional_info=serializer.validated_data.get('additional_info', {}),
                created_by=request.user
            )
            
            logger.info(f"Visitor checked in: {visitor_log.name} ({visitor_log.fayda_id}) to visit {host.name}")
            
            return Response({
                'id': visitor_log.id,
                'message': 'Visitor checked in successfully',
                'checkin_time': visitor_log.checkin_time,
                'host_name': host.name
            }, status=status.HTTP_201_CREATED)
            
        except Host.DoesNotExist:
            return Response(
                {'error': 'Host not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error during check-in: {str(e)}")
            return Response(
                {'error': 'Check-in failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def find_active_visit(request):
    """Find active visit for checkout."""
    serializer = CheckoutSerializer(data=request.data)
    
    if serializer.is_valid():
        fayda_id = serializer.validated_data.get('fayda_id')
        visit_id = serializer.validated_data.get('visit_id')
        
        try:
            if visit_id:
                visit = VisitorLog.objects.select_related('host').get(
                    id=visit_id,
                    checkout_time__isnull=True
                )
            else:
                visit = VisitorLog.objects.select_related('host').get(
                    fayda_id=fayda_id,
                    checkout_time__isnull=True
                )
            
            visit_data = VisitorLogSerializer(visit).data
            return Response(visit_data)
            
        except VisitorLog.DoesNotExist:
            return Response(
                {'error': 'No active visit found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_visitor(request):
    """API endpoint for visitor check-out."""
    serializer = CheckoutSerializer(data=request.data)
    
    if serializer.is_valid():
        fayda_id = serializer.validated_data.get('fayda_id')
        visit_id = serializer.validated_data.get('visit_id')
        
        try:
            if visit_id:
                visit = VisitorLog.objects.get(
                    id=visit_id,
                    checkout_time__isnull=True
                )
            else:
                visit = VisitorLog.objects.get(
                    fayda_id=fayda_id,
                    checkout_time__isnull=True
                )
            
            # Perform checkout
            visit.checkout()
            
            logger.info(f"Visitor checked out: {visit.name} ({visit.fayda_id})")
            
            return Response({
                'id': visit.id,
                'message': 'Visitor checked out successfully',
                'checkout_time': visit.checkout_time,
                'duration_minutes': visit.duration_minutes
            })
            
        except VisitorLog.DoesNotExist:
            return Response(
                {'error': 'No active visit found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_checkout(request):
    """Force checkout a visitor (admin only)."""
    visit_id = request.data.get('visit_id')
    
    if not visit_id:
        return Response(
            {'error': 'visit_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        visit = VisitorLog.objects.get(id=visit_id, checkout_time__isnull=True)
        visit.checkout()
        
        logger.info(f"Force checkout by {request.user.username}: {visit.name} ({visit.fayda_id})")
        
        return Response({
            'message': 'Visitor force checked out successfully',
            'checkout_time': visit.checkout_time
        })
        
    except VisitorLog.DoesNotExist:
        return Response(
            {'error': 'Active visit not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics."""
    today = timezone.now().date()
    
    # Calculate statistics
    total_visitors_today = VisitorLog.objects.filter(
        checkin_time__date=today
    ).count()
    
    active_visits = VisitorLog.objects.filter(
        checkout_time__isnull=True
    ).count()
    
    # Average duration calculation
    completed_visits = VisitorLog.objects.filter(
        checkout_time__isnull=False,
        checkin_time__date=today
    )
    
    if completed_visits.exists():
        avg_duration_seconds = completed_visits.aggregate(
            avg_duration=Avg('checkout_time') - Avg('checkin_time')
        )['avg_duration']
        if avg_duration_seconds:
            avg_minutes = int(avg_duration_seconds.total_seconds() / 60)
            avg_duration = f"{avg_minutes}m"
        else:
            avg_duration = "0m"
    else:
        avg_duration = "0m"
    
    # Peak hour calculation
    hourly_visits = VisitorLog.objects.filter(
        checkin_time__date=today
    ).extra(
        select={'hour': 'EXTRACT(hour FROM checkin_time)'}
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count').first()
    
    peak_hour = f"{int(hourly_visits['hour'])}:00" if hourly_visits else "-"
    
    # Additional stats
    total_hosts = Host.objects.filter(is_active=True).count()
    
    busiest_host = Host.objects.annotate(
        visit_count=Count('visitor_logs', filter=Q(visitor_logs__checkin_time__date=today))
    ).order_by('-visit_count').first()
    
    busiest_host_name = busiest_host.name if busiest_host else "None"
    
    stats = {
        'total_visitors_today': total_visitors_today,
        'active_visits': active_visits,
        'avg_duration': avg_duration,
        'peak_hour': peak_hour,
        'total_hosts': total_hosts,
        'busiest_host': busiest_host_name
    }
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_visitor_logs(request):
    """Export visitor logs as CSV."""
    # Get filtered queryset (reuse the same filtering logic)
    view = VisitorLogListView()
    view.request = request
    queryset = view.get_queryset()
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="visitor-logs-{timezone.now().date()}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Name', 'Fayda ID', 'Host', 'Department', 'Check-in Time',
        'Check-out Time', 'Duration (minutes)', 'Reason', 'Status'
    ])
    
    for log in queryset:
        writer.writerow([
            log.name,
            log.fayda_id,
            log.host.name,
            log.host.department,
            log.checkin_time.strftime('%Y-%m-%d %H:%M:%S'),
            log.checkout_time.strftime('%Y-%m-%d %H:%M:%S') if log.checkout_time else '',
            log.duration_minutes or '',
            log.reason,
            'Checked Out' if log.checkout_time else 'Inside'
        ])
    
    logger.info(f"Visitor logs exported by {request.user.username}")
    return response


class OIDCInitiateView(APIView):
    """Initiate OIDC authentication flow."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OIDCInitiateSerializer(data=request.data)
        
        if serializer.is_valid():
            fayda_id = serializer.validated_data['fayda_id']
            
            try:
                oidc_client = VeriFaydaOIDC()
                auth_url, state = oidc_client.initiate_auth_flow(fayda_id)
                
                logger.info(f"OIDC flow initiated for Fayda ID: {fayda_id}")
                
                return Response({
                    'auth_url': auth_url,
                    'state': state
                })
                
            except Exception as e:
                logger.error(f"OIDC initiation failed: {str(e)}")
                return Response(
                    {'error': 'Failed to initiate authentication'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OIDCCallbackView(APIView):
    """Handle OIDC callback and return user data."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OIDCCallbackSerializer(data=request.data)
        
        if serializer.is_valid():
            code = serializer.validated_data['code']
            state = serializer.validated_data['state']
            
            try:
                oidc_client = VeriFaydaOIDC()
                user_data = oidc_client.process_callback(code, state)
                
                logger.info(f"OIDC callback processed for user: {user_data.get('name')}")
                
                return Response(user_data)
                
            except ValueError as e:
                logger.error(f"OIDC callback failed: {str(e)}")
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"OIDC callback error: {str(e)}")
                return Response(
                    {'error': 'Authentication failed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Basic authentication endpoints (stub implementation)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Basic login endpoint (stub implementation)."""
    username = request.data.get('username')
    password = request.data.get('password')
    role = request.data.get('role')
    
    # This is a stub implementation - replace with proper authentication
    if username and password and role:
        # In production, verify credentials against database
        if username == 'admin' and password == 'admin123':
            return Response({
                'token': 'dummy-admin-token',
                'role': 'admin',
                'name': 'Administrator'
            })
        elif username == 'guard' and password == 'guard123':
            return Response({
                'token': 'dummy-guard-token',
                'role': 'guard',
                'name': 'Security Guard'
            })
    
    return Response(
        {'message': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )
