const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

// Grazie al lavoro di questi progetti:
// https://github.com/SimoDax/Trenitalia-API/wiki/API-Trenitalia---lefrecce.it
// https://github.com/sabas/trenitalia

class Trenapi {
    constructor(apiUrl) {
        this.cookieJar = new tough.CookieJar();
        this.apiUrl = apiUrl || 'https://www.lefrecce.it/msite/api';
        this.api = axios.create({
            baseURL: this.apiUrl,
            responseType: 'json',
            headers: { 'User-Agent': 'api-trenitalia 2.0' },
            withCredentials: true
        });

        // Supporto per sessioni (molte chiamate non funzionerebbero altrimenti)
        axiosCookieJarSupport(this.api);
        this.api.defaults.jar = new tough.CookieJar();
    }

    /**
     * Funzione di autocompletamento nomi stazioni, torna un array di oggetti contenti id, nome e tag della stazione
     * @param {string} text Testo da cercare 
     */
    async autocomplete(text) {
        try {
            const result = await this.api.get('/geolocations/locations', {
                params: {
                    name: text
                }
            });
            return {
                ok: result && result.data ? true : false,
                data: result ? result.data : null
            };
        } catch {
            return {
                ok: false
            };
        }
    }

    /**
     * Cerca soluzioni di viaggio in ANDATA. Prende questi parametri in input:
     * @param {string} stazionePartenza Il nome della stazione di partenza, come restituito dall'autocompletamento stazione
     * @param {string} stazioneArrivo Il nome della stazione di arrivo
     * @param {string} data Data in formato dd/mm/yyyy
     * @param {string} ora L'ora di partenza in formato hh
     * @param {int} adulti Il numero di passeggeri adulti
     * @param {int} bambini Il numero di passeggeri bambini
     * @param {boolean} soloFrecce Se si vogliono solo soluzioni relative a frecce
     * @param {boolean} soloRegionali Se si vogliono solo soluzioni relative a treni regionali
     * @param {string} codiceCartafreccia Eventuale codice cartafreccia
     */
    async getSolutions(stazionePartenza, stazioneArrivo, data, ora, adulti, bambini, soloFrecce, soloRegionali, codiceCartafreccia) {
        try {
            const result = await this.api.get('/solutions', {
                params: {
                    origin: stazionePartenza,
                    destination: stazioneArrivo,
                    arflag: 'A',
                    adate: data,
                    atime: ora,
                    adultno: adulti,
                    childno: bambini,
                    direction: 'A',
                    frecce: soloFrecce || false,
                    onlyRegional: soloRegionali || false,
                    codeList: codiceCartafreccia || undefined,
                    positions: codiceCartafreccia ? 0 : undefined
                }
            });
            return {
                ok: result && result.data ? true : false,
                data: result ? result.data : null
            };
        } catch (error) {
            return {
                ok: false,
                error: error
            };
        }
    }

    /**
     * Metodo di utility per gestire chiaamte simili alle API dato un ID soluzione
     * @param {string} idSolution 
     * @param {string} type 
     */
    async internalGetSolution(idSolution, type) {
        try {
            const result = await this.api.get(`/solutions/${idSolution}/${type}`);
            return {
                ok: result && result.data ? true : false,
                data: result ? result.data : null
            };
        } catch (error) {
            return {
                ok: false,
                error: error
            };
        }
    }

    /**
     * Dettagli di una soluzione
     * Funziona solo se c'è già una sessione aperta con il sito
     * @param {string} idSolution 
     */
    async getDetails(idSolution) {
        return await this.internalGetSolution(idSolution, "details");
    }

    /**
     * Come getDetails, ma omette stoplist e servicelist
     * Funziona solo se c'è già una sessione aperta con il sito
     * @param {string} idSolution 
     */
    async getInfo(idSolution) {
        return await this.internalGetSolution(idSolution, "info");
    }

    /**
     * Dettaglio prezzi soluzione
     * @param {string} idSolution 
     */
    async getPriceDetails(idSolution) {
        return await this.internalGetSolution(idSolution, "standardoffers");
    }

    /**
     * Come getPriceDetails, ma omette stoplist e servicelist
     * @param {string} idSolution 
     */
    async getCustomizedPriceDetails(idSolution) {
        return await this.internalGetSolution(idSolution, "customizedoffers");
    }
}

module.exports = Trenapi;