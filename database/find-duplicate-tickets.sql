-- Find and display duplicate tickets
SELECT TicketID, Title, Customer, Site, CreatedAt, COUNT(*) as DuplicateCount
FROM Tickets
GROUP BY TicketID, Title, Customer, Site, CreatedAt
HAVING COUNT(*) > 1
ORDER BY TicketID;

-- To delete duplicates (keeping the first one), run this after reviewing above:
-- 
-- WITH CTE AS (
--     SELECT TicketID, 
--            ROW_NUMBER() OVER (PARTITION BY TicketID ORDER BY CreatedAt ASC) as RowNum
--     FROM Tickets
-- )
-- DELETE FROM Tickets 
-- WHERE TicketID IN (
--     SELECT TicketID FROM CTE WHERE RowNum > 1
-- );
