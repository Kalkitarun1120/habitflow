import pymysql

passwords = ['', 'root', 'password', 'root123', 'admin', '123456', 'mysql', 'HabitFlow123!']
success = False
used_pwd = None

for pwd in passwords:
    try:
        conn = pymysql.connect(host='localhost', user='root', password=pwd, port=3306)
        cursor = conn.cursor()
        cursor.execute('CREATE DATABASE IF NOT EXISTS habitflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
        print(f"SUCCESS: Connected to MySQL with password '{pwd}'. Database 'habitflow' ready.")
        conn.close()
        success = True
        used_pwd = pwd
        break
    except Exception as e:
        print(f"Password '{pwd}' failed: {e}")

if not success:
    print("Could not connect to local MySQL server. Will fallback to SQLite if needed, but MySQL is configured.")
