import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FSNode, FSTree } from '../../model/ensible.model';
import { EnsibleFS, EnsibleRole, EnsibleRoleDir, EnsibleWorkSpace } from '../../model/ensible.parser.model';
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

            this.putNewRole(parent, ws, node);

            this.putNewNode(parent, ws, node, '/defaults', (role: EnsibleRole) => {
              role.defaults = role.defaults ?? this.newEnsibleRoleDir(parent!);
              role.defaults.child.push(this.newEnsibleFS(node));
            });

            this.putNewNode(parent, ws, node, '/files', (role: EnsibleRole) => {
              role.files = role.files ?? this.newEnsibleRoleDir(parent!);
              role.files.child.push(this.newEnsibleFS(node));
            });

            this.putNewNode(parent, ws, node, '/handlers', (role: EnsibleRole) => {
              role.handlers = role.handlers ?? this.newEnsibleRoleDir(parent!);
              role.handlers.child.push(this.newEnsibleFS(node));
            });

            this.putNewNode(parent, ws, node, '/meta', (role: EnsibleRole) => {
              role.meta = role.meta ?? this.newEnsibleRoleDir(parent!);
              role.meta.child.push(this.newEnsibleFS(node));
            });

            this.putNewNode(parent, ws, node, '/tasks', (role: EnsibleRole) => {
              role.tasks = role.tasks ?? this.newEnsibleRoleDir(parent!);
              role.tasks.child.push(this.newEnsibleFS(node));
            });

            this.putNewNode(parent, ws, node, '/templates', (role: EnsibleRole) => {
              role.templates = role.templates ?? this.newEnsibleRoleDir(parent!);
              role.templates.child.push(this.newEnsibleFS(node));
            });

            this.putNewNode(parent, ws, node, '/vars', (role: EnsibleRole) => {
              role.vars = role.vars ?? this.newEnsibleRoleDir(parent!);
              role.vars.child.push(this.newEnsibleFS(node));
            });

          });

          resolve(ws);
        },
        error: err => {
          reject(err);
        }
      })
    })
  }

  private putNewNode(parent: FSNode | undefined, ws: EnsibleWorkSpace, node: FSNode, parentFolderPath: string, consumer: (role: EnsibleRole) => void) {
    if (parent?.metadata.directory && parent.metadata.path.endsWith(parentFolderPath)) {
      // this.addNewRole(e.parent.parent, ws, e.parent);
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
    let fs = new EnsibleFS();
    fs.name = e.getName();
    fs.path = e.metadata.path;
    fs.FSMetadata = e.metadata;
    return fs;
  }

  private newEnsibleRoleDir(e: FSNode) {
    let tasks = DataUtils.purgeArray(new EnsibleRoleDir());
    tasks.self = new EnsibleFS();
    tasks.self.name = e.getName();
    tasks.self.path = e.metadata.path;
    tasks.self.FSMetadata = e.metadata;
    tasks.child = [];
    return tasks;
  }

  private putNewRole(p: FSNode | undefined, ws: EnsibleWorkSpace, e: FSNode) {
    if (p?.metadata.directory && p.metadata.path.endsWith('/roles') && !ws.isRoleExist(e.getName())) {
      let role = DataUtils.purgeObject(new EnsibleRole());
      role.self = new EnsibleFS();
      role.self.name = e.getName();
      role.self.path = e.metadata.path;
      role.self.FSMetadata = e.metadata;
      ws.roles.push(role);
    }
  }
}
