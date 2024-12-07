import { FSMetadata } from './ensible.model';
export class EnsibleWorkSpace {
  roles: EnsibleRole[] = [new EnsibleRole()] as EnsibleRole[];

  isRoleExist(roleName: string): boolean {
    for (const role of this.roles) {
      if (role.self.name === roleName) {
        return true;
      }
    }
    return false;
  }

  getRole(roleName: string): EnsibleRole | undefined {
    for (const role of this.roles) {
      if (role.self.name === roleName) {
        return role;
      }
    }
    return undefined;
  }
}

export class EnsibleRole {
  self: EnsibleFS = new EnsibleFS();
  defaults: EnsibleRoleDir = new EnsibleRoleDir();
  files: EnsibleRoleDir = new EnsibleRoleDir();
  handlers: EnsibleRoleDir = new EnsibleRoleDir();
  meta: EnsibleRoleDir = new EnsibleRoleDir();
  tasks: EnsibleRoleDir = new EnsibleRoleDir();
  templates: EnsibleRoleDir = new EnsibleRoleDir();
  vars: EnsibleRoleDir = new EnsibleRoleDir();
}

export class EnsibleRoleDir {
  self: EnsibleFS = new EnsibleFS();
  child: EnsibleFS[] = [new EnsibleFS()] as EnsibleFS[]
}

export class EnsibleFS {
  name: string = '';
  path: string = '';
  FSMetadata: FSMetadata = new FSMetadata();
}
