import { ViesDateTime } from './vies.model';
import { MatInputDisplayLabel, MatInputHide, MatInputRequire, MatTableDisplayLabel, MatTableHide } from './mat.model';

// Mirrors vies-spring-utils auto/model/smtp/SmtpProvider. One row = one outbound
// mail account. Credentials round-trip in the JSON (the editor needs them), so
// the whole resource is gated by `smtp:*` and the password column never renders
// in the table. `defaultSmtpProviderForUserRecovery` marks the account the
// password-reset flow (and, later, transactional mail) sends from.
export class SmtpProvider {
    @MatInputHide()
    @MatTableHide()
    id: string = '';

    @MatInputDisplayLabel('Host', 'e.g smtp.gmail.com')
    @MatInputRequire()
    host: string = '';

    @MatInputDisplayLabel('Port', '587 for STARTTLS, 465 for implicit TLS, 25 for plain')
    @MatInputRequire()
    port: number = 587;

    @MatInputDisplayLabel('Username', 'usually the full mailbox address')
    @MatInputRequire()
    username: string = '';

    // Rendered by a dedicated input with a show/hide switch, never in the table.
    @MatInputHide()
    @MatTableHide()
    password: string = '';

    @MatInputDisplayLabel('Authenticate (SMTP AUTH)')
    @MatTableDisplayLabel('Auth')
    auth: boolean = true;

    @MatInputDisplayLabel('STARTTLS (required when on)')
    @MatTableDisplayLabel('STARTTLS')
    starttls: boolean = true;

    @MatInputDisplayLabel('Default provider (password recovery & system mail)')
    @MatTableDisplayLabel('Default', (p: SmtpProvider) => p.defaultSmtpProviderForUserRecovery ? 'yes' : '')
    defaultSmtpProviderForUserRecovery: boolean = false;
}

// Mirrors auto/model/smtp/EmailMessage (the body of POST /api/v1/smtp/senders/{id}).
export interface EmailMessage {
    from: string;
    replyTo?: string | null;
    to: string[];
    cc?: string[] | null;
    bcc?: string[] | null;
    sentDate?: ViesDateTime | null;
    subject: string;
    text: string;
}

// Body of POST /api/v1/smtp/senders — provider inline, so an UNSAVED edit can be tested.
export interface Email {
    smtpProvider: SmtpProvider;
    emailMessage: EmailMessage;
}

export interface SmtpSendResult {
    status: string;
}
