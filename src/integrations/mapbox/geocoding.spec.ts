import {getMapboxClient} from "./index";

describe('Mapbox', () => {
    const {geocoding} = getMapboxClient({
        accessToken: 'pk.eyJ1IjoicmF6YWtqIiwiYSI6ImNrZTN5eXJkeDBuejAyem9iNXRwc2JhOW8ifQ.LhAcJptDgRg1Vj9lJYPZQQ'
    });

    it('should return addresses', async () => {
        const results = await geocoding.searchAddress('73 Whitfield', {countryCode: "au"});
        expect(results.length).toBeGreaterThan(0);
    })
});