import { HttpClient } from "@angular/common/http";
import { UserGroup } from "../model/authenticator.model";
import { ViesRestService } from "./rest.service";
import { Injectable } from "@angular/core";
import { MatOption } from "../model/mat.model";
import { map } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class UserGroupService extends ViesRestService<UserGroup> {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  override newBlankObject(): UserGroup {
    return new UserGroup();
  }

  override getIdFieldValue(object: UserGroup) {
    return object.id;
  }

  override setIdFieldValue(object: UserGroup, id: any): void {
    object.id = id;
  }

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'user', 'groups'];
  }

  getAllPublicGroupIdOptions() {
    return this.getAll().pipe(map(res => {
      let options: MatOption<string>[] = [];
      res.forEach(e => {
        options.push({
          value: e.id + '',
          valueLabel: e.name
        });
      })
      return options;
    }))
  }
}