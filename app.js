import express from "express";
import jwt from "jsonwebtoken";
import mysql from "mysql2";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const port = 2659;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Agregar el uso de cookieParser
app.use(cors());

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Losmenores9724@",
  database: "login",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Conectado a la base de datos MySQL");
});

app.get("/api", (req, res) => {
  res.send("esta ingresando a la base ");
});

// Endpoint para el inicio de sesión
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === undefined || password === undefined) {
    console.log("aqui entra");
    return res.send({
      mensaje: "debe completar los campos",
    });
  }
  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) {
        res.sendStatus(500); // Error interno del servidor
      } else {
        if (result.length > 0) {
          const user = {
            id: result[0].id,
            username: result[0].username,
          };

          jwt.sign(
            { user },
            "secretkey",
            { expiresIn: "120s" },
            (error, token) => {
              res.cookie("token", token, { httpOnly: true, maxAge: 120000 }); // Almacena el token en la cookie
              res.json({ token });
            }
          );
        } else {
          res.status(401).send({
            mensaje: "usuario o contraseña invalidos",
          });
        }
      }
    }
  );
});

// Endpoint para registrar
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ mensaje: "Debe completar todos los campos" });
  }

  // aqui verificamos que el username no este registrado en la bd
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({ mensaje: "Error al buscar el nombre de usuario" });
      } else if (results.length > 0) {
        res.status(409).json({ mensaje: "Nombre de usuario ya está en uso" });
      } else {
        // El nombre de usuario no está en uso, procede con la inserción
        db.query(
          "INSERT INTO users (username, password) VALUES (?, ?)",
          [username, password],
          (err, result) => {
            if (err) {
              res.status(500).json({ mensaje: "Error al registrar usuario" });
            } else {
              res
                .status(201)
                .json({ mensaje: "Usuario registrado correctamente" });
            }
          }
        );
      }
    }
  );
});

// Endpoint para obtener todos los usuarios
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) {
      res.status(500).json({ mensaje: "Error al obtener usuarios" });
    } else {
      res.status(200).json(result);
    }
  });
});

// Endpoint para obtener un usuario por ID
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;

  db.query("SELECT * FROM users WHERE id = ?", userId, (err, result) => {
    if (err) {
      res.status(500).json({ mensaje: "Error al obtener el usuario" });
    } else {
      if (result.length > 0) {
        res.status(200).json(result[0]); // Devuelve el usuario encontrado
      } else {
        res.status(404).json({ mensaje: "Usuario no encontrado" });
      }
    }
  });
});

// Eliminar usuario por ID
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", userId, (err, result) => {
    if (err) {
      res.status(500).json({ mensaje: "Error al eliminar el usuario" });
    } else {
      if (result.affectedRows > 0) {
        res.status(200).json({ mensaje: "Usuario eliminado correctamente" });
      } else {
        res.status(404).json({ mensaje: "Usuario no encontrado" });
      }
    }
  });
});

// Ruta protegida
app.post("/api/protected", verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (error, authData) => {
    if (error) {
      res.sendStatus(403);
    } else {
      res.json({
        message: "Ruta protegida",
      });
    }
  });
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization']
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`);
});