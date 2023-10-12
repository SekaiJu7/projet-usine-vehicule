
const PDFdocument = require('pdfkit');
const fs = require('fs');
const cheerio = require('cheerio');

// const htmlToText = require('html-to-text');
const { parse } = require('node-html-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./productionDB.sqlite');

// création d'un nouveau document basé sur un template html auquel on ajoutera les données
const doc = new PDFdocument();
const outputStream = fs.createWriteStream('rapport_vehicule.pdf');
doc.pipe(outputStream);
const templateHTML = fs.readFileSync('draft.html', 'utf-8');
const root = parse(templateHTML);
const plainTextHTML = root.text;
let modifiedHTML = plainTextHTML; //afin d'avoir un scope global
console.log(typeof(modifiedHTML));
//ordre(1, 5), poste(1,3), vehicule(1,4)
let ordre = 2, poste = 1, vehicule = 2;


    db.serialize(()=>{

        //utilisé 3 fois - Description du véhicule
        db.all('SELECT vehicule_desc FROM vehicule WHERE vehicule_id=' + vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log('Description du véhicule: ', rows[0].vehicule_desc);
                modifiedHTML = plainTextHTML.replace('{{vehicule_desc1}}', rows[0].vehicule_desc);
                modifiedHTML = modifiedHTML.replace('{{vehicule_desc2}}', rows[0].vehicule_desc);
                modifiedHTML = modifiedHTML.replace('{{vehicule_desc3}}', rows[0].vehicule_desc);
                modifiedHTML = modifiedHTML.replace('{{vehicule_desc4}}', rows[0].vehicule_desc);
            }
        });
        //utilisé 3 fois - Decription du poste de travail 
        db.all('SELECT poste_desc FROM poste WHERE poste_id=' + poste, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log('Description du poste de travail: ', rows[0].poste_desc);
                modifiedHTML = modifiedHTML.replace('{{poste_desc1}}', rows[0].poste_desc);
                modifiedHTML = modifiedHTML.replace('{{poste_desc2}}', rows[0].poste_desc);
                modifiedHTML = modifiedHTML.replace('{{poste_desc3}}', rows[0].poste_desc);
            }
        });
        //utilisé 1 fois - Nombre  d'incidents sur le véhicule
        db.all('SELECT COUNT(i.ordre) as NB FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log("Le nombre d'incidents déclarés sur le véhicule "+ vehicule + ": " + rows[0].NB);
                modifiedHTML = modifiedHTML.replace('{{NBi}}', rows[0].NB);
            }
        });
        //utilisé 1 fois - tableau des incidents
        db.all('SELECT i.incident_id, i.incident_desc, i.etat FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log("Résultats de la requête d'incidents : ", rows);
                let incidents = []
                for (i=0; i<rows.length;i++){
                    // console.log("Tableau des incidents: " + rows[i].incident_id);
                    let data_incident = [];
                    data_incident.push(rows[i].incident_id, rows[i].incident_desc, rows[i].etat);
                    incidents.push(data_incident);
                };
                console.log(incidents);
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
                doc.text(modifiedHTML, 50, 50);
                doc.end();
                console.log('Le document a été généré avec succès');
            }
        });


    });
    
    db.close();

// 1 véhicule par ordre et plusieurs incidents par vehicule, donc un ordre peut avoir plusieurs incidents


// const plainTextHTML = htmlToText.fromString(templateHTML, {
//   wordwrap: 130, // Largeur de la ligne de texte (ajustez selon vos besoins)
//   ignoreHref: true, // Ignorer les liens HTML
//   ignoreImage: true, // Ignorer les images HTML
// });


// const cleanedHTML = modifiedHTML.replace(/<!DOCTYPE[^>]*>/g, '').replace(/\n/g, '');
