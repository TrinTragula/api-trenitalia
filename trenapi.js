const fs = require('fs');
const axios = require('axios');
const qs = require('querystring');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;

// Grazie al lavoro di questi progetti:
// https://github.com/SimoDax/Trenitalia-API/wiki/API-Trenitalia---lefrecce.it
// https://github.com/sabas/trenitalia

const OLD_STATIC_DATA_WARNING = `
The stations static data file ('file/stations.json') is older than 3 months or empty. 
I will download it again to keep it up to date.
This should happen only the first time you use this APIs in your project (and every 3 months after that).
`;

const ERROR_STATIC_DATA_WARNING = `
I couldn't load the stations static data file ('file/stations.json'). 
I will now download it again. Untile the process isn't finished the module may not work as intended.
This should happen only if something went terribly wrong in a previous download.
`;

class Trenapi {
    constructor(apiUrl, viaggiaTrenoApiUrl) {
        this._createApi(apiUrl);
        this._createViaggiaTrenoApi(viaggiaTrenoApiUrl);
        this._handleStaticData();
    }

    _sendError(message, error = null) {
        if (!error) throw message;
        throw `${message} - ${error.message ? error.message : 'Unknown error'}`;
    }

    _createApi(apiUrl) {
        // Supporto API endpoint lefrecce
        this.cookieJar = new tough.CookieJar();
        this.apiUrl = apiUrl || 'https://www.lefrecce.it/msite/';
        this.api = axios.create({
            baseURL: this.apiUrl,
            responseType: 'json',
            headers: { 'User-Agent': 'api-trenitalia 2.0' },
            withCredentials: true
        });

        // Supporto per sessioni (molte chiamate non funzionerebbero altrimenti)
        axiosCookieJarSupport(this.api);
        this.api.defaults.jar = new tough.CookieJar();
        this.isLogged = false;
    }

    _createViaggiaTrenoApi(viaggiaTrenoApiUrl) {
        // Supporto API endpoint viaggiatreno
        this.viaggiatreno_cookieJar = new tough.CookieJar();
        this.viaggiatreno_apiUrl = viaggiaTrenoApiUrl || 'http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/';
        this.viaggiatreno = axios.create({
            baseURL: this.viaggiatreno_apiUrl,
            responseType: 'json',
            headers: { 'User-Agent': 'api-trenitalia 2.0' },
            withCredentials: true
        });
        axiosCookieJarSupport(this.viaggiatreno);
        this.viaggiatreno.defaults.jar = new tough.CookieJar();
    }

    _handleStaticData() {
        // Static data
        this.staticDataFile = "files/stations.json";
        try {
            this.viaggiatreno_stations = JSON.parse(fs.readFileSync(this.staticDataFile));
            const stats = fs.statSync(this.staticDataFile);
            const mtime = stats.mtime;
            const now = new Date();
            const one_month = 3 * 30 * 24 * 60 * 60 * 1000;
            if (this.viaggiatreno_stations.length == 0 || (now - mtime) > one_month) {
                console.warn(OLD_STATIC_DATA_WARNING);
                this._downloadStaticData();
            };
        } catch {
            console.warn(ERROR_STATIC_DATA_WARNING);
            this._downloadStaticData();
        }
    }

    async _downloadStaticData() {
        let iter = 0;
        let allStations = [];
        while (true) {
            const result = await this.viaggiatreno.get(`elencoStazioni/${iter}`);
            if (!result || !result.data || result.data.length <= 0) break;
            allStations = allStations.concat(result.data);
            iter++;
        }
        this.viaggiatreno_stations = allStations;
        fs.writeFileSync(this.staticDataFile, JSON.stringify(allStations));
        console.warn("Static data file downloaded and saved!");
    }

    /**
     * Effettua il login. Tutte le richeiste seguenti saranno effettuate come un utente loggato.
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        try {
            const requestBody = {
                j_username: username,
                j_password: password
            };
            const result = await this.api.post('api/users/login', qs.stringify(requestBody), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            if (result && result.status == 200)
                this.isLogged = true;

            return this.isLogged;
        } catch (error) {
            this._sendError('Login failed', error);
        }
    }

    /**
     * Effettua il logout.
     */
    async logout() {
        try {
            const result = await this.api.post('ibm_security_logout', {}, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            if (result && result.status == 200)
                this.isLogged = false;

            return !this.isLogged;
        } catch (error) {
            this._sendError('Logout failed', error);
        }
    }

    /**
     * Ottiene dettagli account, se loggati
     * 
     * Ritorna un documento di questo tipo:
     * name: nome utente
     * surname: cognome utente
     * email: email utente
     * cfcode: codice personale cartafreccia
     * nextcftype: il prossimo livello di cartafreccia che verrà raggiunto (Argento, Oro o Platino)
     * cftype: tipo di circuito utilizzato dalla cartafreccia (ex. Cartasi)
     * points: saldo punti cartafreccia
     * mobile: numero di telefono utente
     * birthdate: data di nascita in formato dd/mm/yyyy
     */
    async userDetails() {
        if (!this.isLogged) this._sendError('User not logged in');
        try {
            const result = await this.api.get('api/users/profile');
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }

    /**
     * Cerca tutti gli acquisti effettuati (massimo cinque alla volta, i primi cinque ordinati per data crescente). Serve essere loggati.
     * 
     * @param {string} from Data in formato dd/mm/yyyy
     * @param {string} to Data in formato dd/mm/yyyy
     * @param {bool} searchByBookingDate Se cercare per data di acquisto, di default cerca per data di viaggio
     * @param {bool} finalized 
     */
    async getPurchases(from, to, searchByBookingDate = false, finalized = true) {
        try {
            const result = await this.api.get('api/users/purchases', {
                params: {
                    finalized: finalized,
                    datefrom: from,
                    dateto: to,
                    searchbydeparture: !searchByBookingDate // By default search by trip date, else by booking date
                }
            });
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }

    /**
     * Ottieni i dettagli relativi ad un acquisto (possibile solo se acqusisto con showmore = true)
     * @param {string} idsales Id dell'acquisto
     */
    async getPurchaseDetails(idsales) {
        try {
            const result = await this.api.get(`api/users/sales/${idsales}`);
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }

    /**
     * Ottiene pdf del biglietto dato un idsales ed un tsid (partendo da 1).
     * Può essere chiamato solo dopo una richiesta di dettaglio e per breve tempo.
     * @param {string} idsales 
     * @param {int} tsid 
     * @param {string} filename Path to output pdf 
     * @param {string} lang Language code (ISO a due caratteri)
     */
    async getTicketPdf(idsales, tsid, filename, lang = "it") {
        try {
            const result = await this.api.get(`api/users/sales/${idsales}/travel?lang=${lang}&tsid=${tsid}`,
                {
                    responseType: "stream"
                });
            if (result && result.data) {
                result.data.pipe(fs.createWriteStream(filename));
                return true;
            }
            return false;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }

    /**
     * Funzione di autocompletamento nomi stazioni, torna un array di oggetti contenti id, nome e tag della stazione
     * @param {string} text Testo da cercare 
     */
    async autocomplete(text) {
        try {
            const result = await this.api.get('api/geolocations/locations', {
                params: {
                    name: text
                }
            });
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
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
    async getOneWaySolutions(stazionePartenza, stazioneArrivo, data, ora, adulti, bambini, soloFrecce, soloRegionali, codiceCartafreccia) {
        try {
            const result = await this.api.get('api/solutions', {
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
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }

    /**
     * Metodo di utility per gestire chiaamte simili alle API dato un ID soluzione
     * @param {string} idSolution 
     * @param {string} type 
     */
    async internalGetSolution(idSolution, type) {
        try {
            const result = await this.api.get(`api/solutions/${idSolution}/${type}`);
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }

    /**
     * Dettagli di una soluzione
     * Funziona solo se c'è già una sessione aperta con il sito
     * @param {string} idSolution 
     */
    async getSolutionDetails(idSolution) {
        return await this.internalGetSolution(idSolution, "details");
    }

    /**
     * Come getSolutionDetails, ma omette stoplist e servicelist
     * Funziona solo se c'è già una sessione aperta con il sito
     * @param {string} idSolution 
     */
    async getSolutionInfo(idSolution) {
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
     * Come getPriceDetails, ma con tutte le possibili offerte acquistabili
     * @param {string} idSolution 
     */
    async getCustomizedPriceDetails(idSolution) {
        return await this.internalGetSolution(idSolution, "customizedoffers");
    }

    /**
     * Ottiene i treni in partenza da una stazione ed informazioni su di essi
     * @param {string} stazione Nome stazione così come fornito dall'autocompletamento 
     * @param {Date} date Eventuale data, di default è ora
     * @param {string} idStazione Se già si ha, id viaggiatreno della stazione
     */
    async getDeparturesFromStation(stazione, date = null, idStazione = null) {
        return await this.internalGetFromStations("partenze", stazione, date, idStazione);
    }

    /**
     * Ottiene i treni in arrivo ad una stazione ed informazioni su di essi
     * @param {string} stazione Nome stazione così come fornito dall'autocompletamento 
     * @param {Date} date Eventuale data, di default è ora
     * @param {string} idStazione Se già si ha, id viaggiatreno della stazione
     */
    async getArrivalsFromStation(stazione, date = null, idStazione = null) {
        return await this.internalGetFromStations("arrivi", stazione, date, idStazione);
    }

    /**
     * Chiamata interna per ottente partenze o arrivi da una stazione
     */
    async internalGetFromStations(kind, stazione, date = null, idStazione = null) {
        date = date || new Date();
        if (!stazione && !idStazione) {
            this._sendError("Fornire una stazione");
        }
        if (stazione && !idStazione) {
            stazione = stazione.toLowerCase()
            const mapped_station = this.viaggiatreno_stations
                .find(s => (s.localita.nomeLungo.toLowerCase() == stazione) || (s.localita.nomeBreve.toLowerCase() == stazione));
            if (mapped_station && mapped_station.localita && mapped_station.localita.id)
                idStazione = mapped_station.localita.id;
        }

        if (!idStazione) {
            this._sendError("Stazione non trovata");
        }

        try {
            const result = await this.viaggiatreno.get(`${kind}/${idStazione}/${date}`);
            return result ? result.data : null;
        } catch (error) {
            this._sendError('Error while retrieving the data', error);
        }
    }
}

module.exports = Trenapi;