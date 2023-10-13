

// const PDFdocument = require('pdfkit');
const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const express = require('express');
//Instanciation du serveur
const server = express();
server.use(express.json());
server.use(express.urlencoded());

const sqlite3 = require('sqlite3').verbose();

// Lire le contenu du fichier HTML
const htmlContent = fs.readFileSync('index.html', 'utf-8');

//Configuration des routes
server.get('/', (req, res) => {
  res.sendFile(__dirname + '/formulaire.html');
});


server.post('/submit', async function (req, res) {
    const db = new sqlite3.Database('./productionDB.sqlite');
    const vehicule = req.body.vehicule;
    const poste = req.body.poste;
    const ordre = req.body.ordre;
    const $ = cheerio.load(htmlContent);
    console.log(vehicule, poste, ordre);
    res.send('Formulaire soumis avec succès');

    //utilisé 3 fois - Description du véhicule
    await new Promise((resolve, reject) => {
        db.all('SELECT vehicule_desc FROM vehicule WHERE vehicule_id=' + vehicule, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                console.log('Description du véhicule: ', rows[0].vehicule_desc);
                const vehicule_desc1 = $('#vehicule_desc1');
                const vehicule_desc2 = $('#vehicule_desc2');
                const vehicule_desc3 = $('#vehicule_desc3');
                vehicule_desc1.text(rows[0].vehicule_desc);
                vehicule_desc2.text(rows[0].vehicule_desc);
                vehicule_desc3.text(rows[0].vehicule_desc);
                resolve();
            }
        });
    });

    // utilisé 3 fois - Description du poste de travail 
    await new Promise((resolve, reject) => {
        db.all('SELECT poste_desc FROM poste WHERE poste_id=' + poste, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                console.log('Description du poste de travail: ', rows[0].poste_desc);

                const poste_desc1 = $('#poste_desc1');
                const poste_desc2 = $('#poste_desc2');
                poste_desc1.text(rows[0].poste_desc);
                poste_desc2.text(rows[0].poste_desc);
                resolve();
            }
        });
    });

    //utilisé 1 fois - Nombre  d'incidents sur le véhicule
    await new Promise((resolve, reject) => {
        db.all('SELECT COUNT(i.ordre) as NB FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= ' + vehicule, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                console.log("Le nombre d'incidents déclarés sur le véhicule " + vehicule + ": " + rows[0].NB);
                const NBi = $('#NBi');
                NBi.text(rows[0].NB);
                resolve();
            }
        });
    });

    await new Promise((resolve, reject) => {

        db.all('SELECT i.incident_id, i.incident_desc, i.etat FROM incident i INNER JOIN ordre o ON i.ordre = o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id WHERE v.vehicule_id= '+ vehicule, (err, rows) => {
            if (err){
                console.error(err.message);
                reject(err);
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
                resolve();
            }
        });
    });

    //------------------------------------------------------------------------------------------------------------------------------------------------ 

    //Ici on veut la liste des postes ayant travaillé sur un véhicule 
    const postes_par_vehicule = await new Promise((resolve, reject) => {
        db.all('SELECT DISTINCT o.poste FROM ordre o WHERE o.vehicule = ' + vehicule, (err, rows)=>{
            if (err){
                console.log(err.message);
                reject(err);
            }else{
                const postes = rows.map(row => row.poste);
                resolve(postes);
                }
            });
        });

    console.log(postes_par_vehicule)
    //pour chaque poste ayant travaillé sur le véhicule
    for (const posteV of postes_par_vehicule) {
        const incidentsData = await new Promise((resolve, reject) => {
                    //on récupère l'id incident et l'id ordre de travail s'ils existent et que l'ordre de travail concerne un incident
                    db.all('SELECT o.poste, i.incident_id, o.ordre_id, v.vehicule_desc, p.poste_desc FROM incident i INNER JOIN ordre o ON i.ordre=o.ordre_id INNER JOIN vehicule v ON o.vehicule=v.vehicule_id INNER JOIN poste p ON o.poste=p.poste_id WHERE o.poste=' + posteV + ' AND o.vehicule =' + vehicule, (err, rows) => {
                        if (err) {
                            console.log(err.message);
                            reject(err);
                        } else {
                            //si on a un résultat de la base avec le poste étudié, on alimente la section poste avec un h3, p et une table 
                            if (rows.length > 0){
                                let section_poste = $('#section_poste');
                                let h3 = '<h3 style="color: rgb(5, 118, 240);">Poste de travail : <strong class="poste_desc'+posteV+'"></strong></h3>'
                                section_poste.append(h3);
                                let p = '<p>Le tableau ci-dessous montre la liste des incidents déclarés sur le poste de travail <strong class="poste_desc'+posteV+'">poste_desc</strong> pour le véhicule <strong id="vehicule_desc'+vehicule+'"></strong>:</p>'
                                section_poste.append(p);
                                let vehicule_desc = $('#vehicule_desc'+vehicule);
                                vehicule_desc.text(rows[0].vehicule_desc);
                                let poste_desc = $('strong.poste_desc'+posteV);
                                poste_desc.text(rows[0].poste_desc);
                                // poste_desc.append(`${rows[0].poste}`);
                                let tb = '<div id="tables'+posteV+'"></div>'
                                section_poste.append(tb);
                                let poste_tables = $('#tables'+posteV);
                                let text_table_template = '<table id="tableToAppend'+posteV+'"><tr><th style="width: 50%;">ID</th><th style="width: 50%;">OT</th></tr></table><br>';
                                poste_tables.append(text_table_template);
                                console.log('ca passe ici avec le poste: '+posteV, rows);
                                for (i=0;i<rows.length;i++){
                                    console.log('Résultats des incidents pour le poste concernés: ' + rows[i].incident_id + ' et ' + rows[i].ordre_id+ ' et ' + rows[i].vehicule_desc+ ' et ' + rows[i].poste_desc);
                                    let tableToAppend = $('#tableToAppend'+posteV);
                                    text_row = '<tr><td>' +rows[i].incident_id+ '</td><td>'+rows[i].ordre_id+ '</td></tr>';
                                    tableToAppend.append(text_row);
                                }
                                
                            };
                            resolve();
                        }
                    });
        });
    }
    
    
    (async () => {
        const updatedHtml = $.html();
        fs.writeFileSync('cheer.html', updatedHtml);
        const timestamp = Date.now();
        console.log(timestamp)
        // const pdfFileName = `Rapport_vehicule_${timestamp}.pdf`
        const pdfFileName = `Rapport_vehicule.pdf`
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Définissez la page de destination (URL ou fichier HTML local)
        const fileUrl = 'file://' + __dirname + '/cheer.html'; // Utilisez __dirname pour obtenir le chemin absolu

        // Accédez à la page HTML
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });

        // Générez un PDF à partir de la page HTML
        await page.pdf({ path: pdfFileName, format: 'A4', printBackground: true });

        await browser.close();

        console.log('Conversion en PDF terminée.');
        })();

    db.close();
});

//Launch server
server.listen(3000, function() {
    console.log('Serveur en écoute');
});