import {getGeocodingClient} from "./index";
import {getGoogleClient} from "../google";
import {getMapboxClient} from "../mapbox";

describe('Geocoding', () => {

    const googleClient = getGoogleClient({
        accessToken: 'AIzaSyBn0uQLPgW1CRTDXa267fMbdoz6zkzDoIU'
    });

    const mapboxClient = getMapboxClient({
        accessToken: 'pk.eyJ1IjoicmF6YWtqIiwiYSI6ImNrZTN5eXJkeDBuejAyem9iNXRwc2JhOW8ifQ.LhAcJptDgRg1Vj9lJYPZQQ'
    });

    const geocodingClient = getGeocodingClient({
        mapboxClient, googleClient
    })

    describe('Google', () => {
        it('should return addresses', async () => {
            const results = await geocodingClient.searchAddress('73 Whitfield', {
                countryCode: "au", provider: "google"
            });
            expect(results.length).toBeGreaterThan(0);
        })
    });

    describe('Mapbox', () => {
        it('should return addresses', async () => {
            const results = await geocodingClient.searchAddress('73 Whitfield', {
                countryCode: "au", provider: "mapbox"
            });
            expect(results.length).toBeGreaterThan(0);
        })
    })

});