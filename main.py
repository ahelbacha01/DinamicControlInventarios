from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pyodbc

app = FastAPI()

# Configuración de CORS para que Vue pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de conexión a SQL Server
def get_db_connection():
    try:
        conn_str = (
            r"DRIVER={SQL Server};"
            r"SERVER=DESKTOP-I70RB61\SQLEXPRESS;"
            r"DATABASE=inv_ad;"
            r"Trusted_Connection=yes;"
        )
        print(f"Intentando conectar a SQL 2008 R2...")
        return pyodbc.connect(conn_str)
    except Exception as e:
        print(f"❌ Error específico de SQL Server: {e}")
        return None




@app.get("/api/reporte/{nombre_reporte}")
def leer_reporte_variable(nombre_reporte: str):
    # Aquí haces el mapeo: 
    # si nombre_reporte == 'variacion' -> EXEC sp_variaciones...
    # si nombre_reporte == 'detallado' -> EXEC sp_detallado...


@app.get("/api/reporte-colectado")
def leer_reporte():
    conn = get_db_connection()
    if not conn:
        return {"error": "Error de conexión a la base de datos"}
        
    try:
        cursor = conn.cursor()
        sql = "{CALL sp_DS_rep_variaciones_grupo_new (?)}"
        params = ('Final Numero',)
        cursor.execute(sql, params)

        # Avanzar hasta encontrar un recordset con columnas
        while cursor.description is None and cursor.nextset():
            pass

        if cursor.description is None:
            return {"mensaje": "El procedimiento no devolvió resultados"}

        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        print (results)
       
        return results

    except Exception as e:
        print(f"❌ Error al ejecutar el SP: {e}")
        return {"error": str(e)}
    finally:
        conn.close()
