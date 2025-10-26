-- Add SystemAdmin role to the allowed roles
USE FieldServiceDB;
GO

-- Drop the existing constraint
ALTER TABLE Users
DROP CONSTRAINT CK__Users__Role__02FC7413;
GO

-- Add new constraint that includes SystemAdmin
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('SystemAdmin', 'Admin', 'Coordinator', 'Technician'));
GO

-- Now update the admin user role
UPDATE Users 
SET Role = 'SystemAdmin'
WHERE Username = 'admin' 
  AND CompanyCode = 'DCPSP';
GO

-- Verify the update
SELECT 
    ID,
    Username,
    FullName,
    Role,
    CompanyCode,
    IsActive
FROM Users
WHERE Username = 'admin' 
  AND CompanyCode = 'DCPSP';
GO

PRINT '✅ Admin user updated to SystemAdmin role';
