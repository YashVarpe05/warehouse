from flask import Flask, render_template, request, jsonify
import pyodbc

app = Flask(__name__)

# SQL SERVER CONNECTION
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=Warehouse;"
    "Trusted_Connection=yes;"
)

@app.route("/")
def home():
    return "Warehouse Web App Running"

if __name__ == "__main__":
    app.run(debug=True)
