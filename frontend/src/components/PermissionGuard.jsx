import React from 'react';
import { usePermissions, PERMISSIONS } from '../lib/permissions.jsx';
import { AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

// Permission Guard Component
export const PermissionGuard = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  children,
  showAccessDenied = true 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, userRole } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    hasAccess = true; // No permission check specified
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    if (!showAccessDenied) {
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit mb-4">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don't have permission to access this feature.
            </p>
            {userRole && (
              <p className="text-sm text-muted-foreground">
                Current role: <span className="font-medium">{userRole}</span>
              </p>
            )}
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
};

// Permission-based button component
export const PermissionButton = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    hasAccess = true; // No permission check specified
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};

// Permission-based feature wrapper
export const PermissionFeature = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    hasAccess = true; // No permission check specified
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

// Permission-based section component
export const PermissionSection = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  title,
  description,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    hasAccess = true; // No permission check specified
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div className="space-y-2">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// Permission-based navigation item
export const PermissionNavItem = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    hasAccess = true; // No permission check specified
  }

  if (!hasAccess) {
    return null;
  }

  return children;
}; 