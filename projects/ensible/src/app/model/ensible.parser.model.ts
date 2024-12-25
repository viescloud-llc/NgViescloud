import { FSMetadata } from './ensible.model';
export class EnsibleWorkSpace {
  playbooks: EnsibleFsDir = new EnsibleFsDir();
  roles: EnsibleRole[] = [new EnsibleRole()] as EnsibleRole[];
  secrets: EnsibleFsDir = new EnsibleFsDir();
  passwords: EnsibleFsDir = new EnsibleFsDir();
  inventory: EnsibleFsDir = new EnsibleFsDir();
  groupVars: EnsibleFsDir = new EnsibleFsDir();
  hostVars: EnsibleFsDir = new EnsibleFsDir();

  isPlaybookExist(playbookName: string): boolean {
    return this.isFsDirNameExist(playbookName, this.playbooks.child);
  }

  isRoleExist(roleName: string): boolean {
    for (const role of this.roles) {
      if (role.self.name === roleName) {
        return true;
      }
    }
    return false;
  }

  isSecretExist(secretName: string): boolean {
    return this.isFsDirNameExist(secretName, this.secrets.child);
  }

  isPasswordExist(passwordName: string): boolean {
    return this.isFsDirNameExist(passwordName, this.passwords.child);
  }

  isInventoryExist(inventoryName: string): boolean {
    return this.isFsDirNameExist(inventoryName, this.inventory.child);
  }

  isGroupVarsExist(groupVarsName: string): boolean {
    return this.isFsDirNameExist(groupVarsName, this.groupVars.child);
  }

  isHostVarsExist(hostVarsName: string): boolean {
    return this.isFsDirNameExist(hostVarsName, this.hostVars.child);
  }

  private isFsDirNameExist(name: string, fs: EnsibleFs[]): boolean {
    for(const f of fs) {
      if(f.name === name) {
        return true;
      }
    }
    return false;
  }

  getPlaybook(playbookName: string): EnsibleFs | undefined {
    return this.getFsDirByName(playbookName, this.playbooks.child);
  }

  getRole(roleName: string): EnsibleRole | undefined {
    for (const role of this.roles) {
      if (role.self.name === roleName) {
        return role;
      }
    }
    return undefined;
  }

  getSecret(secretName: string): EnsibleFs | undefined {
    return this.getFsDirByName(secretName, this.secrets.child);
  }

  getPassword(passwordName: string): EnsibleFs | undefined {
    return this.getFsDirByName(passwordName, this.passwords.child);
  }

  getInventory(inventoryName: string): EnsibleFs | undefined {
    return this.getFsDirByName(inventoryName, this.inventory.child);
  }

  getGroupVars(groupVarsName: string): EnsibleFs | undefined {
    return this.getFsDirByName(groupVarsName, this.groupVars.child);
  }

  getHostVars(hostVarsName: string): EnsibleFs | undefined {
    return this.getFsDirByName(hostVarsName, this.hostVars.child);
  }

  private getFsDirByName(name: string, fs: EnsibleFs[]): EnsibleFs | undefined {
    for (const f of fs) {
      if (f.name === name) {
        return f;
      }
    }
    return undefined;
  }
}

export class EnsibleRole {
  self: EnsibleFs = new EnsibleFs();
  defaults: EnsibleFsDir = new EnsibleFsDir();
  files: EnsibleFsDir = new EnsibleFsDir();
  handlers: EnsibleFsDir = new EnsibleFsDir();
  meta: EnsibleFsDir = new EnsibleFsDir();
  tasks: EnsibleFsDir = new EnsibleFsDir();
  templates: EnsibleFsDir = new EnsibleFsDir();
  vars: EnsibleFsDir = new EnsibleFsDir();
}

export class EnsibleFsDir {
  self: EnsibleFs = new EnsibleFs();
  child: EnsibleFs[] = [new EnsibleFs()] as EnsibleFs[]
}

export class EnsibleFs {
  name: string = '';
  path: string = '';
  FSMetadata: FSMetadata = new FSMetadata();
}
