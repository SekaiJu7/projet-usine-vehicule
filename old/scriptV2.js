

// const PDFdocument = require('pdfkit');
const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./productionDB.sqlite');

// Lire le contenu du fichier HTML
const htmlContent = fs.readFileSync('index.html', 'utf-8');
// Charger la page HTML dans Cheerio
const $ = cheerio.load(htmlContent);

//ordre(1, 5), poste(1,3), vehicule(1,4)
let ordre = 2, poste = 1, vehicule = 2;


    db.serialize(()=>{

        //utilisé 3 fois - Description du véhicule
        db.all('SELECT vehicule_desc FROM vehicule WHERE vehicule_id=' + vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log('Description du véhicule: ', rows[0].vehicule_desc);
                const vehicule_desc1 = $('#vehicule_desc1');
                const vehicule_desc2 = $('#vehicule_desc2');
                const vehicule_desc3 = $('#vehicule_desc3');
                const vehicule_desc4 = $('#vehicule_desc4');
                vehicule_desc1.text(rows[0].vehicule_desc);
                vehicule_desc2.text(rows[0].vehicule_desc);
                vehicule_desc3.text(rows[0].vehicule_desc);
                vehicule_desc4.text(rows[0].vehicule_desc);
                // $('h1').text(newH1);
            }
        });
        //utilisé 3 fois - Decription du poste de travail 
        db.all('SELECT poste_desc FROM poste WHERE poste_id=' + poste, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log('Description du poste de travail: ', rows[0].poste_desc);

                const poste_desc1 = $('#poste_desc1');
                const poste_desc2 = $('#poste_desc2');
                const poste_desc3 = $('#poste_desc3');
                poste_desc1.text(rows[0].poste_desc);
                poste_desc2.text(rows[0].poste_desc);
                poste_desc3.text(rows[0].poste_desc);
            }
        });
        //utilisé 1 fois - Nombre  d'incidents sur le véhicule
        db.all('SELECT COUNT(i.ordre) as NB FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log("Le nombre d'incidents déclarés sur le véhicule "+ vehicule + ": " + rows[0].NB);
                const NBi= $('#NBi');
                NBi.text(rows[0].NB);
            }
        });
        //utilisé 1 fois - tableau des incidents
        db.all('SELECT i.incident_id, i.incident_desc, i.etat FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                // console.log("Résultats de la requête d'incidents : ", rows);
                let incidents = [];
                for (i=0; i<rows.length;i++){
                    // console.log("Tableau des incidents: " + rows[i].incident_id);
                    let data_incident = [];
                    data_incident.push(rows[i].incident_id, rows[i].incident_desc, rows[i].etat);
                    incidents.push(data_incident);
                };
                let incident_table = $('#incident_table');
                incidents.forEach(liste => {
                    text_content = '<tr><td>' + liste[0] + '</td><td>' + liste[1] + '</td><td>' + liste[2] + '</td></tr>';
                    incident_table.append(text_content);
                });
            }
        });
            
    //utilisé 1 fois - Liste des incidents déclarés sur le poste de travail
        db.all('SELECT i.incident_id, i.ordre FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule = v.vehicule_id WHERE o.poste= '+ poste + ' AND v.vehicule_id = ' + vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
            }else{
                console.log("Liste des incidents et ordres de travail pour le poste: ", rows);

                let incidents_poste = [];
                for (i=0; i<rows.length;i++){
                    // console.log("Tableau des incidents: " + rows[i].incident_id);
                    let data_incident_poste = [];
                    data_incident_poste.push(rows[i].incident_id, rows[i].ordre);
                    incidents_poste.push(data_incident_poste);
                };
                const poste_table = $('#poste_table');
                incidents_poste.forEach(liste => {
                  // for (i=0; i<liste.length; i++){
                    text_content_poste = '<tr><td>' + liste[0] + '</td><td>' + liste[1] + '</td></tr>';
                    poste_table.append(text_content_poste);
                });

                const updatedHtml = $.html();
                // Écrivez le HTML mis à jour dans le fichier
                fs.writeFileSync('cheer.html', updatedHtml);

                (async () => {
                    const browser = await puppeteer.launch();
                    const page = await browser.newPage();

                    // Définissez la page de destination (URL ou fichier HTML local)
                    const fileUrl = 'file://' + __dirname + '/cheer.html'; // Utilisez __dirname pour obtenir le chemin absolu

                    // Accédez à la page HTML
                    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

                    // Générez un PDF à partir de la page HTML
                    await page.pdf({ path: 'Rapport véhicule.pdf', format: 'A4' });

                    await browser.close();

                    console.log('Conversion en PDF terminée.');
                    })();
            }
        });


    });
    
    db.close();