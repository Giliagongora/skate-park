const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const expressFileUpload = require("express-fileupload");
const exphbs = require("express-handlebars");
const fs = require("fs");
const { Pool } = require("pg");
const fileUpload = require("express-fileupload");
const axios = require("axios");


const app = express();
app.use(express.json());
app.use(cors());
app.set("view engine", "handlebars"); // instanciar handlebars
// const expressFileUpload = require('express-fileupload');
app.use(express.static(__dirname + "/public")); // express.static() indica al servidor que sirva los archivos estáticos - __dirname + "/public" indica que los archivos estáticos se encuentran
app.use(express.urlencoded({ extended: true })); // express.urlencoded() se utiliza para analizar y decodificar estos datos, y luego hacerlos accesibles en el objeto req.body - extended: false indica que no se deben permitir objetos anidados en los datos del formulario
// app.use(express.static(__dirname + "/public"));
app.use(
  expressFileUpload({
    limits: 50000,
    abortOnLimit: true, //
    responseOnLimit: "EL tamaño excede el limite permitido",
  })
);

app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

const PORT = 3000;
app.set("view engine", "handlebars");
app.engine(
  //Configurar el motor de plantilla
  "handlebars",
  exphbs.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/mainLayout",
  })
);

// app.get("/", (req, res) => {
//   res.render("main");
// });
app.use(express.static(__dirname + "/public"));

const pool = new Pool({
  user: "postgres",
  hots: "localhost",
  password: "gongora",
  database: "skatepark",
  port: 5432,
});

// console.log(pool);

const secretKey = "secret";

// Ruta asociada a hbs
app.get("/", async (req, res) => {
  try {
    const resultado = await mostrarUsuarios();
    console.log('resultadoresultado :::: ' , resultado);
    res.render(
      "Home",
      { skaters:resultado },
      console.log('resultados :::::::::::::', resultado)
    );
    // res.render("Home", { skaters: resultados });
    // llamar funcion bbdd que devuelva en un arreglo
  } catch (error) {
    res.status(505).send({
      error: `Error : ${error}`,
      code: 500,
    });
  }
});

app.get("/login", (req, res) => {
  try {
    res.render("Login");
  } catch (error) {
    res.status(505).send({
      error: `Error : ${error}`,
      code: 500,
    });
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const skater = skaters.find(
      (s) => s.email == email && s.password == password
    );

    const token = jwt.sign(skater, secretKey);
    res.status(200).send(token);
  } catch (e) {
    console.log(e);
    res.status(500).send({
      error: `Algo salió mal... ${e}`,
      code: 500,
    });
  }
});

app.get("/perfil", (req, res) => {
  const { token } = req.query;
  jwt.verify(token, secretKey, (err, skater) => {
    if (err) {
      res.status(500).send({
        error: `Algo salió mal...`,
        message: err.message,
        code: 500,
      });
    } else {
      res.render("Perfil", { skater });
    }
  });
});

app.get("/registro", (req, res) => {
  try {
    res.render("registro");
  } catch (error) {
    res.status(505).send({
      error: `Error : ${error}`,
      code: 500,
    });
  }
});

app.get("/admin", (req, res) => {
  try {
    res.render("admin");
  } catch (error) {
    res.status(505).send({
      error: `Error : ${error}`,
      code: 500,
    });
  }
});

app.get("/perfil", (req, res) => {
  try {
    res.render("perfil");
  } catch (error) {
    res.status(505).send({
      error: `Error : ${error}`,
      code: 500,
    });
  }
});

app.listen(3000, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});

// API REST

app.post("/skaters", async (req, res) => {
  // console.log('resresresres' , res)
  try {
    const usuario = { email, nombre, password, anos_experiencia, especialidad, estado } = req.body;
    // const { files } = req
    const { foto } = req.files;
    const { name } = foto;
    foto.mv(`./public/uploads/${name}`, (err) => {
    res.send("Archivo cargado con éxito");
    });
    console.log('fotofotofoto ' , foto.mv)
  //  });
    // if (foto) {
    //   const { name } = foto;
    //   // urlFoto = `/uploads/${foto}.name`;
    //   const urlFoto = `/uploads/${foto.name}`;

    //   console.log('urlFoto ::::: ' ,urlFoto);
    //   foto.mv(`./public/${urlFoto}`, (err) => {
    //     if (err) {
    //       console.error("Error al mover la foto:", err);
    //       throw err; // Si hay un error, lanzarlo para manejarlo adecuadamente
    //     }
    //     console.log("Archivo cargado con éxito");
    //   });
    // } else {
    //   console.error("La foto no está definida");
    //   // Manejo del error o envío de una respuesta adecuada, por ejemplo:
    //   res.status(400).json({ error: "La foto no está definida en la solicitud" });
    // }

    const resultado = await agregarUsuario(email, nombre, password, anos_experiencia, especialidad, foto.name, estado);
    console.log('resultadoresultado :::: ' , resultado);
  } catch (error) {
    console.log("error", error, error.message);
    res.json({ error: error.message });
  }
});

const agregarUsuario = async (email, nombre, password, anos_experiencia, especialidad, foto, estado, req, res) => {
  const usuario = { email, nombre, password, anos_experiencia, especialidad, foto, estado } ;  
  try {
    const consulta = {
      text: "INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) values ($1, $2, $3, $4, $5, $6, false) RETURNING*",
      values: [
        // id,
        email,
        nombre,
        password,
        anos_experiencia,
        especialidad,
        foto,
        // estado,
      ],
    };

    const resultado = await pool.query(consulta);
    console.log(`Skater ${nombre} agregado con éxito:`, resultado.rows[0]);
  } catch (e) {
    console.log(e);
    // Verificar si res está definido antes de intentar acceder a res.status
    if (res) {
      res.status(500).send({
        error: `Algo salió mal... ${e}`,
        code: 500,
      });
    } else {
      console.error("Res no está definido");
    }
    console.log(e);
    res.status(500).send({
      error: `Algo salió mal... ${e}`,
      code: 500,
    });
  }
};

// para testeo : 
// agregarUsuario("Jane@gmail.com", "jane", "jane", "4", "ux", "1000_F_298873399_sw6t5RIXcq3VxKW80sqd1y6fvi5ViY9R.jpg", false);


app.get("/skaters", async (req, res) => {
  // console.log('resresresres' , req)
  try {
    // const usuario =  {email, nombre, password, anos_experiencia, especialidad, foto, estado} =  req.body;
  // console.log('usuariousuariousuariousuario' , usuario);
    const resultado = await mostrarUsuarios();
    console.log('resultadoresultado :::: ' , resultado);
    // res.render('skaters', { usuarios: resultado.rows });

    return res.status(200).send(resultado);
    res.status(200).json(resultado.rows);
    // res.render('home', { usuarios: resultado.rows });
    
  } catch (error) {
    console.log("error", error, error.message);
    res.json({ error: error.message });
  }
});


const mostrarUsuarios = async (req, res) => {
try {
  const consulta = {
    text: "SELECT * FROM skaters",
    values: []
  }
  const resultado = await pool.query(consulta);
  console.log("Usuarios registrados : ", resultado.rows);
  return resultado.rows;
  console.log('resultadoresultadoresultado' ,resultado)
} catch (error) {
  console.log("error", error, error.message);
  res.json({ error: error.message });
}
}
// const result = await pool.query("SELECT * FROM canciones");
// return result.rows;
// const consulta = {
//   text: "INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) values ($1, $2, $3, $4, $5, $6, false) RETURNING*",
//   values: [
//     // id,
//     email,
//     nombre,
//     password,
//     anos_experiencia,
//     especialidad,
//     foto,
//     // estado,
//   ],
// };



// const resultado = await pool.query(consulta);
// console.log("resultado ::: ", resultado);
// // return resultado;
// console.log(`Skater ${nombre} agregado con éxito:`, res.rows[0]);



// app.put("/skaters", async (req, res) => {
//   const {id, nombre,anos_experiencia, especialidad} = req.body;
//   console.log("Valor del body: ", id, nombre,anos_experiencia, especialidad);
//   try {
//       const skaterB = skaters.findIndex((s) => s.id == id);
// //        if (skaterB) {
//          skaters[skaterB].nombre = nombre;
//          skaters[skaterB].anos_experiencia =anos_experiencia;
//          skaters[skaterB].especialidad = especialidad;
//           res.status(200).send("Datos actualizados con éxito");
//       // } else {
//       //     res.status(400).send("No existe este Skater");
//       // }

//   } catch (e) {
//       res.status(500).send({
//           error: `Algo salió mal... ${e}`,
//           code: 500
//       })
//   };
// });

// app.put("/skaters/status/:id", async (req, res) => {
//   const { id } = req.params;
//   const { estado } = req.body;
//   console.log("Valor de estado recibido por body: ",estado)
//   try {
//        const skaterB = skaters.findIndex((s) => s.id == id);

//       //if (skaterB !== -1) {
//           skaters[skaterB].estado = estado;
//           res.status(200).send("Estado Actualizado con éxito");
//       // } else {
//       //     res.status(400).send("No existe este Skater");
//       // }

//   } catch (e) {
//       res.status(500).send({
//           error: `Algo salió mal... ${e}`,
//           code: 500
//       })
//   };
// });

// app.delete("/skaters/:id", async (req, res) => {
//   const { id } = req.params
//   try {
//       const skaterB = skaters.findIndex((s) => s.id == id);

//       if (skaterB !==-1) {
//           skaters.splice(skaterB, 1);
//           res.status(200).send("Skater Eliminado con éxito");
//       } else {
//           res.status(400).send("No existe este Skater");
//       }

//   } catch (e) {
//       res.status(500).send({
//           error: `Algo salió mal... ${e}`,
//           code: 500
//       })
//   };
// });
