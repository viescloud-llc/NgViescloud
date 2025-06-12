import { EnsibleUserGroup } from "projects/ensible/src/app/model/ensible.model";
import { SharedUser, SharedGroup } from "./authenticator.model";
import { MatInputDisplayLabel, MatInputHide, MatInputItemSetting, MatInputRequire, MatItemSettingType, MatTableHide } from "./mat.model";

export interface OpenIdWellKnown {
  issuer?:                                string;
  authorization_endpoint?:                string;
  token_endpoint?:                        string;
  userinfo_endpoint?:                     string;
  end_session_endpoint?:                  string;
  introspection_endpoint?:                string;
  revocation_endpoint?:                   string;
  device_authorization_endpoint?:         string;
  response_types_supported?:              string[];
  response_modes_supported?:              string[];
  jwks_uri?:                              string;
  grant_types_supported?:                 string[];
  id_token_signing_alg_values_supported?: string[];
  subject_types_supported?:               string[];
  token_endpoint_auth_methods_supported?: string[];
  acr_values_supported?:                  string[];
  scopes_supported?:                      string[];
  request_parameter_supported?:           boolean;
  claims_supported?:                      string[];
  claims_parameter_supported?:            boolean;
  code_challenge_methods_supported?:      string[];
}

export class OpenIDProvider {

  @MatInputHide()
  id:                    number = 0;

  @MatInputHide()
  @MatTableHide()
  ownerUserId:           string = "";

  @MatInputHide()
  @MatTableHide()
  sharedUsers:           SharedUser[] = [new SharedUser()] as SharedUser[];

  @MatInputHide()
  @MatTableHide()
  sharedGroups:          SharedGroup[] = [new SharedGroup()] as SharedGroup[];

  @MatInputDisplayLabel('Name', 'e.g Google, Facebook, Twitter')
  name:                  string = "";

  @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
  @MatTableHide()
  description:           string = "";

  @MatInputDisplayLabel('Client ID', 'e.g 123456789.apps.googleusercontent.com')
  @MatInputRequire()
  @MatTableHide()
  clientId:              string = "";

  @MatInputDisplayLabel('Client Secret', 'e.g 123456789.apps.googleusercontent.com')
  @MatInputRequire()
  @MatTableHide()
  clientSecret:          string = "";

  @MatInputDisplayLabel('Authorization Endpoint', 'e.g https://accounts.google.com/o/oauth2/auth')
  @MatInputRequire()
  @MatTableHide()
  authorizationEndpoint: string = "";

  @MatInputDisplayLabel('Token Endpoint', 'e.g https://accounts.google.com/o/oauth2/token')
  @MatInputRequire()
  @MatTableHide()
  tokenEndpoint:         string = "";

  @MatInputDisplayLabel('User Info Endpoint', 'e.g https://www.googleapis.com/oauth2/v1/userinfo')
  @MatInputRequire()
  @MatTableHide()
  userInfoEndpoint:      string = "";

  @MatInputDisplayLabel('End Session Endpoint', 'e.g https://accounts.google.com/o/oauth2/revoke')
  @MatTableHide()
  endSessionEndpoint:    string = "";

  @MatInputHide()
  @MatTableHide()
  usernameMapping:       string = "";

  @MatInputHide()
  @MatTableHide()
  emailMapping:          string = "";

  @MatInputHide()
  @MatTableHide()
  aliasMapping:          string = "";

  @MatInputHide()
  @MatTableHide()
  groupMappings:         EnsibleUserGroup[] = [new EnsibleUserGroup()] as EnsibleUserGroup[];

  @MatTableHide()
  @MatInputDisplayLabel('Auto update user info on login if user exist (not recommended)')
  autoUpdateUserInfo:    boolean = false;
}