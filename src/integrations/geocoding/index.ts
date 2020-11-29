import {IMapboxClient} from "../mapbox";
import {IGoogleClient} from "../google";

export interface ILocation {
    lat: number;
    long: number
}

export interface IAddress extends Partial<ILocation> {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    country: string;
    postCode: number;
    formattedAddress: string;
    id?: string;
}

export interface IBaseGeocodingOptions {
    provider?: "google" | "mapbox";
    countryCode?: string;
}

export interface ISearchAddressOptions extends IBaseGeocodingOptions {

}

export interface IAddressToLongAndLatOptions extends IBaseGeocodingOptions {

}

export interface IAddressToLongAndLatResult {
    long: number;
    lat: number;
}

export interface IGeocodingClientOptions {
    mapboxClient?: IMapboxClient;
    googleClient?: IGoogleClient;
}

export interface IGeocodingClient {
    //addressToLongAndLat : (address: IAddress, addressToLongAndLatOptions: IAddressToLongAndLatOptions) => Promise<IAddressToLongAndLatResult>;
    searchAddress       : (searchTerm: string, searchAddressOptions?: ISearchAddressOptions) => Promise<IAddress[]>;
}

export function getGeocodingClient(geocodingClientOptions: IGeocodingClientOptions): IGeocodingClient {

    const {mapboxClient, googleClient} = geocodingClientOptions;

    if(!mapboxClient && !googleClient) return null;

    return {
        searchAddress: async (searchTerm, searchAddressOptions = {}) => {

            const {provider} = searchAddressOptions;

            if(!mapboxClient || !googleClient) throw new Error("No Geocoding client is available. mapbox | google");
            if(provider && provider === "google" && !googleClient) throw new Error("Google Client not available");
            if(provider && provider === "mapbox" && !mapboxClient) throw new Error("Mapbox Client not available");

            if(provider === "mapbox") {
                return googleClient.geocoding.searchAddress(searchTerm, searchAddressOptions);
            } else {
                return googleClient.geocoding.searchAddress(searchTerm, searchAddressOptions);
            }

        },
        // addressToLongAndLat: async (address, addressToLongAndLatOptions) => {
        //     const {provider} = addressToLongAndLatOptions;
        // }
    }
}