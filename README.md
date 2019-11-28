# api-trenitalia

[![NPM](https://nodei.co/npm/api-trenitalia.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/api-trenitalia/)

## API di trenitalia messe a disposizione tramite il portale lefrecce.it

[Link al pacchetto npm](https://www.npmjs.com/package/api-trenitalia)

Un semplice wrapper per le API di Trenitalia messe a disposizione tramite il portale lefrecce.it  
La versione 2.0 del progetto comprende ora molte più funzionalità legate all'account, nonché una rivisitazione del codice per renderlo più semplciemente utilizzabile e testabile.

## Feature

* Cercare un viaggio di sola andata
* Autocompletamento
* Cercare maggiori dettagli su una soluzione
* Cercare informazioni sui prezzi delle soluzioni
* Login/Logout
* Dettagli account
* Storico acquisti
* Download di biglietti in PDF

## Esempi di utilizzo

* Esempio di ricerca

    ```javascript
    const Trenitalia = require("api-trenitalia");
    const moment = require('moment');
    (async () => {
        const t = new Trenitalia();
        const stations_from = await t.autocomplete("milano");
        const station_from = stations_from[0].name;
        const stations_to = await t.autocomplete("bari");
        const station_to = stations_to[0].name;

        const date = moment().add(3, 'months').format("DD/MM/YYYY");
        const solutions = await t.getOneWaySolutions(station_from, station_to, date, "13", 2, 0);
        console.log(solutions);
    })();
    ```

    JSON di risposta:

    ```json
    [{
            "idsolution": "5c486363d2ac4ba6f8dd152cab869932i0",
            "origin": "Milano Centrale",
            "destination": "Bari Centrale",
            "direction": "A",
            "departuretime": 1582891800000,
            "arrivaltime": 1582918020000,
            "minprice": 185.6,
            "optionaltext": null,
            "duration": "07:17",
            "changesno": 1,
            "bookable": true,
            "saleable": true,
            "trainlist": [{
                    "trainidentifier": "FRECCIAROSSA 9539",
                    "trainacronym": "FR",
                    "traintype": "F",
                    "pricetype": "D"
                }, {
                    "trainidentifier": "FRECCIABIANCA 8811",
                    "trainacronym": "FB",
                    "traintype": "F",
                    "pricetype": "D"
                }
            ],
            "onlycustom": false,
            "extraInfo": [],
            "showSeat": true,
            "specialOffer": null,
            "transportMeasureList": []
        }, 
        ...
        {
            "idsolution": "5c486363d2ac4ba6f8dd152cab869932i4",
            "origin": "Milano Centrale",
            "destination": "Bari Centrale",
            "direction": "A",
            "departuretime": 1582899000000,
            "arrivaltime": 1582924920000,
            "minprice": 195.8,
            "optionaltext": null,
            "duration": "07:12",
            "changesno": 1,
            "bookable": true,
            "saleable": true,
            "trainlist": [{
                    "trainidentifier": "FRECCIAROSSA 1000 9547",
                    "trainacronym": "FR",
                    "traintype": "F",
                    "pricetype": "D"
                }, {
                    "trainidentifier": "FRECCIABIANCA 8815",
                    "trainacronym": "FB",
                    "traintype": "F",
                    "pricetype": "D"
                }
            ],
            "onlycustom": false,
            "extraInfo": [],
            "showSeat": true,
            "specialOffer": null,
            "transportMeasureList": []
        }
    ]
    ```

* Cerca tutte le tratte dalla prima città autocompletata per "milano" fino a "bari, prende la prima soluzione e ne stampa alcuni dettagli

    ```javascript
    const Trenitalia = require('api-trenitalia');
    const moment = require('moment');
    (async () => {
        const t = new Trenitalia();

        const stations_from = await t.autocomplete("milano");
        const station_from = stations_from[0].name;
        const stations_to = await t.autocomplete("bari");
        const station_to = stations_to[0].name;
        console.log(`Partenza da: ${station_from}, arrivo a: ${station_to}`);

        const date = moment().add(3, 'months').format("DD/MM/YYYY");
        const solutions = await t.getOneWaySolutions(station_from, station_to, date, "13", 2, 0);
        const firstSolution = solutions[0];
        console.log('=== Prima soluzione disponibile ===');
        console.log(`Treno da:\t${firstSolution.origin}`);
        console.log(`Treno a:\t${firstSolution.destination}`);
        console.log(`Partenza:\t${new Date(firstSolution.departuretime)}`);
        console.log(`Arrivo: \t${new Date(firstSolution.arrivaltime)}`);
        console.log(`Prezzo minimo:\t${firstSolution.minprice}`);
        console.log(`Durata: \t${firstSolution.duration}`);
        console.log(`Numero cambi:\t${firstSolution.changesno}`);
        console.log(`Treni:  \t${firstSolution.trainlist.map(x => x.trainidentifier).join(', ')}`);

        const priceDetail = await t.getCustomizedPriceDetails(firstSolution.idsolution);
        console.log('=== Alcune possibilità dalla prima soluzione ===');
        let result = '';
        for (const service of priceDetail.leglist[0].travelerlist[0].servicelist) {
            const firstOffer = service.offerlist[0];
            result += `${service.name.padEnd(25)}\t${firstOffer.name.padEnd(15)}\t${firstOffer.points || 0} punti \t${firstOffer.price || 0}€\t${firstOffer.available || 0} posti disponibili ${firstOffer.visible ? '' : '(non visibile)'}\n`
            const secondOffer = service.offerlist[1];
            result += `${'-'.padEnd(25)}\t${secondOffer.name.padEnd(15)}\t${secondOffer.points || 0} punti \t€${secondOffer.price || 0}\t${secondOffer.available || 0} posti disponibili ${secondOffer.visible ? '' : '(non visibile)'}\n`
        };
        console.log(result);
    })();
    ```

    Output:

    ```text
    Partenza da: MILANO ( TUTTE LE STAZIONI ), arrivo a: BARI ( TUTTE LE STAZIONI )
    === Prima soluzione disponibile ===
    Treno da:       Milano Centrale
    Treno a:        Bari Centrale
    Partenza:       Fri Feb 28 2020 13:10:00 GMT+0100 (GMT+01:00)
    Arrivo:         Fri Feb 28 2020 20:27:00 GMT+0100 (GMT+01:00)
    Prezzo minimo:  185.6
    Durata:         07:17
    Numero cambi:   1
    Treni:          FRECCIAROSSA 9539, FRECCIABIANCA 8811
    === Alcune possibilità dalla prima soluzione ===
    EXECUTIVE                       BASE            142.1 punti     120€    8 posti disponibili
    -                               Economy         125 punti       €102.9  6 posti disponibili
    BUSINESS SALOTTINO              BASE            92.1 punti      70€     8 posti disponibili
    -                               Economy         72 punti        €49.9   8 posti disponibili
    WORKING AREA                    BASE            92.1 punti      70€     3 posti disponibili
    -                               Economy         72 punti        €49.9   3 posti disponibili
    BUSINESS AREA SILENZIO          BASE            92.1 punti      70€     16 posti disponibili
    -                               Economy         77 punti        €54.9   16 posti disponibili
    BUSINESS                        BASE            92.1 punti      70€     119 posti disponibili
    -                               Economy         72 punti        €49.9   22 posti disponibili
    PREMIUM                         BASE            79.1 punti      57€     53 posti disponibili
    -                               Economy         65 punti        €42.9   10 posti disponibili
    STANDARD AREA SILENZIO          BASE            78.1 punti      56€     68 posti disponibili
    -                               CONVENZIONI     0 punti         €0      68 posti disponibili
    STANDARD                        BASE            78.1 punti      56€     266 posti disponibili
    -                               CONVENZIONI     0 punti         €0      266 posti disponibili

    ```
  
* Effettua il login, stampa informazioni relative all'utente, dettagli relativi ad un acquisto e ne scarica il biglietto in PDF

    ```javascript
    const Trenitalia = require('api-trenitalia');

    (async () => {
        username = '<USERNAME ACCOUNT TRENITALIA>';
        password = '<PASSWORD ACCOUNT TRENITALIA>';
        const t = new Trenapi();
        if (await t.login(username, password)) {
            console.log('Login riuscito');
            let result = await t.userDetails();
            console.log('Dettagli utente:');
            console.log(result);
            result = await t.getPurchases("01/01/2019", "01/01/2020");
            console.log('Primo acqusito del 2019:');
            console.log(result[0]);
            const idsales = result[0].idsales
            result = await t.getPurchaseDetails(idsales);
            console.log('Dettagli acqusito:');
            console.log(result);
            // Download del biglietto in pdf come "biglietto.pdf"
            const fileName = 'biglietto.pdf';
            result = await t.getTicketPdf(idsales, 1, fileName);
            await t.logout();
        }
    })();
    ```

    Output:

    ```text
    Login riuscito

    Dettagli utente:
    {
        name: <rimosso>,
        surname: <rimosso>,
        email: <rimosso>,
        cfcode: <rimosso>,
        cftype: 'CARTAFRECCIA_ARGENTO',
        cfstatus: 'ACTIVE',
        cfdescription: 'CARTAFRECCIA ARGENTO',
        points: <rimosso>,
        nextcftype: 'Gold',
        nextpoints: <rimosso>,
        mobile: <rimosso>,
        loyaltyFault: false,
        customerkey: <rimosso>,
        birthdate: <rimosso>,
        period: <rimosso>,
        loyaltyProfile: <rimosso>,
        loyaltyProgram: <rimosso>,
        originalPlatform: <rimosso>,
        customerCategory: <rimosso>,
        customerType: <rimosso>,
        channelId: <rimosso>,
        userType: <rimosso>,
        pointsBalanceNotUpdated: <rimosso>,
        individualInvoice: <rimosso>,
        commercialCards: <rimosso>
    }

    Primo acqusito del 2019:
    {
        idsales: <rimosso>,
        traveldescription: <rimosso>,
        purchasedate: <rimosso>,
        departuredate: <rimosso>,
        type: 'Ticket',
        status: 'Purchased',
        tsstatus: <rimosso>,
        channel: 'APP',
        showmore: true,
        expiration: null,
        pnr: <rimosso>,
        travelName: 'Il mio viaggio <rimosso>',
        tsid: <rimosso>,
        departureDatetime: <rimosso>,
        arrivalDatetime: <rimosso>,
        origin: <rimosso>,
        destination: <rimosso>,
        mainTransportTypes: [ 'TRAIN' ],
        typeCodes: <rimosso>,
        closed: false
    }

    Dettagli acqusito:
    {
        totalprice: 91.25,
        idsales: <rimosso>,
        odlist: [
            {
            tsid: 2,
            origin: <rimosso>,
            destination: <rimosso>,
            deptime: <rimosso>,
            arrtime: <rimosso>,
            direction: 'A',
            adultno: 1,
            childno: 0,
            price: 40.5,
            leglist: [Array],
            availoperations: [Object],
            discountcodelist: [],
            discountCodeMessage: null,
            saleCompanyIds: [Array],
            date: null,
            quantity: 1
            },
            {
            tsid: 1,
            origin: <rimosso>,
            destination: <rimosso>,
            deptime: <rimosso>,
            arrtime: <rimosso>,
            direction: 'R',
            adultno: 1,
            childno: 0,
            price: 50.75,
            leglist: [Array],
            availoperations: [Object],
            discountcodelist: [],
            discountCodeMessage: null,
            saleCompanyIds: [Array],
            date: null,
            quantity: 1
            }
        ],
        email: <rimosso>,
        pdfallowed: true,
        ticketless: true,
        expdate: null,
        smsallowed: true,
        invoicerequest: false,
        mailError: false,
        isssueCreditNoteError: false,
        electronicValues: [],
        serviceType: 'SEAT',
        legToBookingsConfirmeds: [],
        subscriptioncode: 0,
        seatNotAssigned: false,
        taxiSharingEnable: false,
        paymentNotAuthorized: false
    }
    ```

## Ringraziamenti

Purtroppo sono API piuttosto convolute e poco intuitive, per questo ringrazio il fondamentale aiuto di questo progetto:  
[Trenitalia-API di SimoDax, una wiki sul loro funzionamento](https://github.com/SimoDax/Trenitalia-API)  
Visitate pure il suo sito [simodax.github.io](http://simodax.github.io/) e mostrategli un po' di affetto.

## Chi sono io

Io sono Trintragula (Daniele), dal 2017. **Non** usate questo codice per scopi malvagi e rispettate il servizio offerto.

Potete trovarmi scrivendo a danielescarinci42 _(at)_ gmail _(dot)_ com
