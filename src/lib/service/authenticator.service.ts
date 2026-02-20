import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { User, UserGroup } from '../model/authenticator.model';
import { Observable, Subscription, catchError, filter, first, interval, map, switchMap, tap, throwError } from 'rxjs';
import { ViesService } from './rest.service';
import { AliasChangeRequest, AuthEvent, AuthResponse, LoginRequest, Oauth2LoginRequest, PasswordChangeRequest, RefreshTokenRequest, RegisterRequest } from '../model/vies.model';
import { StringUtils } from '../util/String.utils';
import { OpenIDProvider } from '../model/open-id.model';
import { Router } from '@angular/router';
import { DialogUtils } from '../util/Dialog.utils';
import { environment } from '../../environments/environment.prod';

/**
 * Configuration options for AuthenticatorService
 */
export interface AuthenticatorServiceConfig {
  /** JWT refresh interval in milliseconds (default: 5 minutes) */
  jwtRefreshInterval?: number;
  /** User data refresh interval in milliseconds (default: 3 minutes) */
  userRefreshInterval?: number;
  /** Enable debug logging (default: false) */
  debugMode?: boolean;
  /** Session storage key for refresh token (default: 'auth_refresh_token') */
  sessionStorageKey?: string;
}

/**
 * Modern AuthenticatorService using Angular Signals
 * Provides authentication state management with reactive signals
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticatorService implements OnDestroy {
  // Configuration
  private config: Required<AuthenticatorServiceConfig> = {
    jwtRefreshInterval: 5 * 60 * 1000, // 5 minutes
    userRefreshInterval: 3 * 60 * 1000, // 3 minutes
    debugMode: false,
    sessionStorageKey: 'auth_refresh_token'
  };

  // Core state signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _authEvents = signal<AuthEvent | null>(null);
  private readonly _initialized = signal<boolean>(false);
  private readonly _jwt = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);

  // OAuth2 state
  private readonly _isOAuth2Login = signal<boolean>(false);
  private readonly _openIdProvider = signal<OpenIDProvider | undefined>(undefined);

  // Readonly signals for public access
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly isOAuth2Login = this._isOAuth2Login.asReadonly();
  readonly openIdProvider = this._openIdProvider.asReadonly();

  // Computed signals for user information
  readonly currentUserAlias = computed(() => {
    const user = this._currentUser();
    return user?.alias ?? user?.username ?? '';
  });

  readonly userGroups = computed(() => {
    return this._currentUser()?.userGroups ?? [];
  });

  // Observable conversions for backward compatibility
  readonly user$ = toObservable(this._currentUser);
  readonly isAuthenticated$ = toObservable(this._isAuthenticated);
  readonly authEvents$ = toObservable(this._authEvents).pipe(
    filter(event => event !== null)
  );
  readonly initialized$ = toObservable(this._initialized).pipe(
    filter(initialized => initialized === true),
    first()
  );

  // Interval subscriptions
  private userFetchInterval: Subscription | null = null;
  private jwtRefreshInterval: Subscription | null = null;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private dialogUtils: DialogUtils
  ) {
    // Initialize service asynchronously to avoid construction blocking
    setTimeout(() => this.initializeService(), 0);
  }

  // ========================================
  // Configuration
  // ========================================

  /**
   * Configure the service with custom options
   * Should be called before the service initializes
   */
  configure(config: AuthenticatorServiceConfig): void {
    this.config = { ...this.config, ...config };
    this.log('Configured with options:', this.config);
  }

  // ========================================
  // API Endpoint Helpers
  // ========================================

  protected getURI(): string {
    return ViesService.getUri();
  }

  protected getPrefixes(): string[] {
    return ['api', 'v1', 'authenticators'];
  }

  protected getPrefixPath(): string {
    return this.getPrefixes().map(p => `/${p}`).join('');
  }

  public getPrefixUri(): string {
    return `${this.getURI()}${this.getPrefixPath()}`;
  }

  // ========================================
  // Initialization
  // ========================================

  /**
   * Initialize the authentication service
   * Loads refresh token from session and attempts to restore session
   */
  private initializeService(): void {
    this.log('Initializing service...');
    this.loadRefreshTokenFromSession();

    const refreshToken = this._refreshToken();
    if (refreshToken) {
      this.log('Found refresh token, attempting to restore session');
      this.refreshJwtToken().subscribe({
        next: () => {
          this.log('Session restored successfully');
          this.startIntervals();
          this._initialized.set(true);
        },
        error: (error) => {
          this.logError('Failed to restore session:', error);
          this.logout();
          this._initialized.set(true);
        }
      });
    } else {
      this.log('No refresh token found, skipping session restore');
      this._initialized.set(true);
    }
  }

  /**
   * Check if the service has been initialized
   */
  isInitialized(): boolean {
    return this._initialized();
  }

  /**
   * Check if a refresh token exists in session storage
   */
  hasSessionRefreshToken(): boolean {
    return (
      this._refreshToken() !== null ||
      (typeof sessionStorage !== 'undefined' &&
       sessionStorage.getItem(this.config.sessionStorageKey) !== null)
    );
  }

  // ========================================
  // Authentication Methods
  // ========================================

  /**
   * Login with username/email and password
   */
  login(credentials: LoginRequest): Observable<User> {
    this.log('Logging in...');
    return this.httpClient.post<AuthResponse>(`${this.getPrefixUri()}/login`, credentials).pipe(
      switchMap(response => this.handleAuthSuccess(response)),
      tap(() => {
        this._isOAuth2Login.set(false);
        this.log('Login successful');
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Register a new user
   */
  register(userData: RegisterRequest): Observable<User> {
    this.log('Registering new user...');
    return this.httpClient.post<AuthResponse>(`${this.getPrefixUri()}/register`, userData).pipe(
      switchMap(response => this.handleAuthSuccess(response)),
      tap(() => this.log('Registration successful')),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Login with OAuth2
   */
  loginOAuth2(oauth2Data: Oauth2LoginRequest, openIdProvider?: OpenIDProvider): Observable<User> {
    this.log('Logging in with OAuth2...');
    this._openIdProvider.set(openIdProvider);

    return this.httpClient.post<AuthResponse>(`${this.getPrefixUri()}/login/oauth2`, oauth2Data).pipe(
      tap(response => {
        this._jwt.set(response.jwt);
        this._refreshToken.set(response.refreshToken);
        this.saveRefreshTokenToSession();
      }),
      switchMap(() => this.fetchCurrentUser()),
      tap(() => {
        this.startIntervals();
        this._isOAuth2Login.set(true);
        this.log('OAuth2 login successful');
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Logout the current user
   */
  logout(type: 'logout' | 'timeout logout' = 'logout'): void {
    this.log('Logging out, type:', type);

    const refreshRequest: RefreshTokenRequest = {
      refreshToken: this._refreshToken() ?? ''
    };

    this.stopIntervals();
    this._jwt.set(null);
    this._refreshToken.set(null);
    this.removeRefreshTokenFromSession();
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this._authEvents.set({ type: type });

    // Call logout endpoint (fire and forget)
    this.httpClient
      .delete<void>(`${this.getPrefixUri()}/logout`, { body: refreshRequest })
      .subscribe({
        error: (error) => this.logError('Error during logout API call:', error)
      });
  }

  /**
   * Manually logout with navigation and OAuth2 provider logout prompt
   */
  logOutManually(): void {
    this.logout();
    this.router.navigate([environment.endpoint_login]);

    if (this._isOAuth2Login()) {
      this._isOAuth2Login.set(false);
      const provider = this._openIdProvider();

      if (provider?.endSessionEndpoint) {
        this.dialogUtils
          .openConfirmDialog(
            'logout',
            'Do you want to logout from OAuth2 provider too?',
            'yes',
            'no'
          )
          .then(() => {
            this.router.navigate(['/']).then(() => {
              window.location.href = provider.endSessionEndpoint;
            });
          })
          .catch(() => {
            // User declined OAuth2 provider logout
          });
      }
    }
  }

  // ========================================
  // User Management
  // ========================================

  /**
   * Fetch the current authenticated user
   */
  getCurrentUser(): Observable<User> {
    const jwt = this._jwt();
    if (!jwt) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${jwt}`
    });

    return this.httpClient.get<User>(`${this.getPrefixUri()}/user`, { headers }).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.log('User data fetched:', user.username);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Update user password
   */
  updatePassword(passwordData: PasswordChangeRequest): Observable<User> {
    const jwt = this._jwt();
    if (!jwt) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${jwt}`
    });

    return this.httpClient
      .put<User>(`${this.getPrefixUri()}/user/password`, passwordData, { headers })
      .pipe(
        tap(user => {
          this._currentUser.set(user);
          this.log('Password updated successfully');
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Update user alias
   */
  updateAlias(aliasData: AliasChangeRequest): Observable<User> {
    const jwt = this._jwt();
    if (!jwt) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${jwt}`
    });

    return this.httpClient
      .put<User>(`${this.getPrefixUri()}/user/alias`, aliasData, { headers })
      .pipe(
        tap(user => {
          this._currentUser.set(user);
          this.log('Alias updated successfully');
        }),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================
  // User Group Checks (Signal-Based)
  // ========================================

  /**
   * Check if user belongs to a specific group (signal-based)
   * Use as: auth.hasUserGroupSignal()('ADMIN')
   */
  private hasUserGroupSignal = computed(() => {
    return (userGroupNameOrId: string): boolean => {
      const user = this._currentUser();
      const isAuth = this._isAuthenticated();

      if (!isAuth || !user?.userGroups) {
        return false;
      }

      return this.matchUserGroup(user.userGroups, userGroupNameOrId);
    };
  });

  /**
   * Check if user belongs to any of the specified groups (signal-based)
   * Use as: auth.hasAnyUserGroupSignal()(['ADMIN', 'USER'])
   */
  private hasAnyUserGroupSignal = computed(() => {
    return (userGroupNamesOrIds: string[]): boolean => {
      const user = this._currentUser();
      const isAuth = this._isAuthenticated();

      if (!isAuth || !user?.userGroups) {
        return false;
      }

      return userGroupNamesOrIds.some(groupNameOrId =>
        this.matchUserGroup(user.userGroups, groupNameOrId)
      );
    };
  });

  /**
   * Check if user belongs to all of the specified groups (signal-based)
   * Use as: auth.hasAllUserGroupsSignal()(['ADMIN', 'USER'])
   */
  private hasAllUserGroupsSignal = computed(() => {
    return (userGroupNamesOrIds: string[]): boolean => {
      const user = this._currentUser();
      const isAuth = this._isAuthenticated();

      if (!isAuth || !user?.userGroups) {
        return false;
      }

      return userGroupNamesOrIds.every(groupNameOrId =>
        this.matchUserGroup(user.userGroups, groupNameOrId)
      );
    };
  });

  /**
   * Get user groups (returns signal)
   */
  getUserGroups(): UserGroup[] {
    return this._currentUser()?.userGroups ?? [];
  }

  /**
   * Observable version: Check if user has a specific group
   */
  hasUserGroup$(userGroupNameOrId: string): Observable<boolean> {
    return this.user$.pipe(
      map(user => {
        if (!this._isAuthenticated() || !user?.userGroups) {
          return false;
        }
        return this.matchUserGroup(user.userGroups, userGroupNameOrId);
      })
    );
  }

  /**
   * Observable version: Check if user has any of the specified groups
   */
  hasAnyUserGroup$(userGroupNamesOrIds: string[]): Observable<boolean> {
    return this.user$.pipe(
      map(user => {
        if (!this._isAuthenticated() || !user?.userGroups) {
          return false;
        }
        return userGroupNamesOrIds.some(groupNameOrId =>
          this.matchUserGroup(user.userGroups, groupNameOrId)
        );
      })
    );
  }

  /**
   * Observable version: Check if user has all of the specified groups
   */
  hasAllUserGroups$(userGroupNamesOrIds: string[]): Observable<boolean> {
    return this.user$.pipe(
      map(user => {
        if (!this._isAuthenticated() || !user?.userGroups) {
          return false;
        }
        return userGroupNamesOrIds.every(groupNameOrId =>
          this.matchUserGroup(user.userGroups, groupNameOrId)
        );
      })
    );
  }

  /**
   * Helper method to match user groups by name or ID
   */
  private matchUserGroup(userGroups: UserGroup[], userGroupNameOrId: string): boolean {
    if (!userGroups) {
      return false;
    }

    if (StringUtils.isNumber(userGroupNameOrId)) {
      return userGroups.some(group => group.id === Number(userGroupNameOrId));
    } else {
      return userGroups.some(group => group.name === userGroupNameOrId);
    }
  }

  // ========================================
  // Backward Compatibility Methods
  // ========================================

  /**
   * Get auth events observable (backward compatibility)
   * @deprecated Use authEvents$ instead
   */
  get authEvents(): Observable<AuthEvent | null> {
    return this.authEvents$;
  }

  /**
   * Get current user (backward compatibility)
   */
  get currentUser(): User | null {
    return this._currentUser();
  }

  /**
   * Get current JWT token (backward compatibility)
   * @deprecated Use currentJwtToken() signal instead
   */
  get currentJwtToken(): string | null {
    return this._jwt();
  }

  /**
   * Check if user is authenticated (synchronous check)
   */
  isAuthenticatedSync(): boolean {
    return this._isAuthenticated() && this._jwt() !== null;
  }

  /**
   * Get current user alias or username
   */
  getCurrentUserAliasOrUsername(): string {
    return this.currentUserAlias();
  }

  /**
   * Check if user has a specific group (method version for backward compatibility)
   */
  hasUserGroup(userGroupNameOrId: string): boolean {
    return this.hasUserGroupSignal()(userGroupNameOrId);
  }

  /**
   * Check if user has any of the specified groups (method version)
   */
  hasAnyUserGroup(userGroupNamesOrIds: string[]): boolean {
    return this.hasAnyUserGroupSignal()(userGroupNamesOrIds);
  }

  /**
   * Check if user has all of the specified groups (method version)
   */
  hasAllUserGroups(userGroupNamesOrIds: string[]): boolean {
    return this.hasAllUserGroupsSignal()(userGroupNamesOrIds);
  }

  /**
   * Check if user is authenticated with a specific group (backward compatibility)
   */
  isAuthenticatedWithUserGroup(userGroupNameOrId: string): boolean {
    return this.hasUserGroup(userGroupNameOrId);
  }

  /**
   * Observable version: Check if user is authenticated with a specific group
   */
  isAuthenticatedWithUserGroup$(userGroupNameOrId: string): Observable<boolean> {
    return this.hasUserGroup$(userGroupNameOrId);
  }

  // ========================================
  // Event Subscriptions (Backward Compatibility)
  // ========================================

  /**
   * Subscribe to login events
   */
  onLogin(callback: (user: User) => void): Subscription {
    return this.authEvents$
      .pipe(filter(event => event?.type === 'login' && event.user !== undefined))
      .subscribe(event => callback(event!.user!));
  }

  /**
   * Subscribe to logout events
   */
  onLogout(callback: () => void): Subscription {
    return this.authEvents$
      .pipe(filter(event => event?.type === 'logout'))
      .subscribe(() => callback());
  }

  /**
   * Subscribe to timeout logout events
   */
  onTimeoutLogout(callback: () => void): Subscription {
    return this.authEvents$
      .pipe(filter(event => event?.type === 'timeout logout'))
      .subscribe(() => callback());
  }

  // ========================================
  // Validation Methods
  // ========================================

  /**
   * Check if an email already exists
   */
  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);

    return this.httpClient.get<void>(`${this.getPrefixUri()}/exist/email`, { params }).pipe(
      map(() => false), // If no error, email doesn't exist
      catchError(() => [true]) // If error, email exists
    );
  }

  /**
   * Check if a username already exists
   */
  checkUsernameExists(username: string): Observable<boolean> {
    const params = new HttpParams().set('username', username);

    return this.httpClient.get<void>(`${this.getPrefixUri()}/exist/username`, { params }).pipe(
      map(() => false), // If no error, username doesn't exist
      catchError(() => [true]) // If error, username exists
    );
  }

  // ========================================
  // JWT Token Management
  // ========================================

  /**
   * Refresh the JWT token using the refresh token
   */
  refreshJwtToken(): Observable<void> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshRequest: RefreshTokenRequest = {
      refreshToken: refreshToken
    };

    return this.httpClient
      .post<AuthResponse>(`${this.getPrefixUri()}/jwt/refresh`, refreshRequest)
      .pipe(
        tap(response => {
          this._jwt.set(response.jwt);
          this._refreshToken.set(response.refreshToken);
          this.saveRefreshTokenToSession();
          this.log('JWT token refreshed');
        }),
        tap(() => {
          // Fetch user if not already loaded
          if (!this._currentUser()) {
            this.fetchCurrentUser().subscribe();
          }
        }),
        map(() => void 0),
        catchError(error => {
          this.logError('JWT refresh failed:', error);
          this.logout('timeout logout');
          return this.handleError(error);
        })
      );
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Handle successful authentication response
   */
  private handleAuthSuccess(response: AuthResponse): Observable<User> {
    this._jwt.set(response.jwt);
    this._refreshToken.set(response.refreshToken);
    this.saveRefreshTokenToSession();

    return this.fetchCurrentUser().pipe(tap(() => this.startIntervals()));
  }

  /**
   * Fetch current user and emit login event
   */
  private fetchCurrentUser(): Observable<User> {
    return this.getCurrentUser().pipe(
      tap(user => {
        this._isAuthenticated.set(true);
        this._authEvents.set({ type: 'login', user });
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Start periodic JWT refresh and user data sync
   */
  private startIntervals(): void {
    this.stopIntervals();
    this.log('Starting auto-refresh intervals');

    // User data refresh interval
    this.userFetchInterval = interval(this.config.userRefreshInterval)
      .pipe(
        switchMap(() => this.getCurrentUser()),
        catchError(error => {
          this.logError('Error fetching user:', error);
          return [];
        })
      )
      .subscribe();

    // JWT refresh interval
    this.jwtRefreshInterval = interval(this.config.jwtRefreshInterval)
      .pipe(
        switchMap(() => this.refreshJwtToken()),
        catchError(error => {
          this.logError('Error refreshing JWT:', error);
          this.logout();
          return [];
        })
      )
      .subscribe();
  }

  /**
   * Stop all periodic intervals
   */
  private stopIntervals(): void {
    if (this.userFetchInterval) {
      this.userFetchInterval.unsubscribe();
      this.userFetchInterval = null;
    }

    if (this.jwtRefreshInterval) {
      this.jwtRefreshInterval.unsubscribe();
      this.jwtRefreshInterval = null;
    }
  }

  /**
   * Save refresh token to session storage
   */
  private saveRefreshTokenToSession(): void {
    const refreshToken = this._refreshToken();
    if (refreshToken && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.config.sessionStorageKey, refreshToken);
    }
  }

  /**
   * Load refresh token from session storage
   */
  private loadRefreshTokenFromSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem(this.config.sessionStorageKey);
      if (token) {
        this._refreshToken.set(token);
      }
    }
  }

  /**
   * Remove refresh token from session storage
   */
  private removeRefreshTokenFromSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.config.sessionStorageKey);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    this.logError('Authentication error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debugMode) {
      console.log('[AuthenticatorService]', ...args);
    }
  }

  /**
   * Log error messages
   */
  private logError(...args: any[]): void {
    console.error('[AuthenticatorService]', ...args);
  }

  // ========================================
  // Lifecycle Hooks
  // ========================================

  /**
   * Cleanup when service is destroyed
   */
  ngOnDestroy(): void {
    this.log('Destroying service...');
    this.stopIntervals();
  }
}
