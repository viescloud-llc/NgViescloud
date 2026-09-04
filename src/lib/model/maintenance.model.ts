import { ViesDateTime } from './vies.model';
import { MatInputDisable, MatInputDisplayLabel, MatInputHide, MatInputTextArea, MatTableHide } from './mat.model';

// Mirrors vies-spring-utils auto/model/maintenance/MaintenanceWindow (6.5.0).
// The app is "in maintenance" when ANY window is effective: manual `active`, or
// a schedule covering now. `MANUAL_TOGGLE` is the reserved name the toggle
// endpoint maintains.
export class MaintenanceWindow {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Name')
    name: string = '';

    @MatInputTextArea()
    @MatInputDisplayLabel('Message shown to users')
    message: string = '';

    @MatInputDisplayLabel('Active now (manual switch)')
    active: boolean = false;

    // Rendered by dedicated pickers, not the dynamic form.
    @MatInputHide()
    @MatTableHide()
    startAt?: ViesDateTime;

    @MatInputHide()
    @MatTableHide()
    endAt?: ViesDateTime;

    @MatInputHide()
    @MatTableHide()
    createdByUserId?: string;
}

export const MAINTENANCE_MANUAL_WINDOW_NAME = 'MANUAL_TOGGLE';

// GET /api/v1/maintenance/status and the 503 body. `maintenance: true` is the
// marker clients use to recognise a maintenance rejection.
export interface MaintenanceStatus {
    maintenance: boolean;
    active: boolean;
    message?: string;
    windowId?: string;
    windowName?: string;
    startAt?: ViesDateTime;
    endAt?: ViesDateTime;
    nextMessage?: string;
    nextStartAt?: ViesDateTime;
    nextEndAt?: ViesDateTime;
    serverTime?: ViesDateTime;
}
