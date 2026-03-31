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
  database: "sql10821498",
  port: 3306,
  charset: "latin1"
});

db.connect(err => {
  if (err) { console.log("ERROR MYSQL:", err); return; }
  console.log("MySQL conectado");
});


// ===== CLIENTES =====
app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM Clientes", (e, r) => {
    if (e) { console.log(e); return res.status(500).json(e); }
    res.json(r);
  });
});

app.post("/clientes", (req, res) => {
  const { nombre, correo, telefono } = req.body;
  db.query(
    "INSERT INTO Clientes (nombre, correo, telefono) VALUES (?, ?, ?)",
    [nombre, correo, telefono],
    (e, r) => {
      if (e) { console.log(e); return res.status(500).json(e); }
      res.json({ id: r.insertId });
    }
  );
});


// ===== PRODUCTOS =====
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM Productos", (e, r) => {
    if (e) { console.log(e); return res.status(500).json(e); }
    res.json(r);
  });
});


// ===== RUTAS =====
app.get("/rutas", (req, res) => {
  db.query("SELECT * FROM Rutas", (e, r) => {
    if (e) { console.log(e); return res.status(500).json(e); }
    res.json(r);
  });
});


// ===== TRANSPORTISTAS =====
app.get("/transportistas", (req, res) => {
  db.query("SELECT * FROM Transportistas", (e, r) => {
    if (e) { console.log(e); return res.status(500).json(e); }
    res.json(r);
  });
});


// ===== ESTADOS ENVIO =====
app.get("/estados", (req, res) => {
  db.query("SELECT * FROM Estados_Envio", (e, r) => {
    if (e) { console.log(e); return res.status(500).json(e); }
    res.json(r);
  });
});


// ===== CREAR PEDIDO =====
app.post("/pedidos", (req, res) => {
  const { id_cliente, id_producto, id_ruta } = req.body;

  if (!id_cliente || !id_producto || !id_ruta) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const fecha = new Date();
  const estado = "Pendiente";

  db.query(
    "INSERT INTO Pedidos (id_cliente, id_ruta, fecha, estado) VALUES (?, ?, ?, ?)",
    [id_cliente, id_ruta, fecha, estado],
    (err, result) => {
      if (err) { console.log(err); return res.status(500).json(err); }

      const id_pedido = result.insertId;

      db.query(
        "INSERT INTO Detalle_Pedido (id_pedido, id_producto, cantidad) VALUES (?, ?, 1)",
        [id_pedido, id_producto],
        (e2) => {
          if (e2) { console.log(e2); return res.status(500).json(e2); }
          res.json({ ok: true, id_pedido });
        }
      );
    }
  );
});


// ===== ACTUALIZAR ESTADO =====
app.put("/pedidos/:id", (req, res) => {
  const { estado } = req.body;
  db.query(
    "UPDATE Pedidos SET estado = ? WHERE id_pedido = ?",
    [estado, req.params.id],
    (e) => {
      if (e) { console.log(e); return res.status(500).json(e); }
      res.json({ ok: true });
    }
  );
});


// ===== ELIMINAR PEDIDO =====
// Orden obligatorio por foreign keys:
// 1) Estados_Envio  →  2) Detalle_Pedido  →  3) Pedidos
app.delete("/pedidos/:id", (req, res) => {
  const id = req.params.id;

  // Paso 1: borrar de Estados_Envio
  db.query("DELETE FROM Estados_Envio WHERE id_pedido = ?", [id], (e1) => {
    if (e1) {
      console.log("ERROR borrando Estados_Envio:", e1);
      return res.status(500).json({ error: "Error al borrar Estados_Envio", detail: e1 });
    }

    // Paso 2: borrar de Detalle_Pedido
    db.query("DELETE FROM Detalle_Pedido WHERE id_pedido = ?", [id], (e2) => {
      if (e2) {
        console.log("ERROR borrando Detalle_Pedido:", e2);
        return res.status(500).json({ error: "Error al borrar Detalle_Pedido", detail: e2 });
      }

      // Paso 3: borrar el pedido principal
      db.query("DELETE FROM Pedidos WHERE id_pedido = ?", [id], (e3) => {
        if (e3) {
          console.log("ERROR borrando Pedido:", e3);
          return res.status(500).json({ error: "Error al borrar Pedido", detail: e3 });
        }

        res.json({ ok: true });
      });
    });
  });
});


// ===== ADMIN =====
app.get("/admin", (req, res) => {

  const queryDetalle = `
    SELECT
      p.id_pedido,
      p.id_cliente,
      c.nombre   AS cliente,
      c.correo   AS correo,
      c.telefono AS telefono,
      (
        SELECT pr.nombre
        FROM Detalle_Pedido dp
        LEFT JOIN Productos pr ON pr.id_producto = dp.id_producto
        WHERE dp.id_pedido = p.id_pedido
        LIMIT 1
      ) AS producto,
      CONCAT(
        CONVERT(r.origen  USING latin1),
        CONVERT(' - '     USING latin1),
        CONVERT(r.destino USING latin1)
      ) AS ruta,
      p.estado,
      p.fecha
    FROM Pedidos p
    LEFT JOIN Clientes c ON c.id_cliente = p.id_cliente
    LEFT JOIN Rutas    r ON r.id_ruta    = p.id_ruta
    ORDER BY p.id_pedido DESC
  `;

  db.query(queryDetalle, (err, detalle) => {
    if (err) {
      console.log("ERROR detalle admin:", err);
      return res.status(500).json(err);
    }

    db.query("SELECT COUNT(*) AS total FROM Clientes", (e1, resC) => {
      db.query("SELECT COUNT(*) AS total FROM Pedidos", (e2, resP) => {
        db.query("SELECT COUNT(*) AS total FROM Pedidos WHERE estado = 'Pendiente'", (e3, resPen) => {
          db.query("SELECT COUNT(*) AS total FROM Pedidos WHERE estado = 'Entregado'", (e4, resEnt) => {

            res.json({
              clientes:   resC?.[0]?.total   || 0,
              pedidos:    resP?.[0]?.total    || 0,
              pendientes: resPen?.[0]?.total  || 0,
              entregados: resEnt?.[0]?.total  || 0,
              detalle:    detalle || []
            });

          });
        });
      });
    });
  });
});


// ===== SERVER =====
app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});