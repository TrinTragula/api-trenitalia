# api-trenitalia
### API di trenitalia messe a disposizione tramite il portale lefrecce.it <img src="https://camo.githubusercontent.com/f5901b35cf63acd4e1225f44345c5f974fad0749/68747470733a2f2f63646e2d696d616765732d312e6d656469756d2e636f6d2f6d61782f3830302f312a306672335062543258716a734d4435327363322d4e512e706e67" width="48"> 

[Link al pacchetto npm](https://www.npmjs.com/package/api-trenitalia)

Un semplice wrapper per le API di Trenitalia messe a disposizione tramite il portale lefrecce.it

Il progetto è ancora in fase embrionale, ma fa bene ciò che deve fare e spero presto di occcuparmi del resto.

## Feature:
* Cercare un viaggio di sola andata
* Autocompletamento
* Cercare maggiori dettagli su una soluzione
* Cercare informazioni sui prezzi delle soluzioni

## Esempio di utilizzo:

* Cerca tutte le tratte dalla prima città autocompletata per "milan" fino a Bari, prende la prima soluzione e ne stampa i dettagli
  ```javascript
  var Trenitalia = require("api-trenitalia");
  var t = new Trenitalia();

  t.autocomplete("milan")
    .then(c => {
        let name = c[0].name;
        return t.getSolutions(name, "BARI ( TUTTE LE STAZIONI )", "15/01/2018", "13", 2, 0);
    })
    .then(dataSolution => {
        let id = dataSolution[0].idsolution;
        return t.getCustomizedPriceDetails(id);
    })
    .then(data => {
        console.log(data);
    });
  ```
  Output:
  ```
  [
    {
        "idsolution": "f7e04ce328d8492fc54250bbe3354655i0",
        "idleg": "x0f78d528-f4a2-428a-b773-2a913941263c",
        "direction": "A",
        "trainidentifier": "FRECCIAROSSA 9533",
        "trainacronym": "FR",
        "departurestation": "MILANO C.LE",
        "departuretime": 1516018800000,
        "arrivalstation": "BOLOGNA C.LE",
        "arrivaltime": 1516022520000,
        "duration": "01:02"
    },
    {
        "idsolution": "f7e04ce328d8492fc54250bbe3354655i0",
        "idleg": "xce2feedf-5130-442d-b1aa-4ffbc93878f4",
        "direction": "A",
        "trainidentifier": "FRECCIABIANCA 8813",
        "trainacronym": "FB",
        "departurestation": "BOLOGNA C.LE",
        "departuretime": 1516023720000,
        "arrivalstation": "BARI C.LE",
        "arrivaltime": 1516044060000,
        "duration": "05:39"
    }
  ]
  ```
  
## Ringraziamenti:
Purtroppo sono API piuttosto convolute e non troppo intuitive, ma per questo ringrazio il fondamentale aiuto di questo progetto:

[Trenitalia-API di SimoDax, una wiki sul loro funzionamento](https://github.com/SimoDax/Trenitalia-API)

Andate pure a visitare il suo sito @ http://simodax.github.io/

## Chi sono io
Io sono Trintragula (Daniele), dal 2017. **Non** usate questo codice per scopi malvagi e rispettate il servizio offerto.

Probabilmente scriverò un articolo a riguardo su [blog.danielescarinci.com](blog.danielescarinci.com), una volta terminato il progetto.

Potete trovarmi scrivendo a dcat (at) protonmail.com

