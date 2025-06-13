import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { User, UserGroup } from '../model/authenticator.model';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, filter, first, interval, map, switchMap, tap, throwError } from 'rxjs';
import { ViesService } from './rest.service';
import { AliasChangeRequest, AuthEvent, AuthResponse, LoginRequest, Oauth2LoginRequest, PasswordChangeRequest, RefreshTokenRequest, RegisterRequest } from '../model/vies.model';
import { StringUtils } from '../util/String.utils';
import { OpenIDProvider } from '../model/open-id.model';
import { Router } from '@angular/router';
import { DialogUtils } from '../util/Dialog.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatorService implements OnDestroy {
  private readonly sessionStorageKey = 'auth_refresh_token';
  private readonly reloadJwtInterval = 5 * 60 * 1000; // 5 minutes
  private readonly reloadUserInterval = 3 * 60 * 1000; // 3 minutes

  // State management
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private authEvents$ = new BehaviorSubject<AuthEvent | null>(null);
  private initializationComplete$ = new BehaviorSubject<boolean>(false);
  private currentJwt: string | null = null;
  private currentRefreshToken: string | null = null;

  // Intervals and subscriptions
  private userFetchInterval: Subscription | null = null;
  private jwtRefreshInterval: Subscription | null = null;

  isloginWithOauth2 = false;
  openIdProvider?: OpenIDProvider;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private dialogUtils: DialogUtils
  ) {
    setTimeout(() => {
      this.initializeService();
    })
    // this.initializeService();
  }
  
  protected getURI(): string {
    return ViesService.getUri();  
  }

  protected getPrefixPath(): string {
    let prefixes = this.getPrefixes();
    let path = "";
    prefixes.forEach(e => {
        path += `/${e}`;
    });
    return path;
  }

  protected getPrefixes(): string[] {
    return ['api', 'v1', 'authenticators']
  }

  public getPrefixUri(): string {
    return `${this.getURI()}${this.getPrefixPath()}`;
  }

  // Public observables for components to subscribe to
  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  get authEvents(): Observable<AuthEvent | null> {
    return this.authEvents$.asObservable().pipe(
      filter(event => event !== null)
    );
  }

  get currentJwtToken(): string | null {
    return this.currentJwt;
  }

  get currentUser(): User | null {
    return this.currentUser$.value;
  }

  get initialized$(): Observable<boolean> {
    return this.initializationComplete$.pipe(
      filter(initialized => initialized === true),
      first()
    );
  }

  isInitialized(): boolean {
    return this.initializationComplete$.value === true;
  }

  hasSessionRefreshToken(): boolean {
    return (this.currentRefreshToken !== null) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(this.sessionStorageKey) !== null);
  }

  getCurrentUserAliasOrUsername() {
    if (this.isAuthenticatedSync()) {
      return this.currentUser?.alias ?? this.currentUser?.username ?? '';
    }
    else {
      return '';
    }
  }

  // Subscription methods for login/logout events
  onLogin(callback: (user: User) => void): Subscription {
    return this.authEvents$.pipe(
      filter(event => event?.type === 'login' && event.user !== undefined)
    ).subscribe(event => callback(event!.user!));
  }

  onLogout(callback: () => void): Subscription {
    return this.authEvents$.pipe(
      filter(event => event?.type === 'logout')
    ).subscribe(() => callback());
  }

  onTimeoutLogout(callback: () => void): Subscription {
    return this.authEvents$.pipe(
      filter(event => event?.type === 'timeout logout')
    ).subscribe(() => callback());
  }

  // Synchronous authentication check methods
  private matchUserGroup(userGroups: UserGroup[], userGroupNameOrId: string): boolean {
    if(!userGroups) {
      return false;
    }

    if(StringUtils.isNumber(userGroupNameOrId)) {
      return userGroups.some(group => group.id === Number(userGroupNameOrId));
    }
    else {
      return userGroups.some(group => group.name === userGroupNameOrId);
    }
  }

  isAuthenticatedSync(): boolean {
    return this.isAuthenticated$.value && this.currentJwt !== null;
  }

  isAuthenticatedWithUserGroup(userGroupNameOrId: string): boolean {
    const user = this.currentUser$.value;
    const isAuth = this.isAuthenticatedSync();

    if (!isAuth || !user || !user.userGroups) {
      return false;
    }

    return this.matchUserGroup(user.userGroups, userGroupNameOrId);
  }

  hasUserGroup(userGroupNameOrId: string): boolean {
    return this.isAuthenticatedWithUserGroup(userGroupNameOrId);
  }

  hasAnyUserGroup(userGroupNamesOrIds: string[]): boolean {
    const user = this.currentUser$.value;

    if (!this.isAuthenticatedSync() || !user || !user.userGroups) {
      return false;
    }

    return userGroupNamesOrIds.some(groupNameOrId =>
      this.matchUserGroup(user.userGroups, groupNameOrId)
    );
  }

  hasAllUserGroups(userGroupNamesOrIds: string[]): boolean {
    const user = this.currentUser$.value;

    if (!this.isAuthenticatedSync() || !user || !user.userGroups) {
      return false;
    }

    return userGroupNamesOrIds.every(groupNameOrId =>
      this.matchUserGroup(user.userGroups, groupNameOrId)
    );
  }

  getUserGroups(): UserGroup[] {
    const user = this.currentUser$.value;
    return user?.userGroups || [];
  }

  // Observable versions for reactive programming
  isAuthenticatedWithUserGroup$(userGroupNameOrId: string): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => {
        const isAuth = this.isAuthenticatedSync();

        if (!isAuth || !user || !user.userGroups) {
          return false;
        }

        return this.matchUserGroup(user.userGroups, userGroupNameOrId);
      })
    );
  }

  hasUserGroup$(userGroupNameOrId: string): Observable<boolean> {
    return this.isAuthenticatedWithUserGroup$(userGroupNameOrId);
  }

  hasAnyUserGroup$(userGroupNamesOrIds: string[]): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => {
        if (!this.isAuthenticatedSync() || !user || !user.userGroups) {
          return false;
        }

        return userGroupNamesOrIds.some(groupNameOrId =>
          this.matchUserGroup(user.userGroups, groupNameOrId)
        );
      })
    );
  }

  hasAllUserGroups$(userGroupNamesOrIds: string[]): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => {
        if (!this.isAuthenticatedSync() || !user || !user.userGroups) {
          return false;
        }

        return userGroupNamesOrIds.every(groupNameOrId =>
          this.matchUserGroup(user.userGroups, groupNameOrId)
        );
      })
    );
  }

  // Initialize service - load refresh token and start intervals
  private initializeService(): void {
    this.loadRefreshTokenFromSession();

    if (this.currentRefreshToken) {
      this.refreshJwtToken().subscribe({
        next: () => {
          this.startIntervals();
          this.initializationComplete$.next(true);
        },
        error: () => {
          this.logout();
          this.initializationComplete$.next(true);
        }
      });
    }
    else {
      this.initializationComplete$.next(true);
    }
  }

  // Authentication methods
  login(credentials: LoginRequest): Observable<User> {
    return this.httpClient.post<AuthResponse>(`${this.getPrefixUri()}/login`, credentials).pipe(
      switchMap(response => this.handleAuthSuccess(response)),
      tap(() => this.isloginWithOauth2 = true),
      catchError(error => this.handleError(error))
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.httpClient.post<AuthResponse>(`${this.getPrefixUri()}/register`, userData).pipe(
      switchMap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleError(error))
    );
  }

  loginOAuth2(oauth2Data: Oauth2LoginRequest, openIdProvider?: OpenIDProvider): Observable<User> {
    this.openIdProvider = openIdProvider;
    return this.httpClient.post<{ jwt: string }>(`${this.getPrefixUri()}/login/oauth2`, oauth2Data).pipe(
      tap(response => {
        this.currentJwt = response.jwt;
      }),
      switchMap(() => this.fetchCurrentUser()),
      tap(() => this.startIntervals()),
      tap(() => this.isloginWithOauth2 = true),
      catchError(error => this.handleError(error))
    );
  }

  logout(type: 'logout' | 'timeout logout' = 'logout'): void {
    const refreshRequest: RefreshTokenRequest = {
      refreshToken: structuredClone(this.currentRefreshToken) ?? ''
    };

    this.stopIntervals();
    this.currentJwt = null;
    this.currentRefreshToken = null;
    this.removeRefreshTokenFromSession();
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
    this.authEvents$.next({ type: type });

    this.httpClient.delete<void>(`${this.getPrefixUri()}/logout`, {body: refreshRequest}).subscribe();
  }

  logOutManually() {
    this.logout();
    if(this.isloginWithOauth2) {
      this.isloginWithOauth2 = false;
      if(this.openIdProvider && this.openIdProvider.endSessionEndpoint) {
        this.dialogUtils.openConfirmDialog("logout", "Do you want to logout from OAuth2 provider too?", 'yes', 'no').then(res => {
          this.router.navigate(["/"]).then(result => { window.location.href = this.openIdProvider!.endSessionEndpoint; });
        });
      }
    }
  }

  // User management methods
  getCurrentUser(): Observable<User> {
    if (!this.currentJwt) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.currentJwt}`
    });

    return this.httpClient.get<User>(`${this.getPrefixUri()}/user`, { headers }).pipe(
      tap(user => this.currentUser$.next(user)),
      catchError(error => this.handleError(error))
    );
  }

  updatePassword(passwordData: PasswordChangeRequest): Observable<User> {
    if (!this.currentJwt) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.currentJwt}`
    });

    return this.httpClient.put<User>(`${this.getPrefixUri()}/user/password`, passwordData, { headers }).pipe(
      tap(user => this.currentUser$.next(user)),
      catchError(error => this.handleError(error))
    );
  }

  updateAlias(aliasData: AliasChangeRequest): Observable<User> {
    if (!this.currentJwt) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.currentJwt}`
    });

    return this.httpClient.put<User>(`${this.getPrefixUri()}/user/alias`, aliasData, { headers }).pipe(
      tap(user => this.currentUser$.next(user)),
      catchError(error => this.handleError(error))
    );
  }

  // Validation methods
  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);

    return this.httpClient.get<void>(`${this.getPrefixUri()}/exist/email`, { params }).pipe(
      map(() => false), // If no error, email doesn't exist
      catchError(() => [true]) // If error, email exists
    );
  }

  checkUsernameExists(username: string): Observable<boolean> {
    const params = new HttpParams().set('username', username);

    return this.httpClient.get<void>(`${this.getPrefixUri()}/exist/username`, { params }).pipe(
      map(() => false), // If no error, username doesn't exist
      catchError(() => [true]) // If error, username exists
    );
  }

  // JWT refresh method
  refreshJwtToken(): Observable<void> {
    if (!this.currentRefreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshRequest: RefreshTokenRequest = {
      refreshToken: this.currentRefreshToken
    };

    return this.httpClient.post<AuthResponse>(`${this.getPrefixUri()}/jwt/refresh`, refreshRequest).pipe(
      tap(response => {
        this.currentJwt = response.jwt;
        this.currentRefreshToken = response.refreshToken;
        this.saveRefreshTokenToSession();
      }),
      tap(() => {
        if(!this.currentUser) {
          this.fetchCurrentUser().subscribe();
        }
      }),
      map(() => void 0),
      catchError(error => {
        this.logout('timeout logout');
        return this.handleError(error);
      })
    );
  }

  // Private methods
  private handleAuthSuccess(response: AuthResponse): Observable<User> {
    this.currentJwt = response.jwt;
    this.currentRefreshToken = response.refreshToken;
    this.saveRefreshTokenToSession();

    return this.fetchCurrentUser().pipe(
      tap(() => this.startIntervals())
    );
  }

  private fetchCurrentUser(): Observable<User> {
    return this.getCurrentUser().pipe(
      tap(user => {
        this.isAuthenticated$.next(true);
        this.authEvents$.next({ type: 'login', user });
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private startIntervals(): void {
    this.stopIntervals();

    this.userFetchInterval = interval(this.reloadUserInterval).pipe(
      switchMap(() => this.getCurrentUser()),
      catchError(error => {
        console.error('Error fetching user:', error);
        return [];
      })
    ).subscribe();

    this.jwtRefreshInterval = interval(this.reloadJwtInterval).pipe(
      switchMap(() => this.refreshJwtToken()),
      catchError(error => {
        console.error('Error refreshing JWT:', error);
        this.logout();
        return [];
      })
    ).subscribe();
  }

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

  private saveRefreshTokenToSession(): void {
    if (this.currentRefreshToken && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.sessionStorageKey, this.currentRefreshToken);
    }
  }

  private loadRefreshTokenFromSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem(this.sessionStorageKey);
      if (token) {
        this.currentRefreshToken = token;
      }
    }
  }

  private removeRefreshTokenFromSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.sessionStorageKey);
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error('AuthenticationService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Angular OnDestroy lifecycle
  ngOnDestroy(): void {
    this.stopIntervals();
    this.currentUser$.complete();
    this.isAuthenticated$.complete();
    this.authEvents$.complete();
  }
}
