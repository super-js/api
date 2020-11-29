import {MakeGoogleRequest} from "./index";
import {IAddress, IGeocodingClient, ISearchAddressOptions} from "../geocoding";

export function getGoogleGeocoding(makeGoogleRequest: MakeGoogleRequest): IGeocodingClient {
    return {
        searchAddress : async (searchTerm, searchAddressOptions: ISearchAddressOptions = {}) => {

            const {countryCode} = searchAddressOptions;

            const googleAddresses = await makeGoogleRequest({
                apiType: "geocode",
                serviceType: "maps",
                requestBody: `address=${searchTerm}&components=${countryCode ? `country:${countryCode}` : ''}`
            });

            return googleAddresses.map(googleAddress => {
                const {address_components = [], formatted_address, geometry = {}, place_id} = googleAddress;
                const {location} = geometry;

                const address = {
                    id: place_id,
                    formattedAddress: formatted_address,
                    long: location ? location.lng : undefined,
                    lat: location ? location.lat : undefined,
                } as IAddress;

                const _extractAddressComponent = (addressComponent, propertyName, typeName) => {
                    if(!address[propertyName] && addressComponent.types.indexOf(typeName) > -1) {
                        address[propertyName] = addressComponent.long_name;
                    }
                }

                address_components.forEach(addressComponent => {
                    [
                        ["streetNumber", "street_number"],
                        ["streetName", "route"],
                        ["city", "locality"],
                        ["state", "administrative_area_level_1"],
                        ["country", "country"],
                        ["postCode", "postal_code"],
                    ].forEach(pair => _extractAddressComponent(addressComponent, pair[0], pair[1]));
                });

                return address;

            })
        }
    }
}