//Imports
const express = require('express'); // Web Framework
const sqlite3 = require("sqlite3");
// const requete = require('./db.js');
const bodyParser = require('body-parser');
//const db = require('./db.js');

//Instanciation du serveur
const server = express();
// server.use(bodyParser.json())
// server.use(bodyParser.urlencoded({ extended: true }));
// server.use(express.json());
// server.use(express.urlencoded());

// Connexion à la base de donnée SQlite
const db = new sqlite3.Database('productionDB.sqlite', err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données");
});

//Configuration des routes
server.get('/', function (req,res) {
    //res.setHeader('Content-Type', 'text/html');
    res.send("Bonjour le monde...");
    //res.status(200).send('<h1>Bonjour sur mon serveur</h1>');
});

server.post('/submit', function (req, res) {
    const vehicule = req.body.vehicule;
    const poste = req.body.poste;
    const ordre = req.body.ordre;
    console.log(vehicule, poste, ordre);
    res.send('Formulaire soumis avec succès');
});

//Launch server
server.listen(3000, function() {
    console.log('Serveur en écoute');
});