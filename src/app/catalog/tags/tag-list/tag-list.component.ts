import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { APP_ROUTES } from '../../../app.routes';
import { Tag } from '../../../shared/model/product.model';
import { TagService } from '../../../shared/service/tag/tag.service';

@Component({
  selector: 'app-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss'],
  imports: [NgComponentModule]
})
export class TagListComponent extends ViesMatFormFieldMap implements OnInit {

  readonly tagService = inject(TagService);
  readonly rxjsUtils = inject(RxJSUtils);
  readonly dialogUtils = inject(DialogUtils);
  readonly router = inject(Router);

  tagList = signal<Tag[]>([]);
  blankTag = new Tag();

  ngOnInit(): void {
    this.tagService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.tagList.set([...res]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addTag() {
    this.router.navigate([APP_ROUTES.catalogTag('')]);
  }

  selectTag(tag: Tag) {
    this.router.navigate([APP_ROUTES.catalogTag(tag.id)]);
  }
}
