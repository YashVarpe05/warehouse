SELECT
    SUM(ORD) AS TotalOrder,
    SUM(Scanned) AS TotalScanned,
    SUM(Remaining) AS TotalRemaining
FROM WarehouseDashboard;
