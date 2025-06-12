import { Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { ViesService } from 'projects/viescloud-utils/src/lib/service/rest.service';

export const defaultRxStompConfig: RxStompConfig = {
  // Which server?
  // brokerURL: `ws://${ensibleEnvironment.api_host}:${ensibleEnvironment.api_port}/api/v1/ws`,
  // brokerURL: 'ws://127.0.0.1:15674/ws',

  // Headers
  // Typical keys: login, passcode, host
  // connectHeaders: {},

  // How often to heartbeat?
  // Interval in milliseconds, set to 0 to disable
  heartbeatIncoming: 0, // Typical value 0 - disabled
  heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

  // Wait in milliseconds before attempting auto reconnect
  // Set to 0 to disable
  // Typical value 500 (500 milli seconds)
  reconnectDelay: 200,

  // Will log diagnostics on console
  // It can be quite verbose, not recommended in production
  // Skip this key to stop logging to console
  // debug: (msg: string): void => {
  //   console.log(new Date(), msg);
  // },
};

@Injectable({
  providedIn: 'root'
})
export class EnsibleWebsocketService extends RxStomp {

  private topicPrefix = '/api/v1/topic'

  constructor(
    private ensibleAuthenticator: AuthenticatorService
  ) {
    super();
  }

  connect() {
    if(this.isConnected()) {
      return;
    }

    let uri = ViesService.getParseUri();
    let config = structuredClone(defaultRxStompConfig);
    // config.brokerURL = `ws://${uri?.host}${uri?.port ? `:${uri?.port}` : ''}/api/v1/ws`;
    config.brokerURL = `${uri.schema === 'http' ? 'ws' : 'wss'}://${uri?.host}${uri?.port ? `:${uri?.port}` : ''}/api/v1/ws?token=${this.ensibleAuthenticator.currentJwtToken}`;
    // config.connectHeaders = {
    //   'Authorization': `Bearer ${this.ensibleAuthenticator.getToken()}`
    // }
    // config.beforeConnect = (c: RxStomp) => {
    //   return new Promise<void>((resolve, reject) => {
    //     c.configure({
    //       connectHeaders: {
    //         'Authorization': `Bearer ${this.ensibleAuthenticator.getToken()}`
    //       }
    //     });
    //     resolve();
    //   });
    // }
    this.configure(config);
    this.activate();
  }

  disconnect() {
    if(this.isConnected()) {
      this.deactivate();
    }
  }

  isConnected() {
    return this.stompClient.connected;
  }

  watchForEnsibleTopic(topic: string) {
    if(!this.isConnected())
      this.connect();

    if(topic.startsWith(this.topicPrefix)) {
      return this.watch(topic);
    }
    else {
      if(topic.startsWith('/')) {
        topic = topic.substring(1);
      }

      return this.watch(`${this.topicPrefix}/${topic}`);
    }
  }

  watchForTopic(topic: string) {
    return this.watchForEnsibleTopic(topic);
  }
}
