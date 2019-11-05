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
    const result = await trenapi.autocomplete('Mil');
    expect(result.ok).toBe(true);
    expect(result.data.map(x => x.name.toLowerCase())).toContain(MILANO.toLowerCase());
});

test('Ricerca: Trovo risultati da Roma a Milano', async () => {
    const trenapi = new Trenapi();
    const date = moment().add(3, 'days').format("DD/MM/YYYY");
    const result = await trenapi.getSolutions(ROMA, MILANO, date, 15, 2, 0, false, false);
    expect(result.ok).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].origin.toLowerCase()).toBe(ROMA.toLowerCase());
    expect(result.data[0].destination.toLowerCase()).toBe(MILANO.toLowerCase());
    expect(result.data[0].direction).toBe("A");
});

test('Dettagli: Trovo dettagli di una tratta da Roma a Milano', async () => {
    const trenapi = new Trenapi();
    const date = moment().add(3, 'days').format("DD/MM/YYYY");
    let result = await trenapi.getSolutions(ROMA, MILANO, date, 15, 2, 0, false, false);
    expect(result.ok).toBe(true);
    const tratta = result.data[0];
    const idSoluzione = tratta.idsolution;
    expect(idSoluzione).toBeTruthy();

    result = await trenapi.getDetails(idSoluzione);
    expect(result.ok).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    result = await trenapi.getInfo(idSoluzione);
    expect(result.ok).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    result = await trenapi.getPriceDetails(idSoluzione);
    expect(result.ok).toBe(true);
    expect(result.data.leglist.length).toBeGreaterThan(0);

    result = await trenapi.getCustomizedPriceDetails(idSoluzione);
    expect(result.ok).toBe(true);
    expect(result.data.leglist.length).toBeGreaterThan(0);
});
