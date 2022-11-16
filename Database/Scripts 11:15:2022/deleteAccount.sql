# FIND USER AND FAMILY STATUS;
SELECT
users.userId as 'User Id',
users.userFirstName as 'First Name',
users.userLastName as 'Last Name',
users.userEmail as 'Email',
familyMembers.familyId as 'NOT NULL -> Family Member or Head',
families.userId as 'NOT NULL -> Family Head'
FROM users
LEFT JOIN familyMembers ON familyMembers.userId = users.userId
LEFT JOIN families ON families.userId = users.userId
WHERE
UPPER(users.userFirstName) LIKE UPPER('%melissa%') OR UPPER(users.userLastName) LIKE UPPER('%floryance%')
OR
UPPER(users.userEmail) LIKE UPPER('%some email%');

# USER IS NOT IN A FAMILY
DELETE FROM users WHERE userId = '';

# SECTION BELOW IS INCOMPLETE

# USER IS FAMILY HEAD
DELETE FROM families WHERE familyId = ?;
DELETE FROM familyMembers WHERE familyId = ?;
DELETE FROM previousFamilyMembers WHERE familyId = ?;
DELETE dogs, dogReminders, dogLogs FROM dogs LEFT JOIN dogLogs ON dogs.dogId = dogLogs.dogId LEFT JOIN dogReminders ON dogs.dogId = dogReminders.dogId WHERE dogs.familyId = ?;

# USER IS FAMILY MEMBER
DELETE FROM familyMembers WHERE userId = ?;
INSERT INTO previousFamilyMembers(familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReasonn)
VALUES (?,?,?,?,?,?,?);