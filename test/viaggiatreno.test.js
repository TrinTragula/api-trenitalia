const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const moment = require('moment');
const Trenapi = require('../trenapi');

const ROMA = "Roma Termini";
const MILANO = "Milano Centrale";

test('Inzializzazione: Le api contengono un\'istanza valida di axios', () => {
    const trenapi = new Trenapi();
    expect(trenapi.viaggiatreno).toBeTruthy();
});

// todo: verifica dati statici

test('Stazioni: Ottengo i treni in partenza da Milano Centrale', async () => {
    const trenapi = new Trenapi();
    const stations = await trenapi.autocomplete(MILANO);
    const result = await trenapi.getDeparturesFromStation(stations[0].name);
    expect(result.length).toBeGreaterThan(0);
});