import fetch from "node-fetch";
import {getMapboxGeocoding} from "./geocoding";
import {IGeocodingClient} from "../geocoding";

export interface IMapboxOptions {
    accessToken: string;
}

export interface IMapboxClient {
    geocoding: IGeocodingClient
}

export interface IMapboxMakeRequestOptions {
    requestBody: string;
    countryCode?: string;
}

export type MakeMapboxRequest = (mapboxRequestOptions: IMapboxMakeRequestOptions) => any;

const MAPBOX_ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';

export function getMapboxClient(options: IMapboxOptions): IMapboxClient {

    const {accessToken} = options;

    const _injectCountryCode  = _countryCode => _countryCode ? `&country=${_countryCode}` : '';

    const _makeMapboxRequest = async (mapboxRequestOptions: IMapboxMakeRequestOptions) => {

        const {requestBody} = mapboxRequestOptions;

        const _response = await fetch(
            `${MAPBOX_ENDPOINT}${requestBody}${_injectCountryCode(mapboxRequestOptions.countryCode)}&access_token=${accessToken}`
        );
        return _response.json();

    }

    return {
        geocoding: getMapboxGeocoding(_makeMapboxRequest)
    }
}