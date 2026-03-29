const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "sql10.freesqldatabase.com",
  user: "sql10821498",
  password: "mx6YJPM5jB",
  database: "sql10821498"
});

db.connect(err => {
  if (err) throw err;
  console.log("Conectado a MySQL");
});


// ================= CLIENTES =================
app.get("/clientes",(req,res)=>{
  db.query("SELECT * FROM Clientes",(e,r)=>res.json(r));
});

app.post("/clientes",(req,res)=>{
  const {nombre, correo, telefono} = req.body;

  db.query(
    "INSERT INTO Clientes (nombre, correo, telefono) VALUES (?,?,?)",
    [nombre, correo, telefono],
    (e,r)=>res.json({id:r.insertId})
  );
});

app.delete("/clientes/:id",(req,res)=>{
  db.query("DELETE FROM Clientes WHERE id_cliente=?",[req.params.id],()=>res.json({ok:true}));
});


// ================= PRODUCTOS =================
app.get("/productos",(req,res)=>{
  db.query("SELECT * FROM Productos",(e,r)=>res.json(r));
});


// ================= RUTAS =================
app.get("/rutas",(req,res)=>{
  db.query("SELECT * FROM Rutas",(e,r)=>res.json(r));
});


// ================= PEDIDOS =================
app.get("/pedidos",(req,res)=>{
  db.query(`
    SELECT p.*, c.nombre cliente
    FROM Pedidos p
    LEFT JOIN Clientes c ON c.id_cliente=p.id_cliente
    ORDER BY p.id_pedido DESC
  `,(e,r)=>res.json(r));
});


app.post("/pedidos",(req,res)=>{

  // 🔴 AQUÍ estaba tu error si esto faltaba
  const {id_cliente, id_producto, id_ruta} = req.body;

  if(!id_cliente || !id_producto || !id_ruta){
    return res.status(400).json({error:"Datos incompletos"});
  }

  const fecha = new Date();
  const estado = "Pendiente";
  const cantidad = 1;

  // PRODUCTO
  db.query(
    "SELECT nombre FROM Productos WHERE id_producto=?",
    [id_producto],
    (e,prod)=>{

      if(e || prod.length === 0){
        return res.status(400).json({error:"Producto no válido"});
      }

      const producto = prod[0].nombre;

      // RUTA
      db.query(
        "SELECT * FROM Rutas WHERE id_ruta=?",
        [id_ruta],
        (e2,ruta)=>{

          if(e2 || ruta.length === 0){
            return res.status(400).json({error:"Ruta no válida"});
          }

          const origen = ruta[0].origen;
          const destino = ruta[0].destino;

          // TRANSPORTISTA ALEATORIO
          db.query(
            "SELECT id_transportista FROM Transportistas ORDER BY RAND() LIMIT 1",
            (e3,t)=>{

              const id_transportista = t[0].id_transportista;

              // INSERT PEDIDO
              db.query(`
                INSERT INTO Pedidos
                (id_cliente,id_transportista,id_ruta,fecha,origen,destino,producto,estado)
                VALUES (?,?,?,?,?,?,?,?)
              `,
              [id_cliente,id_transportista,id_ruta,fecha,origen,destino,producto,estado],
              (err,result)=>{

                const id_pedido = result.insertId;

                // DETALLE
                db.query(`
                  INSERT INTO Detalle_Pedido (id_pedido,id_producto,cantidad)
                  VALUES (?,?,?)
                `,
                [id_pedido,id_producto,cantidad]);

                // ESTADO ENVÍO
                db.query(`
                  INSERT INTO Estados_Envio (id_pedido,estado,fecha_actualizacion)
                  VALUES (?,?,?)
                `,
                [id_pedido,estado,fecha]);

                res.json({ok:true});
              });

            });
        });
    });
});


// ACTUALIZAR ESTADO
app.put("/pedidos/:id",(req,res)=>{
  const {estado} = req.body;

  db.query(
    "UPDATE Pedidos SET estado=? WHERE id_pedido=?",
    [estado,req.params.id],
    ()=>{

      // historial también
      db.query(`
        INSERT INTO Estados_Envio (id_pedido,estado,fecha_actualizacion)
        VALUES (?,?,NOW())
      `,[req.params.id,estado]);

      res.json({ok:true});
    }
  );
});


// ELIMINAR
app.delete("/pedidos/:id",(req,res)=>{
  db.query("DELETE FROM Pedidos WHERE id_pedido=?",[req.params.id],()=>res.json({ok:true}));
});


// ================= ADMIN =================
app.get("/admin",(req,res)=>{

  const data = {};

  db.query("SELECT COUNT(*) total FROM Clientes",(e,r)=>{
    data.clientes = r[0].total;

    db.query("SELECT COUNT(*) total FROM Pedidos",(e2,r2)=>{
      data.pedidos = r2[0].total;

      db.query("SELECT COUNT(*) total FROM Pedidos WHERE estado='Pendiente'",(e3,r3)=>{
        data.pendientes = r3[0].total;

        db.query("SELECT * FROM Pedidos",(e4,r4)=>{
          data.detalle = r4;
          res.json(data);
        });

      });
    });
  });

});

app.listen(3000, ()=>console.log("Servidor en http://localhost:3000"));