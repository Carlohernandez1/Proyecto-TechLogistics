# 🚚 TechLogistics S.A. – Sistema de Gestión de Pedidos y Envíos

## 📌 Descripción
Sistema desarrollado para la gestión de pedidos, productos, clientes y seguimiento de envíos. Implementa una arquitectura cliente-servidor utilizando **Node.js + Express** y base de datos **MySQL**.

---

## 🗄️ Base de Datos

🔗 Acceso web a la estructura:
https://www.phpmyadmin.co/db_structure.php?server=1&db=sql10821498

### 🔐 Datos de conexión
- **Servidor:** sql10.freesqldatabase.com  
- **Usuario:** sql10821498  
- **Contraseña:** mx6YJPM5jB  
- **Base de datos:** sql10821498  

### 📊 Tablas principales
- clientes  
- pedidos  
- productos  
- detalle_pedido  
- transportistas  
- rutas  
- estados_envio  

---

## ⚙️ Ejecución del Proyecto (Backend) INDEX.JS

const db = mysql.createConnection({
  host: "sql10.freesqldatabase.com",
  user: "sql10821498",
  password: "mx6YJPM5jB",
  database: "sql10821498"
}); 

## 🌐 Uso del Sistema
Iniciar el servidor con Node.js
Consumir los endpoints desde navegador o herramienta como Postman
Verificar los registros directamente en la base de datos web

## 🔎 Endpoints principales
GET /pedidos → Lista de pedidos
POST /pedidos → Crear pedido
GET /pedidos/:id → Consulta por ID
