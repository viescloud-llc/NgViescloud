import { MatInputDisable, MatInputDisplayLabel, MatInputHide, MatInputItemSetting, MatInputListSetting, MatItemSettingType, MatTableHide } from "../../../lib/model/mat.model";
import { Address } from "./address.model";
import { TrackedTimeStamp, TrackedTimeStampUserAccess } from "./tracked.model";

// Profile data keyed by auth-system user id.
// No `id` field — `userId` is both the @Id and the link to the auth user.
export class UserInfo extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';

    @MatInputDisplayLabel('First Name')
    firstName: string = '';

    @MatInputDisplayLabel('Last Name')
    lastName: string = '';

    @MatInputDisplayLabel('Phone Number')
    phoneNumber: string = '';

    @MatInputDisplayLabel('Avatar URL')
    avatarUrl: string = '';

    @MatInputDisplayLabel('Verified')
    verified: boolean = false;

    @MatInputDisplayLabel('Inactive')
    inactive: boolean = false;
}

// Bag of addresses per user. Set on the backend — order is not guaranteed.
export class UserAddress extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';

    @MatInputDisplayLabel('Addresses')
    @MatInputListSetting(false, true, true)
    addresses: Address[] = [new Address()];
}

export class WishProduct extends TrackedTimeStampUserAccess {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Product ID')
    productId: string = '';

    @MatInputDisplayLabel('Quantity')
    quantity: number = 0;
}

export class Review extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';

    @MatInputDisplayLabel('Product ID')
    productId: string = '';

    @MatInputDisplayLabel('Comment')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    comment: string = '';

    // BigDecimal — keep as string, e.g. '4.5'.
    @MatInputDisplayLabel('Rating')
    rating: string = '0';
}
