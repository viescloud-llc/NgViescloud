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
