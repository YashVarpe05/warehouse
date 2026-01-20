from flask import Flask
from db import get_connection

app = Flask(__name__)

@app.route("/")
def home():
    return "P&G Warehouse Backend Running"

@app.route("/db-test")
def db_test():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    return "DB Connected OK"

if __name__ == "__main__":
    app.run(debug=True)
