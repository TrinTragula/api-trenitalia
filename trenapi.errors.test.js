const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const moment = require('moment');
const Trenapi = require('./trenapi');

const mock = new MockAdapter(axios);
const data = { response: true };
mock.onGet().reply(500, data);

const ROMA = "Roma Termini";
const MILANO = "Milano Centrale";

test('Autocompletamento: Gestione errori', async () => {
    const trenapi = new Trenapi();
    const result = await trenapi.autocomplete('Mil');
    expect(result.ok).toBe(false);
    expect(result.data).toBeUndefined();
});

test('Ricerca: Gestione errori', async () => {
    const trenapi = new Trenapi();
    const date = moment().add(3, 'days').format("DD/MM/YYYY");
    let result = await trenapi.getSolutions(ROMA, MILANO, date, 15, 2, 0, false, false);
    expect(result.ok).toBe(false);
    expect(result.data).toBeUndefined();
});

test('Dettagli: Gestione errori', async () => {
    const trenapi = new Trenapi();
    let result = await trenapi.getDetails("idSoluzione");
    expect(result.ok).toBe(false);
    expect(result.data).toBeUndefined();
});