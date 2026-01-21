from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from db import (
    get_dashboard_summary, get_products, get_categories,
    process_scan, remove_scan, update_product
)
from config import SECRET_KEY, USERS

app = Flask(__name__)
app.secret_key = SECRET_KEY

# ============ AUTH DECORATOR ============
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            if request.is_json:
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        if session.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ============ AUTH ROUTES ============
@app.route('/')
def index():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        if username in USERS and USERS[username]['password'] == password:
            session['user'] = username
            session['role'] = USERS[username]['role']
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error='Invalid credentials')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ============ DASHBOARD ============
@app.route('/dashboard')
@login_required
def dashboard():
    categories = get_categories()
    return render_template('dashboard.html', 
                         user=session.get('user'),
                         role=session.get('role'),
                         categories=categories)

# ============ API ROUTES ============
@app.route('/api/summary')
@login_required
def api_summary():
    summary = get_dashboard_summary()
    return jsonify(summary)

@app.route('/api/products')
@login_required
def api_products():
    category = request.args.get('category')
    status = request.args.get('status')
    search = request.args.get('search')
    
    products = get_products(category=category, status=status, search=search)
    return jsonify(products)

@app.route('/api/scan', methods=['POST'])
@login_required
def api_scan():
    data = request.get_json()
    barcode = data.get('barcode', '').strip()
    
    if not barcode:
        return jsonify({'success': False, 'message': 'Barcode required'}), 400
    
    result = process_scan(barcode)
    return jsonify(result)

@app.route('/api/scan/<int:product_id>', methods=['DELETE'])
@login_required
def api_remove_scan(product_id):
    result = remove_scan(product_id)
    return jsonify(result)

@app.route('/api/product/<int:product_id>', methods=['PUT'])
@login_required
def api_update_product(product_id):
    data = request.get_json()
    mrp = data.get('mrp')
    quantity = data.get('quantity')
    
    # Only admin can update quantity
    if quantity is not None and session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required for quantity edit'}), 403
    
    result = update_product(product_id, mrp=mrp, quantity=quantity)
    return jsonify(result)

@app.route('/api/categories')
@login_required
def api_categories():
    categories = get_categories()
    return jsonify(categories)

# ============ ERROR HANDLERS ============
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error'}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
