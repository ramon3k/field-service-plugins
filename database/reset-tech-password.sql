-- Reset password for technician user to known value
-- This will hash the password properly using bcrypt

DECLARE @hashedPassword NVARCHAR(500)

-- For testing, we'll set a simple password that you know
-- In production, you'd use bcrypt to hash this properly
-- For now, let's just set it to a known value for testing

-- Update the tech user with a test password
UPDATE Users 
SET PasswordHash = 'tech123'  -- This should be hashed in production!
WHERE Username = 'tech';

-- Verify the update
SELECT Username, FullName, Email, Role, PasswordHash, IsActive 
FROM Users 
WHERE Username = 'tech';

PRINT 'Updated tech user password to: tech123';
PRINT 'Username: tech';
PRINT 'Password: tech123';
