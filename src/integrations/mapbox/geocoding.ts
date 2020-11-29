import {IAddress, IGeocodingClient} from "../geocoding";
import {MakeMapboxRequest} from "./index";

export function getMapboxGeocoding(makeMapboxRequest: MakeMapboxRequest): IGeocodingClient {
    return {
        searchAddress : async (searchTerm, searchAddressOptions = {}) => {

            const {countryCode} = searchAddressOptions;

            const {features = []} = await makeMapboxRequest({
                requestBody: `${searchTerm}.json?limit=10&types=address`,
                countryCode
            });

            return features.map(feature => {

                const {id, place_name, center = [0, 0], context, address, text} = feature;

                const foundAddress = {
                    id: id,
                    streetNumber: address,
                    streetName: text,
                    formattedAddress: place_name,
                    long: center[0],
                    lat: center[1]
                } as IAddress;

                const _extractAddressContext = (addressContext, propertyName, typeName) => {
                    if(!foundAddress[propertyName] && addressContext.id.indexOf(typeName) > -1) {
                        foundAddress[propertyName] = addressContext.text;
                    }
                }

                context.forEach(contextEntry => {
                    [
                        ["city", "place"],
                        ["state", "region"],
                        ["country", "country"],
                        ["postCode", "postcode"],
                    ].forEach(pair => _extractAddressContext(contextEntry, pair[0], pair[1]));
                });

                return foundAddress;
            });

        }
    }
}