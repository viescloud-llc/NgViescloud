import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { FSNode, FSTree } from '../../model/ensible.model';
import { EnsibleFs, EnsibleRole, EnsibleFsDir, EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

@Injectable({
  providedIn: 'root'
})
export class EnsibleWorkspaceService extends EnsibleService {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'ensibles', 'workspaces'];
  }

  getWorkspace() {
    return this.httpClient.get<FSTree>(this.getPrefixUri());
  }

}

@Injectable({
  providedIn: 'root'
})
export class EnsibleWorkspaceParserService extends EnsibleWorkspaceService {

  private onFetchWorkspaceSubject = new Subject<EnsibleWorkSpace>();
  onFetchWorkspace$ = this.onFetchWorkspaceSubject.asObservable();

  triggerFetchWorkspace() {
    this.parseWorkspace().then(ws => {
      this.onFetchWorkspaceSubject.next(ws);
    })
  }

  async parseWorkspace() {
    return new Promise<EnsibleWorkSpace>((resolve, reject) => {

      this.getWorkspace().subscribe({
        next: res => {
          let ws = DataUtils.purgeArray(new EnsibleWorkSpace());
          let workspace = new FSTree();
          workspace.root = res.root;
          workspace.forEach((e, p) => {
            let node = this.newFSNode(e);
            let parent = p ? this.newFSNode(p) : undefined;

            this.putRole(parent, ws, node);

            this.putRoleChildNode(parent, ws, '/defaults', (role: EnsibleRole) => {
              role.defaults = role.defaults ?? this.newEnsibleRoleDir(parent!);
              role.defaults.child.push(this.newEnsibleFS(node));
            });

            this.putRoleChildNode(parent, ws, '/files', (role: EnsibleRole) => {
              role.files = role.files ?? this.newEnsibleRoleDir(parent!);
              role.files.child.push(this.newEnsibleFS(node));
            });

            this.putRoleChildNode(parent, ws, '/handlers', (role: EnsibleRole) => {
              role.handlers = role.handlers ?? this.newEnsibleRoleDir(parent!);
              role.handlers.child.push(this.newEnsibleFS(node));
            });

            this.putRoleChildNode(parent, ws, '/meta', (role: EnsibleRole) => {
              role.meta = role.meta ?? this.newEnsibleRoleDir(parent!);
              role.meta.child.push(this.newEnsibleFS(node));
            });

            this.putRoleChildNode(parent, ws, '/tasks', (role: EnsibleRole) => {
              role.tasks = role.tasks ?? this.newEnsibleRoleDir(parent!);
              role.tasks.child.push(this.newEnsibleFS(node));
            });

            this.putRoleChildNode(parent, ws, '/templates', (role: EnsibleRole) => {
              role.templates = role.templates ?? this.newEnsibleRoleDir(parent!);
              role.templates.child.push(this.newEnsibleFS(node));
            });

            this.putRoleChildNode(parent, ws, '/vars', (role: EnsibleRole) => {
              role.vars = role.vars ?? this.newEnsibleRoleDir(parent!);
              role.vars.child.push(this.newEnsibleFS(node));
            });

            this.putWorkspaceFS(parent, node, '/playbooks', () => ws.playbooks, s => ws.isPlaybookExist(s));
            this.putWorkspaceFS(parent, node, '/inventories', () => ws.inventories, s => ws.isInventoryExist(s));
            this.putWorkspaceFS(parent, node, '/passwords', () => ws.passwords, s => ws.isPasswordExist(s));
            this.putWorkspaceFS(parent, node, '/secrets', () => ws.secrets, s => ws.isSecretExist(s));
          });

          resolve(ws);
        },
        error: err => {
          reject(err);
        }
      })
    })
  }

  private putRoleChildNode(parent: FSNode | undefined, ws: EnsibleWorkSpace, parentFolderPath: string, consumer: (role: EnsibleRole) => void) {
    if (parent?.metadata.directory && parent.metadata.path.endsWith(parentFolderPath)) {
      let grandParent = this.newFSNode(parent.parent!);
      let role = ws.getRole(grandParent.getName());
      if (role) {
        consumer(role);
      }
    }
  }

 

  private newFSNode(e: FSNode) {
    let fsNode = new FSNode();
    fsNode.metadata = e.metadata;
    fsNode.children = e.children;
    fsNode.metadata = e.metadata;
    fsNode.parent = e.parent;
    return fsNode;
  }

  private newEnsibleFS(e: FSNode) {
    let fs = new EnsibleFs();
    fs.name = e.getName();
    fs.path = e.metadata.path;
    fs.FSMetadata = e.metadata;
    return fs;
  }

  private newEnsibleRoleDir(e: FSNode) {
    let tasks = DataUtils.purgeArray(new EnsibleFsDir());
    tasks.self = new EnsibleFs();
    tasks.self.name = e.getName();
    tasks.self.path = e.metadata.path;
    tasks.self.FSMetadata = e.metadata;
    tasks.child = [];
    return tasks;
  }

  private putRole(p: FSNode | undefined, ws: EnsibleWorkSpace, e: FSNode) {
    if (p?.metadata.directory && p.metadata.path.endsWith('/roles') && !ws.isRoleExist(e.getName())) {
      let role = DataUtils.purgeObject(new EnsibleRole());
      role.self = new EnsibleFs();
      role.self.name = e.getName();
      role.self.path = e.metadata.path;
      role.self.FSMetadata = e.metadata;
      ws.roles.push(role);
    }
  }

  private putWorkspaceFS(p: FSNode | undefined, e: FSNode, parentPathEndWith: string, producer: () => EnsibleFsDir, checkFn: (name: string) => boolean) {
    if (p?.metadata.directory && p.metadata.path.endsWith(parentPathEndWith)) {
      if(!producer().self.path) {
        let self = new EnsibleFs();
        self.name = p.getName();
        self.path = p.metadata.path;
        self.FSMetadata = p.metadata;
        producer().self = self;
        producer().child = [];
      }

      if(!checkFn(e.getName())) {
        let fs = DataUtils.purgeObject(new EnsibleFs());
        fs.name = e.getName();
        fs.path = e.metadata.path;
        fs.FSMetadata = e.metadata;
        producer().child.push(fs);
      }
    }
  }
}
