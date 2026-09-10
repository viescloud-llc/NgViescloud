import { MatInputDisable, MatInputDisplayLabel, MatInputHide, MatInputItemSetting, MatItemSettingType, MatTableDisplayLabel, MatTableHide } from '../../../lib/model/mat.model';
import { TrackedTimeStamp } from './tracked.model';

// One service level a carrier offers ("ups_ground" / Ground, 3–5 days).
export interface CarrierServiceLevel {
    code: string;
    name: string;
    estimatedDaysMin?: number | null;
    estimatedDaysMax?: number | null;
    enabled: boolean;
}

// A shipping carrier the store works with (table: carriers). Reference data
// today — tracking URL template, services, account/credential slots — and the
// record a CARRIER_API shipping rule points at. `integrationType` names which
// rate/label integration handles it ("none" = manual until one is built).
// Credentials are stored as entered; the resource is gated by shipping:*.
export class Carrier extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    @MatTableHide()
    id: string = '';

    @MatInputDisplayLabel('Name', 'e.g "UPS", "FedEx", "Local courier"')
    name: string = '';

    @MatInputDisplayLabel('Code', 'lower-case handle, e.g ups, fedex, local-courier')
    code: string = '';

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    @MatTableHide()
    description: string = '';

    @MatInputDisplayLabel('Active')
    active: boolean = true;

    @MatInputDisplayLabel('Integration', '"none" = manual; a registered integration key (e.g easypost, ups) once built')
    integrationType: string = 'none';

    @MatInputDisplayLabel('Account number')
    @MatTableHide()
    accountNumber: string = '';

    // Credentials: custom inputs with a show/hide switch, never in the table.
    @MatInputHide()
    @MatTableHide()
    apiKey: string = '';

    @MatInputHide()
    @MatTableHide()
    apiSecret: string = '';

    @MatInputDisplayLabel('API base URL (optional)')
    @MatTableHide()
    apiBaseUrl: string = '';

    @MatInputDisplayLabel('Sandbox / test mode')
    @MatTableHide()
    sandbox: boolean = true;

    @MatInputDisplayLabel('Tracking URL template', 'use {tracking}, e.g https://www.ups.com/track?tracknum={tracking}')
    @MatTableHide()
    trackingUrlTemplate: string = '';

    // Custom table in the editor.
    @MatInputHide()
    @MatTableDisplayLabel('Services', (c: Carrier) => (c.services ?? []).map(s => s.code).join(', '))
    services: CarrierServiceLevel[] = [] as CarrierServiceLevel[];

    @MatInputDisplayLabel('Notes')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    @MatTableHide()
    notes: string = '';
}
