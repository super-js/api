import {getGoogleClient} from "./index";

describe('Google', () => {
    const {geocoding} = getGoogleClient({
        accessToken: 'AIzaSyBn0uQLPgW1CRTDXa267fMbdoz6zkzDoIU'
    });

    it('should return addresses', async () => {
        const results = await geocoding.searchAddress('73 Whitfield', {countryCode: "au"});
        expect(results.length).toBeGreaterThan(0);
    })
});