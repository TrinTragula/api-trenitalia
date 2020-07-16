const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const moment = require('moment');
const Trenapi = require('./trenapi');

const ROMA = "Roma Termini";
const MILANO = "Milano Centrale";

test('Inzializzazione: Le api contengono un\'istanza valida di axios', () => {
    const trenapi = new Trenapi();
    expect(trenapi.api).toBeTruthy();
});

test('Autocompletamento: Cercare per "Mil" trova Milano', async () => {
    const trenapi = new Trenapi();
    const result = await trenapi.autocomplete('Milano centrale');
    expect(result.map(x => x.name.toLowerCase())).toContain(MILANO.toLowerCase());
});

test('Ricerca: Trovo risultati da Roma a Milano', async () => {
    const trenapi = new Trenapi();
    const date = moment().add(3, 'days').format("DD/MM/YYYY");
    const result = await trenapi.getOneWaySolutions(ROMA, MILANO, date, 15, 2, 0, false, false);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].origin.toLowerCase()).toBe(ROMA.toLowerCase());
    expect(result[0].destination.toLowerCase()).toBe(MILANO.toLowerCase());
    expect(result[0].direction).toBe("A");
});

test('Dettagli: Trovo dettagli di una tratta da Roma a Milano', async () => {
    const trenapi = new Trenapi();
    const date = moment().add(3, 'days').format("DD/MM/YYYY");
    let result = await trenapi.getOneWaySolutions(ROMA, MILANO, date, 15, 2, 0, false, false);
    const tratta = result[0];
    const idSoluzione = tratta.idsolution;
    expect(idSoluzione).toBeTruthy();

    result = await trenapi.getSolutionDetails(idSoluzione);
    expect(result.length).toBeGreaterThan(0);

    result = await trenapi.getSolutionInfo(idSoluzione);
    expect(result.length).toBeGreaterThan(0);

    result = await trenapi.getPriceDetails(idSoluzione);
    expect(result.leglist.length).toBeGreaterThan(0);

    result = await trenapi.getCustomizedPriceDetails(idSoluzione);
    expect(result.leglist.length).toBeGreaterThan(0);
});
