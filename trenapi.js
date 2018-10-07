var rp = require('request-promise');

// Grazie al lavoro di questi progetti:
// https://github.com/SimoDax/Trenitalia-API/wiki/API-Trenitalia---lefrecce.it
// https://github.com/sabas/trenitalia

class Trenapi {
    constructor(apiUrl) {
        this.apiUrl = apiUrl || "https://www.lefrecce.it/msite/api/";
    }

    // Funzione di autocompletamento, utile per form (ad esempio con select2)
    autocomplete(text) {
        let url = this.apiUrl + "geolocations/locations";
        let qs = {
            name: text
        };
        let options = {
            uri: url,
            qs
        }

        return rp(options)
            .then(body => {
                return JSON.parse(body);
            })
            .catch(err => {
                return null;
            });
    }

    /*
        Cerca soluzioni di viaggio in ANDATA. Prende questi parametri in input:
            <partenza>: Il nome della stazione di partenza, come restituito dall'autocompletamento stazione
            <arrivo>: Il nome della stazione di arrivo
            <data>: Data in formato dd/mm/yyyy
            <ora>: L'ora di partenza in formato hh
            <adulti>: Il numero di passeggeri adulti
            <bambini>: Il numero di passeggeri bambini
    */
    getSolutions(partenza, arrivo, data, ora, adulti, bambini) {
        let url = this.apiUrl + "solutions";
        let AR = "A";
        let DIREZIONE = "A";
        let FRECCE = "false";
        let REGIONALI = "false";
        let DATARITORNO = "";
        let ORARITORNO = "";
        let CODICE_CARTAFRECCIA = "";

        let options = {
            uri: url,
            qs: {
                origin: partenza,
                destination: arrivo,
                arflag: AR,
                adate: data,
                atime: ora,
                adultno: adulti,
                childno: bambini,
                direction: DIREZIONE,
                frecce: FRECCE,
                onlyRegional: REGIONALI,
                // rdate: DATARITORNO,
                // rtime: ORARITORNO,
                // codeList: CODICE_CARTAFRECCIA
            }
        };

        return rp(options)
            .then(body => {
                return JSON.parse(body);
            })
            .catch(err => {
                return null;
            });
    }

    internalGetSolution(idSolution, type) {
        let url = `${this.apiUrl}/solutions/${idSolution}/${type}`;
        let options = {
            uri: url
        }
        return rp(options)
            .then(data => {
                return data;
            })
            .catch(err => {
                console.log(err);
                return null;
            });
    }

    // Dettagli di una soluzione
    //https://www.lefrecce.it/msite/api/solutions/[IDSOLUTION]/details
    // Funziona solo se c'è già una sessione aperta con il sito
    getDetails(idSolution) {
        return this.internalGetSolution(idSolution, "details");
    }

    // Come getDetails, ma omette stoplist e servicelist
    // Funziona solo se c'è già una sessione aperta con il sito
    getInfo(idSolution) {
        return this.internalGetSolution(idSolution, "info");
    }

    // https://www.lefrecce.it/msite/api/solutions/[IDSOLUTION]/standardoffers
    // Dettaglio prezzi soluzione
    getPriceDetails(idSolution) {
        return this.internalGetSolution(idSolution, "standardoffers");
    }

    // https://www.lefrecce.it/msite/api/solutions/[IDSOLUTION]/standardoffers
    // Dettaglio prezzi soluzione, ma omette stoplist e servicelist
    getCustomizedPriceDetails(idSolution) {
        return this.internalGetSolution(idSolution, "customizedoffers");
    }
}

module.exports = Trenapi;