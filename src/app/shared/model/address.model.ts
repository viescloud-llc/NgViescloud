import { MatInputDisplayLabel, MatInputEnum } from "../../../lib/model/mat.model";

export enum AddressType {
    BILLING = "BILLING",
    SHIPPING = "SHIPPING"
}

export class Address {
    @MatInputDisplayLabel('Street', 'e.g "123 Main St"')
    street: string = '';

    @MatInputDisplayLabel('Suite / Apt', 'e.g "Apt 4B"')
    suite: string = '';

    @MatInputDisplayLabel('City')
    city: string = '';

    @MatInputDisplayLabel('State / Province')
    state: string = '';

    @MatInputDisplayLabel('Postal Code', 'e.g "94016"')
    postalCode: string = '';

    @MatInputDisplayLabel('Country', 'e.g "US"')
    country: string = '';

    @MatInputEnum(AddressType)
    @MatInputDisplayLabel('Address Type')
    type: AddressType = AddressType.SHIPPING;
}
