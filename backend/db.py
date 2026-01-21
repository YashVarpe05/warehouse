import pyodbc
from config import DB_CONFIG

# Demo mode flag - set to True if SQL Server is not available
DEMO_MODE = True

# Demo data for testing
DEMO_PRODUCTS = [
    {
        'ID': 1, 'CombiBarCode_MRP': 'COMBI001-100', 'Company': 'PharmaCorp', 
        'Category': 'Medicines', 'Brand': 'HealthPlus', 'BrandForm': 'Tablets',
        'SBF': 'SBF001', 'BarCode': '8901234567890', 'UPC': 'UPC001',
        'MRP': 150.00, 'SLP': 140.00, 'RLP': 130.00, 'CountOfMRP': 5,
        'Conversion': 1.0, 'Combi': 'Y', 'Mono': 'N', 'Units': 10,
        'PickingStatus': 'PENDING', 'ScanProducts': 0, 'CreatedAt': '2026-01-21'
    },
    {
        'ID': 2, 'CombiBarCode_MRP': 'COMBI002-200', 'Company': 'PharmaCorp',
        'Category': 'Medicines', 'Brand': 'MediCare', 'BrandForm': 'Syrup',
        'SBF': 'SBF002', 'BarCode': '8901234567891', 'UPC': 'UPC002',
        'MRP': 250.00, 'SLP': 230.00, 'RLP': 210.00, 'CountOfMRP': 3,
        'Conversion': 1.0, 'Combi': 'N', 'Mono': 'Y', 'Units': 5,
        'PickingStatus': 'PENDING', 'ScanProducts': 0, 'CreatedAt': '2026-01-21'
    },
    {
        'ID': 3, 'CombiBarCode_MRP': 'COMBI003-75', 'Company': 'HealthGen',
        'Category': 'Supplements', 'Brand': 'VitaBoost', 'BrandForm': 'Capsules',
        'SBF': 'SBF003', 'BarCode': '8901234567892', 'UPC': 'UPC003',
        'MRP': 75.00, 'SLP': 70.00, 'RLP': 65.00, 'CountOfMRP': 10,
        'Conversion': 1.0, 'Combi': 'Y', 'Mono': 'N', 'Units': 20,
        'PickingStatus': 'PENDING', 'ScanProducts': 2, 'CreatedAt': '2026-01-21'
    },
    {
        'ID': 4, 'CombiBarCode_MRP': 'COMBI004-300', 'Company': 'HealthGen',
        'Category': 'Supplements', 'Brand': 'OmegaPlus', 'BrandForm': 'Softgels',
        'SBF': 'SBF004', 'BarCode': '8901234567893', 'UPC': 'UPC004',
        'MRP': 300.00, 'SLP': 280.00, 'RLP': 260.00, 'CountOfMRP': 4,
        'Conversion': 1.0, 'Combi': 'N', 'Mono': 'Y', 'Units': 8,
        'PickingStatus': 'PICKED', 'ScanProducts': 4, 'CreatedAt': '2026-01-21'
    },
    {
        'ID': 5, 'CombiBarCode_MRP': 'COMBI005-500', 'Company': 'MedSupply',
        'Category': 'Equipment', 'Brand': 'MedTech', 'BrandForm': 'Device',
        'SBF': 'SBF005', 'BarCode': '8901234567894', 'UPC': 'UPC005',
        'MRP': 500.00, 'SLP': 480.00, 'RLP': 450.00, 'CountOfMRP': 2,
        'Conversion': 1.0, 'Combi': 'Y', 'Mono': 'N', 'Units': 3,
        'PickingStatus': 'EXCESS', 'ScanProducts': 3, 'CreatedAt': '2026-01-21'
    },
    {
        'ID': 6, 'CombiBarCode_MRP': 'COMBI006-120', 'Company': 'PharmaCorp',
        'Category': 'Medicines', 'Brand': 'PainRelief', 'BrandForm': 'Tablets',
        'SBF': 'SBF006', 'BarCode': '8901234567895', 'UPC': 'UPC006',
        'MRP': 120.00, 'SLP': 110.00, 'RLP': 100.00, 'CountOfMRP': 8,
        'Conversion': 1.0, 'Combi': 'N', 'Mono': 'Y', 'Units': 15,
        'PickingStatus': 'PENDING', 'ScanProducts': 5, 'CreatedAt': '2026-01-21'
    },
]

def get_connection():
    """Get database connection to SQL Server"""
    conn_string = (
        f"DRIVER={DB_CONFIG['driver']};"
        f"SERVER={DB_CONFIG['server']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"Trusted_Connection={DB_CONFIG['trusted_connection']};"
    )
    return pyodbc.connect(conn_string)

def _update_picking_status(product):
    """Helper to calculate picking status based on scan count"""
    if product['ScanProducts'] and product['CountOfMRP']:
        if product['ScanProducts'] > product['CountOfMRP']:
            product['PickingStatus'] = 'EXCESS'
        elif product['ScanProducts'] == product['CountOfMRP']:
            product['PickingStatus'] = 'PICKED'
        else:
            product['PickingStatus'] = 'PENDING'
    return product

def get_dashboard_summary():
    """Get total, scanned, and remaining product counts"""
    if DEMO_MODE:
        total = len(DEMO_PRODUCTS)
        scanned = sum(1 for p in DEMO_PRODUCTS if p['ScanProducts'] > 0)
        remaining = sum(1 for p in DEMO_PRODUCTS if p['ScanProducts'] < p['CountOfMRP'])
        return {'total': total, 'scanned': scanned, 'remaining': remaining}
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                COUNT(*) as TotalProducts,
                SUM(CASE WHEN ScanProducts > 0 THEN 1 ELSE 0 END) as ScannedProducts,
                SUM(CASE WHEN ScanProducts < CountOfMRP OR ScanProducts = 0 THEN 1 ELSE 0 END) as RemainingProducts
            FROM HUB
        """)
        row = cursor.fetchone()
        return {
            'total': row[0] if row[0] else 0,
            'scanned': row[1] if row[1] else 0,
            'remaining': row[2] if row[2] else 0
        }
    except Exception as e:
        print(f"Error getting summary: {e}")
        return {'total': 0, 'scanned': 0, 'remaining': 0}
    finally:
        conn.close()

def get_products(category=None, status=None, search=None):
    """Get products with optional filters"""
    if DEMO_MODE:
        products = [dict(p) for p in DEMO_PRODUCTS]  # Create copies
        
        if category:
            products = [p for p in products if p['Category'] == category]
        
        if status:
            products = [p for p in products if p['PickingStatus'] == status]
        
        if search:
            search_lower = search.lower()
            products = [p for p in products if 
                       search_lower in (p['BarCode'] or '').lower() or
                       search_lower in (p['UPC'] or '').lower() or
                       search_lower in (p['CombiBarCode_MRP'] or '').lower()]
        
        # Update picking status for each product
        for product in products:
            _update_picking_status(product)
        
        return products
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT 
                ID, CombiBarCode_MRP, Company, Category, Brand, BrandForm,
                SBF, BarCode, UPC, MRP, SLP, RLP, CountOfMRP, Conversion,
                Combi, Mono, Units, PickingStatus, ScanProducts, CreatedAt
            FROM HUB
            WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND Category = ?"
            params.append(category)
        
        if status:
            query += " AND PickingStatus = ?"
            params.append(status)
            
        if search:
            query += " AND (BarCode LIKE ? OR UPC LIKE ? OR CombiBarCode_MRP LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        query += " ORDER BY ID DESC"
        
        cursor.execute(query, params)
        columns = [column[0] for column in cursor.description]
        products = []
        
        for row in cursor.fetchall():
            product = dict(zip(columns, row))
            # Calculate picking status based on scan count
            if product['ScanProducts'] and product['CountOfMRP']:
                if product['ScanProducts'] > product['CountOfMRP']:
                    product['PickingStatus'] = 'EXCESS'
                elif product['ScanProducts'] == product['CountOfMRP']:
                    product['PickingStatus'] = 'PICKED'
                else:
                    product['PickingStatus'] = 'PENDING'
            products.append(product)
            
        return products
    except Exception as e:
        print(f"Error getting products: {e}")
        return []
    finally:
        conn.close()

def get_categories():
    """Get distinct categories for dropdown"""
    if DEMO_MODE:
        categories = list(set(p['Category'] for p in DEMO_PRODUCTS if p['Category']))
        return sorted(categories)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT DISTINCT Category FROM HUB WHERE Category IS NOT NULL ORDER BY Category")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error getting categories: {e}")
        return []
    finally:
        conn.close()

def process_scan(barcode):
    """Process a barcode scan - increment scan count"""
    if DEMO_MODE:
        # Find product by barcode
        for product in DEMO_PRODUCTS:
            if (product['BarCode'] == barcode or 
                product['UPC'] == barcode or 
                barcode in (product['CombiBarCode_MRP'] or '')):
                
                product['ScanProducts'] = (product['ScanProducts'] or 0) + 1
                count_of_mrp = product['CountOfMRP'] or 0
                new_scan_count = product['ScanProducts']
                is_excess = new_scan_count > count_of_mrp
                
                # Update picking status
                if new_scan_count > count_of_mrp:
                    product['PickingStatus'] = 'EXCESS'
                elif new_scan_count == count_of_mrp:
                    product['PickingStatus'] = 'PICKED'
                else:
                    product['PickingStatus'] = 'PENDING'
                
                return {
                    'success': True,
                    'product_id': product['ID'],
                    'barcode': barcode,
                    'new_count': new_scan_count,
                    'required': count_of_mrp,
                    'warning': is_excess,
                    'message': 'Extra scan detected!' if is_excess else 'Scan recorded successfully'
                }
        
        return {'success': False, 'message': 'Barcode not found', 'warning': True}
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check if barcode exists
        cursor.execute("""
            SELECT ID, BarCode, CountOfMRP, ScanProducts, MRP 
            FROM HUB 
            WHERE BarCode = ? OR UPC = ? OR CombiBarCode_MRP LIKE ?
        """, (barcode, barcode, f"%{barcode}%"))
        
        row = cursor.fetchone()
        
        if not row:
            return {'success': False, 'message': 'Barcode not found', 'warning': True}
        
        product_id = row[0]
        count_of_mrp = row[2] if row[2] else 0
        scan_products = row[3] if row[3] else 0
        
        new_scan_count = scan_products + 1
        is_excess = new_scan_count > count_of_mrp
        
        # Update scan count
        cursor.execute("""
            UPDATE HUB 
            SET ScanProducts = ?, 
                PickingStatus = CASE 
                    WHEN ? > CountOfMRP THEN 'EXCESS'
                    WHEN ? = CountOfMRP THEN 'PICKED'
                    ELSE 'PENDING'
                END
            WHERE ID = ?
        """, (new_scan_count, new_scan_count, new_scan_count, product_id))
        
        conn.commit()
        
        return {
            'success': True,
            'product_id': product_id,
            'barcode': barcode,
            'new_count': new_scan_count,
            'required': count_of_mrp,
            'warning': is_excess,
            'message': 'Extra scan detected!' if is_excess else 'Scan recorded successfully'
        }
    except Exception as e:
        print(f"Error processing scan: {e}")
        return {'success': False, 'message': str(e)}
    finally:
        conn.close()

def remove_scan(product_id):
    """Remove a scan (decrement count)"""
    if DEMO_MODE:
        for product in DEMO_PRODUCTS:
            if product['ID'] == product_id:
                if product['ScanProducts'] > 0:
                    product['ScanProducts'] -= 1
                
                # Update picking status
                count_of_mrp = product['CountOfMRP'] or 0
                scan_products = product['ScanProducts']
                
                if scan_products > count_of_mrp:
                    product['PickingStatus'] = 'EXCESS'
                elif scan_products == count_of_mrp:
                    product['PickingStatus'] = 'PICKED'
                else:
                    product['PickingStatus'] = 'PENDING'
                
                return {'success': True, 'message': 'Scan removed'}
        
        return {'success': False, 'message': 'Product not found'}
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE HUB 
            SET ScanProducts = CASE WHEN ScanProducts > 0 THEN ScanProducts - 1 ELSE 0 END,
                PickingStatus = CASE 
                    WHEN ScanProducts - 1 > CountOfMRP THEN 'EXCESS'
                    WHEN ScanProducts - 1 = CountOfMRP THEN 'PICKED'
                    ELSE 'PENDING'
                END
            WHERE ID = ?
        """, (product_id,))
        conn.commit()
        return {'success': True, 'message': 'Scan removed'}
    except Exception as e:
        return {'success': False, 'message': str(e)}
    finally:
        conn.close()

def update_product(product_id, mrp=None, quantity=None):
    """Update product MRP or quantity"""
    if DEMO_MODE:
        for product in DEMO_PRODUCTS:
            if product['ID'] == product_id:
                if mrp is not None:
                    product['MRP'] = mrp
                
                if quantity is not None:
                    product['ScanProducts'] = quantity
                    count_of_mrp = product['CountOfMRP'] or 0
                    
                    if quantity > count_of_mrp:
                        product['PickingStatus'] = 'EXCESS'
                    elif quantity == count_of_mrp:
                        product['PickingStatus'] = 'PICKED'
                    else:
                        product['PickingStatus'] = 'PENDING'
                
                return {'success': True, 'message': 'Product updated'}
        
        return {'success': False, 'message': 'Product not found'}
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        updates = []
        params = []
        
        if mrp is not None:
            updates.append("MRP = ?")
            params.append(mrp)
        
        if quantity is not None:
            updates.append("ScanProducts = ?")
            params.append(quantity)
            updates.append("""PickingStatus = CASE 
                WHEN ? > CountOfMRP THEN 'EXCESS'
                WHEN ? = CountOfMRP THEN 'PICKED'
                ELSE 'PENDING'
            END""")
            params.extend([quantity, quantity])
        
        if updates:
            params.append(product_id)
            query = f"UPDATE HUB SET {', '.join(updates)} WHERE ID = ?"
            cursor.execute(query, params)
            conn.commit()
            return {'success': True, 'message': 'Product updated'}
        
        return {'success': False, 'message': 'No updates provided'}
    except Exception as e:
        return {'success': False, 'message': str(e)}
    finally:
        conn.close()
