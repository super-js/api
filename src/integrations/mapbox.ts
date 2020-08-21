import fetch from "node-fetch";

export interface IMapboxOptions {
    accessToken: string;
    defaultLongAndLat?: [number, number];
    countryCode?: string;
}

export interface IAddress {
    streetAddress: string;
    city: string;
    state: string;
    country: string;
    postCode: number;
}

export interface ISearchAddressOptions {}

export interface IMapboxClient {
    addressToLongAndLat: (input: IAddress) => Promise<[number, number]>;
    searchAddress: (searchTerm: string) => Promise<IAddress[]>;
}


const MAPBOX_ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';

export function getMapboxClient(options: IMapboxOptions): IMapboxClient {

    const {accessToken, defaultLongAndLat = [0,0], countryCode} = options;

    const _makeMapboxRequest = async (requestBody: string) => {
        const _response = await fetch(`${MAPBOX_ENDPOINT}${requestBody}${countryCode ? `&country=${countryCode}` : ''}&access_token=${accessToken}`);
        return _response.json();
    }

    return {
        addressToLongAndLat : async address => {

            const searchAddress = `${address.streetAddress} ${address.city} ${address.state} ${address.postCode}`

            const {features} = await _makeMapboxRequest(`${searchAddress}.json?types=address&limit=1`);

            if(!Array.isArray(features) || features.length === 0) {
                return defaultLongAndLat
            } else {
                const [addressFeature] = features;
                return addressFeature.center;
            }

        },
        searchAddress : async (searchTerm, options?: ISearchAddressOptions) => {

            const {features} = await _makeMapboxRequest(`${searchTerm}.json?limit=10&types=address`);

            if(Array.isArray(features)) {
                return features.reduce((_, feature) => {

                    const streetAddress = `${feature.address ? `${feature.address} ` : ''}${feature.text}`;
                    const city = feature.context.find(c => c.id.indexOf('place') > -1);
                    const state = feature.context.find(c => c.id.indexOf('region') > -1);
                    const country = feature.context.find(c => c.id.indexOf('country') > -1);
                    const postCode = feature.context.find(c => c.id.indexOf('postcode') > -1);

                    if(streetAddress && city && state && country && postCode) {
                        _.push({
                            streetAddress: streetAddress,
                            city: city.text,
                            state: state.text,
                            country: country.text,
                            postCode: postCode.text
                        })
                    }

                    return _;
                }, []);
            } else {
                return [];
            }

        }
    }
}