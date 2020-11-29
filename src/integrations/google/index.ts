import {getGoogleGeocoding} from "./geocoding";
import fetch from "node-fetch";
import {IGeocodingClient} from "../geocoding";

export interface IGoogleOptions {
    accessToken: string;
}

export interface IGoogleClient {
    geocoding: IGeocodingClient
}

export type TGoogleServiceType = "maps";
export type TGoogleApiType = "geocode";

export interface IGoogleMakeRequestOptions {
    serviceType: TGoogleServiceType;
    apiType: TGoogleApiType;
    requestBody: string;
}

export type MakeGoogleRequest = (googleRequestOptions: IGoogleMakeRequestOptions) => any;

export function getGoogleClient(googleClientOptions: IGoogleOptions): IGoogleClient {

    const {accessToken} = googleClientOptions;

    const _makeGoogleRequest = async (googleRequestOptions: IGoogleMakeRequestOptions) => {

        const baseRequestUrl = `https://maps.googleapis.com/${googleRequestOptions.serviceType}/api/${googleRequestOptions.apiType}/json`;

        const _response = await fetch(
            `${baseRequestUrl}?key=${accessToken}&${googleRequestOptions.requestBody}`
        );

        const {results, status} = await _response.json();

        if(status !== "OK"
        && status !== "ZERO_RESULTS") throw new Error(`An error occurred in Google Client : ${status}`);

        return results;
    }

    return {
        geocoding: getGoogleGeocoding(_makeGoogleRequest)
    }
}