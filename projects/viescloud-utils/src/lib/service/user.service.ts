import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "../model/authenticator.model";
import { ViesRestService } from "./rest.service";
import { MatOption } from "../model/mat.model";
import { map } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class UserService extends ViesRestService<User> {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  override newBlankObject(): User {
    return new User();
  }

  override getIdFieldValue(object: User) {
    return object.id;
  }

  override setIdFieldValue(object: User, id: any): void {
    object.id = id;
  }

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'users'];
  }

  getAllPublicUser(idOrUsernameOrEmailOrAlias?: string) {
    if (idOrUsernameOrEmailOrAlias) {
      return this.httpClient.get<User[]>(`${this.getPrefixUri()}/public/${idOrUsernameOrEmailOrAlias}`);
    }
    else {
      return this.httpClient.get<User[]>(`${this.getPrefixUri()}/public`);
    }
  }

  getAllPublicUserIdOptions(idOrUsernameOrEmailOrAlias?: string) {
    return this.getAllPublicUser(idOrUsernameOrEmailOrAlias).pipe(map(res => {
      let options: MatOption<string>[] = [];
      res.forEach(e => {
        options.push({
          value: e.id + '',
          valueLabel: `id: ${e.id} - ${e.alias} <${e.email}>`
        });
      })
      return options;
    }))
  }
}