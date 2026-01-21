# Warehouse System Configuration

# Database Configuration
DB_CONFIG = {
    'driver': '{ODBC Driver 17 for SQL Server}',
    'server': 'localhost',
    'database': 'Warehouse',
    'trusted_connection': 'yes'
}

# Flask Configuration
SECRET_KEY = 'warehouse-secret-key-2026'

# Demo Users (for production, use database)
USERS = {
    'admin': {
        'password': 'admin123',
        'role': 'admin'
    },
    'operator': {
        'password': 'operator123',
        'role': 'user'
    }
}

# Picking Status Configuration
PICKING_STATUS = {
    'PICKED': 'PICKED',
    'EXCESS': 'EXCESS', 
    'PENDING': 'PENDING'
}
