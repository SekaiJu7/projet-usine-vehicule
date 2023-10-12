//incorpore les éléments de la BDD dans les tag html avant de convertir le doc html finalisé en pdf 
// const style = document.createElement('style');
// style.innerHTML = `
//       h1 {
//         color: blueviolet;
//       }
//     `;
// document.head.appendChild(style);

// const btnSoumettre = document.getElementById('btn');
// console.log(btnSoumettre)

const PDFdocument = require('pdfkit');

const fs = require('fs');
const htmlToText = require('html-to-text');
const { parse } = require('node-html-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./productionDB.sqlite');

//ordre(1, 5), poste(1,3), vehicule(1,4)
let ordre = 2, poste = 1, vehicule = 2;
db.serialize(()=>{
    //utilisé 3 fois - Description du véhicule
    db.all('SELECT vehicule_desc FROM vehicule WHERE vehicule_id=' + vehicule, (err, rows) => {
        if (err){
            console.error(err.message);
        }else{
            console.log('Description du véhicule: ', rows[0].vehicule_desc);
        }
    });
    //utilisé 3 fois - Decription du poste de travail 
    db.all('SELECT poste_desc FROM poste WHERE poste_id=' + poste, (err, rows) => {
        if (err){
            console.error(err.message);
        }else{
            console.log('Description du poste de travail: ', rows[0].poste_desc);
        }
    });
    //utilisé 1 fois - Liste d'incidents sur le véhicule
    db.all('SELECT COUNT(i.ordre) as NB FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
        if (err){
            console.error(err.message);
        }else{
            // console.log('Résultats de la requête de jointure : ', rows);
            for (i=0; i<rows.length;i++){
                console.log("Le nombre d'incidents déclarés sur le véhicule "+ vehicule + ": " + rows[i].NB);
            };
        }
    });
    //utilisé 1 fois - tableau des incidents
    db.all('SELECT i.incident_id, i.incident_desc, i.etat FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
        if (err){
            console.error(err.message);
        }else{
            console.log("Résultats de la requête d'incidents : ", rows);
            // for (i=0; i<rows.length;i++){
            //     console.log("Tableau des incidents: " + rows[i]);
            // };
        }
    });
   //utilisé 1 fois - Liste des incidents déclarés sur le poste de travail
    db.all('SELECT i.incident_id, i.ordre FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id  WHERE o.poste= '+ poste, (err, rows) => {
        if (err){
            console.error(err.message);
        }else{
            console.log("Liste des incidents et ordres de travail pour le poste: ", rows);
            // for (i=0; i<rows.length;i++){
            //     console.log("Tableau des incidents: " + rows[i]);
            // };
        }
    });
});

db.close();

// btnSoumettre.addEventListener('click', ()=>{
//     // en gros là on aurait une requête tenant compte des critères renseignés avant de soumettre
//     console.log('test');
// });

// 1 véhicule par ordre et plusieurs incidents par vehicule, donc un ordre peut avoir plusieurs incidents

const doc = new PDFdocument();
const outputStream = fs.createWriteStream('document.pdf');

doc.pipe(outputStream);

const templateHTML = fs.readFileSync('htmlTemplate.html', 'utf-8');

const dataFromDatabase = {
    nom: 'Header généré via JS et pdfkit'
};

const root = parse(templateHTML);
const plainTextHTML = root.text;

// const plainTextHTML = htmlToText.fromString(templateHTML, {
//   wordwrap: 130, // Largeur de la ligne de texte (ajustez selon vos besoins)
//   ignoreHref: true, // Ignorer les liens HTML
//   ignoreImage: true, // Ignorer les images HTML
// });


const modifiedHTML = plainTextHTML.replace('{{nomHeader}}', dataFromDatabase.nom);
// const cleanedHTML = modifiedHTML.replace(/<!DOCTYPE[^>]*>/g, '').replace(/\n/g, '');

doc.text(modifiedHTML, 50, 50);
doc.end();

console.log('Le document a été généré avec succès');
