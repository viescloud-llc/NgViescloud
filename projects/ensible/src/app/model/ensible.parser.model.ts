import { FSMetadata } from './ensible.model';
export class EnsibleWorkSpace {
  playbooks: EnsibleFsDir = new EnsibleFsDir();
  roles: EnsibleRole[] = [new EnsibleRole()] as EnsibleRole[];
  secrets: EnsibleFsDir = new EnsibleFsDir();
  passwords: EnsibleFsDir = new EnsibleFsDir();
  inventories: EnsibleFsDir = new EnsibleFsDir();

  isPlaybookExist(playbookName: string): boolean {
    for (const playbook of this.playbooks.child) {
      if (playbook.name === playbookName) {
        return true;
      }
    }
    return false;
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
    for (const secret of this.secrets.child) {
      if (secret.name === secretName) {
        return true;
      }
    }
    return false;
  }

  isPasswordExist(passwordName: string): boolean {
    for (const password of this.passwords.child) {
      if (password.name === passwordName) {
        return true;
      }
    }
    return false;
  }

  isInventoryExist(inventoryName: string): boolean {
    for (const inventory of this.inventories.child) {
      if (inventory.name === inventoryName) {
        return true;
      }
    }
    return false;
  }

  getPlaybook(playbookName: string): EnsibleFs | undefined {
    for (const playbook of this.playbooks.child) {
      if (playbook.name === playbookName) {
        return playbook;
      }
    }
    return undefined;
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
    for (const secret of this.secrets.child) {
      if (secret.name === secretName) {
        return secret;
      }
    }
    return undefined;
  }

  getPassword(passwordName: string): EnsibleFs | undefined {
    for (const password of this.passwords.child) {
      if (password.name === passwordName) {
        return password;
      }
    }
    return undefined;
  }

  getInventory(inventoryName: string): EnsibleFs | undefined {
    for (const inventory of this.inventories.child) {
      if (inventory.name === inventoryName) {
        return inventory;
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
