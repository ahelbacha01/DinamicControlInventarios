from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyodbc
from typing import List, Dict, Any

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ajustar en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de conexión
def get_db_connection():
    try:
        conn_str = (
            r"DRIVER={SQL Server};"
            r"SERVER=DESKTOP-I70RB61\SQLEXPRESS;"
            r"DATABASE=inv_ad;"
            r"Trusted_Connection=yes;"
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

REPORTES_CONFIG = {
    "variacion": {"sp": "sp_DS_rep_variaciones_Detallado_cencosud", "params": ('0','999999999', 'inv_946',)},
    "detallado": {"sp": "sp_DS_rep_variaciones_grupo_new", "params": ('Final Numero',)},
    "depositosalon": {"sp": "sp_ListarColectadoPorTipo", "params": ('*',)},
    "solodeposito": {"sp": "sp_ListarColectadoPorTipo", "params": ('D',)},
    "solosalon": {"sp": "sp_ListarColectadoPorTipo", "params": ('S',)},
    "noimplantado": {"sp": "sp_DS_rep_no_implantados", "params": None},    
    "inactivas": {"sp": "sp_DS_rep_Referencias_inactivas", "params": None},    
    "sinprecio": {"sp": "sp_DS_rep_SinPrecio", "params": None}
}

@app.get("/api/reporte/{id_reporte}")
def obtener_reporte(id_reporte: str):
    print(f"🔍 Solicitando reporte: {id_reporte}")
    
    config = REPORTES_CONFIG.get(id_reporte)
    if not config:
        return {"error": f"Reporte '{id_reporte}' no configurado en el servidor"}

    conn = get_db_connection()
    if not conn:
        return {"error": "No se pudo conectar a SQL Server. Verifica que el servidor esté accesible."}

    try:
        cursor = conn.cursor()
        sp_name = config["sp"]
        params = config["params"]
        
        print(f"📞 Ejecutando SP: {sp_name}")
        
        # Ejecutar SP
        if params:
            sql = f"SET NOCOUNT ON; EXEC {sp_name} " + ", ".join(["?" for _ in params])
            cursor.execute(sql, params)
        else:
            sql = f"SET NOCOUNT ON; EXEC {sp_name}"
            cursor.execute(sql)

        # Saltar resultados vacíos
        while cursor.description is None:
            if not cursor.nextset():
                break

        if cursor.description is None:
            print(f"⚠️ El SP {sp_name} no retornó datos")
            return []

        # Convertir a JSON
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        print(f"✅ {sp_name} retornó {len(results)} registros")
        return results

    except Exception as e:
        print(f"❌ Error ejecutando {id_reporte}: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Error en base de datos: {str(e)}"}
    finally:
        conn.close()

@app.get("/api/departamentosCencosud")
def obtener_departamentos():
    print("🔍 Solicitando lista de departamentos")
    conn = get_db_connection()
    if not conn:
        return {"error": "No se pudo conectar a SQL Server"}
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT codigo, descripcion FROM tmp_cencosud_departamentos ORDER BY codigo ASC")
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        print(f"✅ Departamentos cargados: {len(results)}")
        return results
    except Exception as e:
        print(f"❌ Error departamentos: {e}")
        return {"error": str(e)}
    finally:
        conn.close()

# --- NUEVAS RUTAS PARA EL DASHBOARD Y CONTROL ---
@app.get("/api/dashboard/colectado/{db}") # <-- Agrega /{db}
def obtener_colectado_dashboard(db: str): # <-- Agrega db: str
    print(f"🔍 Datos de Colectado para DB: {db}")
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    try:
        cursor = conn.cursor()
        # IMPORTANTE: Aquí deberías usar la variable 'db' si el SP la requiere,
        # o asegurar que la conexión se mueva a esa base de datos.
        cursor.execute("EXEC dbo.sp_ReporteColectado") 
        
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/dashboard/resumen/{db}") # <-- Agrega /{db}
def obtener_resumen_inventario(db: str): # <-- Agrega db: str
    print(f"🔍 Resumen para DB: {db}")
    print("🔍 Solicitando resumen de inventario")
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    try:
        cursor = conn.cursor()
        # Query unificado de datos auxiliares
        query = """
            SELECT TOP 1 
                inv_datos_aux.in_n_id as id, 
                inv_datos_aux.nombre_supervisor as supervisor, 
                inv_datos_aux.nombre_operador as operador, 
                inv_datos_aux.cantidad_auditores as cantidad_auditores, 
                inv_datos_aux.inicio_deposito as inicio_deposito, 
                inv_datos_aux.fin_deposito as fin_deposito, 
                inv_datos_aux.inicio_salon as inicio_salon, 
                inv_datos_aux.fin_salon as fin_salon, 
                inv_datos.in_d_dbname as base_datos
            FROM inv_datos_aux, inv_datos 
            WHERE ( inv_datos_aux.in_n_id = inv_datos.in_n_id ) 
            AND ( ( inv_datos.in_d_dbname = (select base_actual from ad_inventario_vigente) ) )
            ORDER BY inv_datos_aux.in_n_id DESC
            
        """
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return results # Retorna lista para que el frontend tome el [0]
    except Exception as e:
        print(f"❌ Error resumen: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Ruta para guardar los datos de la nueva pantalla de funcionalidad
@app.post("/api/dashboard/guardar-control")
async def guardar_datos_control(datos: Dict[Any, Any]):
    print(f"💾 Guardando datos de control: {datos}")
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """
            UPDATE inv_datos_aux 
            SET nombre_supervisor = ?, 
                nombre_operador = ?, 
                cantidad_auditores = ?
            WHERE in_n_id = ?
        """
        cursor.execute(query, (
            datos.get('nombre_supervisor'), 
            datos.get('nombre_operador'), 
            datos.get('cantidad_auditores'),
            datos.get('in_n_id')
        ))
        conn.commit()
        return {"status": "success", "message": "Datos actualizados correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/dashboard/listainventarios")
def obtener_lista_inventarios():
    print("🔍 Consultando lista de inventarios disponibles")
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    try:
        cursor = conn.cursor()
        # Query solicitado para listar los inventarios realizados
        query = """
            SELECT 
                in_n_id,
                in_n_sucursal,
                in_d_dbname,
                convert(varchar, in_f_alta, 103) as fecha_alta,
                'Suc: ' + cast(in_n_sucursal as varchar) + ' - Id: ' + cast(in_n_id as varchar) + ' - ' + cliente as inventario,
                cliente
            FROM inv_datos
            ORDER BY in_f_alta DESC, in_n_id DESC
        """
        cursor.execute(query)
        
        # Obtenemos los nombres de las columnas
        columns = [column[0] for column in cursor.description]
        # Convertimos cada fila en un diccionario
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return results
        
    except Exception as e:
        print(f"❌ Error al obtener lista de inventarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()



@app.post("/api/inventarios/seleccionar")
async def seleccionar_inventario_vigente(data: dict):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    try:
        cursor = conn.cursor()
        # 1. Limpiamos la tabla
        cursor.execute("DELETE FROM ad_inventario_vigente")
        
        # 2. Insertamos con los nombres de columna correctos según tu esquema
        query = """
            INSERT INTO ad_inventario_vigente 
            (base_actual, cliente, inventarioid, sucursalid)
            VALUES (?, ?, ?, ?)
        """
        
        # Mapeamos los datos que vienen del frontend a las columnas de la BD
        cursor.execute(query, (
            data.get('base_actual'), 
            data.get('cliente'), 
            int(data.get('inventarioid')), # Aseguramos que sea entero
            int(data.get('sucursalid'))    # Aseguramos que sea entero
        ))
        
        conn.commit()
        return {"status": "success"}
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error SQL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# Modelo de datos para la solicitud
class NuevoInventario(BaseModel):
    nombre_inventario: str
    sucursal: str
    cliente: str
    encargado: str
    cantidad_auditores: int
    inicio_deposito: str
    fin_deposito: str
    inicio_salon: str
    fin_salon: str



@app.post("/api/inventarios/crear")
async def crear_nuevo_inventario(data: NuevoInventario):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    conn.autocommit = True

    try:
        cursor = conn.cursor()

        # --- PARTE 1: Ejecución del SP ---
        sql_sp = """
            SET NOCOUNT ON;
            DECLARE @base_out varchar(20);
            DECLARE @numero_out numeric(10);

            EXEC [dbo].[sp_inicializa]
                @base = @base_out OUTPUT,
                @nombreinventario = ?,
                @sucursal = ?,
                @cliente = ?,
                @Numero = @numero_out OUTPUT;

            SELECT @base_out as nombre_base, @numero_out as id_generado;
        """
        params_sp = (data.nombre_inventario, data.sucursal, data.cliente)
        cursor.execute(sql_sp, params_sp)

        while cursor.description is None:
            if not cursor.nextset(): break

        resultado = cursor.fetchone()
        if not resultado:
             raise HTTPException(status_code=500, detail="El SP no devolvió resultados.")

        nombre_base = resultado[0]
        inventario_id = int(resultado[1])

        # --- PARTE 2: Inserción en inv_datos_aux ---
        while cursor.nextset(): pass

        sql_insert = """
            INSERT INTO [inv_ad].[dbo].[inv_datos_aux]
                ([in_n_id], [nombre_supervisor], [nombre_operador], [cantidad_auditores],
                 [inicio_deposito], [fin_deposito], [inicio_salon], [fin_salon])
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        params_insert = (
            inventario_id, data.encargado, data.encargado, data.cantidad_auditores,
            data.inicio_deposito, data.fin_deposito, data.inicio_salon, data.fin_salon
        )
        cursor.execute(sql_insert, params_insert)

        cursor.execute("DELETE FROM ad_inventario_vigente")
        
        # 2. Insertamos con los nombres de columna correctos según tu esquema
        query = """
            INSERT INTO ad_inventario_vigente 
            (base_actual, cliente, inventarioid, sucursalid)
            VALUES (?, ?, ?, ?)
        """
        
        # Mapeamos los datos que vienen del frontend a las columnas de la BD
        cursor.execute(query, (
            nombre_base, 
            data.cliente, 
            inventario_id, # Aseguramos que sea entero
            data.sucursal)    # Aseguramos que sea entero
        )
        
        conn.commit()


        return {
            "status": "success",
            "message": "Inventario creado y seleccionado como vigente",
            "datos": {
                "base_datos": nombre_base,
                "inventario_id": inventario_id
            }
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()





@app.post("/api/inventarios/procesar-archivo-maestro/{db_name}/{inventario_id}")
async def procesar_archivo_maestro(db_name: str, inventario_id: int, file: UploadFile = File(...)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a SQL Server")
    try:
        # 1. Crear el cursor PRIMERO
        cursor = conn.cursor()
        # 2. Leer y parsear el archivo
        content = await file.read()
        # Intentar decodificar con latin-1 si utf-8 falla (común en archivos .out viejos)
        try:
            lines = content.decode('utf-8').splitlines()
            sucursalid = file.filename[0:4]
        except UnicodeDecodeError:
            lines = content.decode('latin-1').splitlines()
        productos_para_insertar = []
        # Diccionario para evitar duplicados por EAN antes de la inserción
        vistos = {}
        for line in lines:
            if len(line) < 40: continue 
            
            ean = line[0:13].strip()
            nombre = line[13:32].strip()
            
            try:
                # Lógica SUBSTRING(campo01, 42, 10) / 100
                valor_str = line[41:51].strip()
                campo7 = float(valor_str) / 100 if valor_str else 0.0
            except:
                campo7 = 0.0
            
            # Evitar duplicados en memoria
            if ean and ean not in vistos:
                vistos[ean] = (ean, nombre, campo7, str(inventario_id), 'UNI', '0006')

        productos_unicos = list(vistos.values())

        if not productos_unicos:
            raise HTTPException(status_code=400, detail="El archivo no contiene productos válidos")

        # 3. Limpiar y Cargar en la base de datos específica del inventario
        cursor.execute(f"USE [{db_name}]")
        cursor.execute("DELETE FROM productos")
        
        sql_ins = "INSERT INTO productos (ean, nombre, campo7, inv_id, tipo_venta, campo6) VALUES (?,?,?,?,?,?)"
        cursor.fast_executemany = True
        cursor.executemany(sql_ins, productos_unicos)

        # 4. Sincronizar con la base MAESTRA (inv_ad)
        cursor.execute("USE [inv_ad]")
        cursor.execute("DELETE FROM productos")
        cursor.execute("DELETE FROM tmp_productos")
        
        # Insertar en tablas maestras
        cursor.executemany("INSERT INTO productos (ean, nombre, campo7, inv_id, tipo_venta, campo6) VALUES (?,?,?,?,?,?)", productos_unicos)
        cursor.executemany("INSERT INTO tmp_productos (ean, nombre, campo7, inv_id, tipo_venta, campo6) VALUES (?,?,?,?,?,?)", productos_unicos)

        # 5. Actualizar estados y limpiar tablas temporales
        cursor.execute("UPDATE inv_datos SET en_uso = 0")
        cursor.execute("UPDATE inv_datos SET en_uso = 1, in_n_sucursal = ? WHERE in_n_id = ?", (sucursalid, inventario_id ))
        
        # Estas tablas suelen usarse para reportes de variacion "frizados"
        cursor.execute("IF OBJECT_ID('tmp_final_numero_grupo', 'U') IS NOT NULL TRUNCATE TABLE tmp_final_numero_grupo")
        cursor.execute("IF OBJECT_ID('tmp_primer_numero_grupo', 'U') IS NOT NULL TRUNCATE TABLE tmp_primer_numero_grupo")

        conn.commit()
        return {
            "status": "success", 
            "message": f"Proceso finalizado con éxito. {len(productos_unicos)} productos únicos cargados."
        }

    except Exception as e:
        if conn: conn.rollback()
        print(f"❌ Error procesando archivo: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    finally:
        if conn: conn.close()


@app.post("/api/inventarios/procesar-archivo-sto/{db_name}/{inventario_id}")
async def procesar_archivo_sto(db_name: str, inventario_id: int, file: UploadFile = File(...)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a SQL Server")
    try:
        cursor = conn.cursor()
        content = await file.read()
        try:
            lines = content.decode('utf-8').splitlines()
            sucursalid = file.filename[0:3]  # STO usa 3 caracteres de sucursal
        except UnicodeDecodeError:
            lines = content.decode('latin-1').splitlines()

        registros_para_insertar = []
        vistos = {}

        for line in lines:
            if len(line) < 50: 
                continue

            sector   = line[0:1].strip()
            seccion  = line[1:2].strip()
            ean      = line[2:15].strip()
            nombre   = line[15:34].strip()
            costo    = line[35:47].strip()
            cantidad = line[47:56].strip()

            try:
                costo_val = float(costo) if costo else 0.0
                cantidad_val = float(cantidad) / 100 if cantidad else 0.0
            except:
                costo_val, cantidad_val = 0.0, 0.0

            if ean and (ean not in vistos):
                vistos[ean] = (sucursalid, sector, seccion, ean, nombre, costo_val, cantidad_val, file.filename)

        registros_unicos = list(vistos.values())

        if not registros_unicos:
            raise HTTPException(status_code=400, detail="El archivo STO no contiene registros válidos")

        # 1. Limpiar tabla destino
        cursor.execute(f"USE [{db_name}]")
        cursor.execute("DELETE FROM STKCOMPARA")

        # 2. Insertar registros
        sql_ins = """
        INSERT INTO STKCOMPARA
        (sucursal, sector, seccion, ean, nombre, costo, cantidad, archivo, fecha_alta, terminal_alta)
        VALUES (?,?,?,?,?,?,?,?,GETDATE(),HOST_NAME())
        """
        cursor.fast_executemany = True
        cursor.executemany(sql_ins, registros_unicos)

        # 3. Ajustar cantidad /100 (ya lo hicimos al parsear, pero se mantiene la lógica)
        cursor.execute("UPDATE STKCOMPARA SET cantidad = cantidad / 100")

        # 4. Validaciones contra productos
        cursor.execute("SELECT COUNT(*) FROM STKCOMPARA")
        llCantSTO = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM productos")
        llCantMaestro = cursor.fetchone()[0]

        if llCantSTO == 0:
            raise HTTPException(status_code=400, detail="El archivo STO no cargó registros")

        # 5. Comparaciones y mensajes de diferencia
        diferencia = abs(llCantMaestro - llCantSTO)
        if diferencia > 0:
            porc_dif = round((diferencia / max(llCantSTO, llCantMaestro)) * 100, 3)
            # Aquí podrías loguear o devolver el mensaje como parte de la respuesta
            mensaje = f"Diferencia detectada: STO={llCantSTO}, Maestro={llCantMaestro}, Δ={diferencia} ({porc_dif}%)"
            print(mensaje)

        conn.commit()
        return {
            "status": "success",
            "message": f"Proceso STO finalizado. {len(registros_unicos)} registros únicos cargados.",
            "comparacion": {
                "cant_sto": llCantSTO,
                "cant_maestro": llCantMaestro,
                "diferencia": diferencia
            }
        }

    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    finally:
        if conn: conn.close()
















