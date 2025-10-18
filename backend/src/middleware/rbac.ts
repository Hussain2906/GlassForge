import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

// Extend the Request interface to include user role information
declare global {
  namespace Express {
    interface Request {
      userRole?: Role;
    }
  }
}

// Role hierarchy: ADMIN > STAFF > VIEWER
const roleHierarchy: Record<Role, number> = {
  ADMIN: 3,
  STAFF: 2,
  VIEWER: 1,
};

/**
 * Middleware to check if user has required role or higher
 */
export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoleLevel = roleHierarchy[userRole];
    const requiredRoleLevel = roleHierarchy[minRole];

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${minRole} or higher` 
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has exact role
 */
export function requireExactRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (userRole !== role) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${role}` 
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the specified roles
 */
export function requireAnyRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;
    
    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
}

/**
 * Middleware to add user role to request object
 * Should be used after authentication middleware
 */
export function addUserRole(req: Request, res: Response, next: NextFunction) {
  // This would typically get the role from the JWT token or database
  // For now, we'll assume it's available in req.auth
  if (req.auth && req.auth.orgs && req.auth.orgs.length > 0) {
    // Get the role for the current organization
    const currentOrgId = req.orgId || req.auth.defaultOrgId;
    const orgRole = req.auth.orgs.find((org: any) => org.id === currentOrgId);
    req.userRole = orgRole?.role || Role.VIEWER;
  }
  
  next();
}

// Route protection helpers
export const adminOnly = requireExactRole(Role.ADMIN);
export const staffOrHigher = requireMinRole(Role.STAFF);
export const anyRole = requireMinRole(Role.VIEWER);