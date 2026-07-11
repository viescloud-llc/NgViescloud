import { Component, computed, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { NgComponentModule } from '../../../../../lib/module/ng-component.module';
import { DialogUtils } from '../../../../../lib/util/Dialog.utils';
import { DataUtils } from '../../../../../lib/util/Data.utils';
import { ViesMatFormFieldMap } from '../../../../../lib/abtract/ViesMatFormFieldMap';
import { ObjectStorageService } from '../../../../../lib/service/object-storage-manager.service';
import { VFile } from '../../../../../lib/model/vies.model';
import { ProductMedia, ProductMediaType } from '../../../model/product.model';
import {
  MediaSourceDialog,
  MediaSourceDialogData,
  MediaSourceDialogResult
} from '../media-source-dialog/media-source-dialog.component';

// Amazon-style product media editor. Left rail of thumbnails, big preview on
// the right, metadata form (alt text / caption / sort order / is primary /
// media type) below the preview. Actions (Add / Replace / Delete / Move /
// Set primary) live on a toolbar between preview and form.
//
// Reused by BOTH ProductComponent and ProductVariantComponent — the parent
// owns the medias array and the gallery emits the updated list on every
// mutation. isPrimary uniqueness is enforced client-side here since the
// backend doesn't (intent § 5.3), so the parents don't need to duplicate
// that logic.
@Component({
  selector: 'app-product-media-gallery',
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.scss'],
  imports: [NgComponentModule, MatButtonModule, MatIconModule, MatTooltipModule]
})
export class ProductMediaGalleryComponent extends ViesMatFormFieldMap implements OnDestroy {

  private matDialog = inject(MatDialog);
  private dialogUtils = inject(DialogUtils);
  private objectStorage = inject(ObjectStorageService);

  readonly ProductMediaType = ProductMediaType;
  readonly blankMedia = new ProductMedia();

  // ---- Inputs / outputs ----------------------------------------------------

  // Parent-owned collection. We never mutate the array we receive — every
  // change goes back out via `mediasChange` with a fresh array reference so
  // the parent's signal fires (same pattern as the rest of the editor: the
  // ViesRestApi change detection compares by reference).
  medias = input<ProductMedia[]>([]);
  mediasChange = output<ProductMedia[]>();

  // ---- Selection state -----------------------------------------------------

  // Which media the big preview + metadata form is currently pointed at.
  // Kept as an index rather than the object so we survive an Add/Delete
  // without dangling references.
  selectedIndex = signal<number>(0);

  selected = computed<ProductMedia | null>(() => {
    const arr = this.medias();
    const i = this.selectedIndex();
    if (i < 0 || i >= arr.length) return null;
    return arr[i];
  });

  hasSelection = computed<boolean>(() => this.selected() !== null);

  isEmpty = computed<boolean>(() => this.medias().length === 0);

  // ---- Preview cache (media hosted on our object storage) -----------------
  //
  // The `url` field for uploaded media is a vies backend link (built via
  // `generateViesLinkFromPath` on save), which the browser can't render via a
  // plain <img src>: the request needs to go through HttpClient so the auth
  // interceptor stamps the bearer/session on it. So for anything with an
  // `objectStorageDataId`, we fetch the blob via `getFileById`, build a
  // one-off object URL, and serve THAT to <img>/<video>. Keyed by id so if the
  // same media appears multiple times we only fetch once.
  //
  // External URLs (no objectStorageDataId) skip this entirely — those load
  // straight from the origin server via the browser, no auth involved.
  private resolvedById = signal<Map<string, string>>(new Map());
  // Blob URLs allocated by resolveById() — revoked on destroy to avoid leaks.
  private allocatedObjectUrls: string[] = [];
  // In-flight fetches, keyed by id, so an effect re-run mid-fetch doesn't
  // double-fire the same request.
  private resolving = new Set<string>();

  // ---- Pending uploads (deferred until parent save) ------------------------
  //
  // When the admin picks a local file, or picks URL + "save on our service",
  // we DON'T upload to ObjectStorageService right away. We stash the VFile
  // here keyed by the blob URL we minted for preview, and store the blob URL
  // as ProductMedia.url. Only when the parent product/variant is saved (via
  // flushPendingUploads() below) do we POST the blobs, get real ids and vies
  // links, and finalize the media list.
  //
  // Rationale: if the admin adds media and then decides to Revert or navigate
  // away without saving, we shouldn't have committed anything to storage.
  // The parent's save is the single authoritative commit boundary.
  private pendingUploads = new Map<string, VFile>();

  // ---- Pending storage deletes (deferred until parent save succeeds) -------
  //
  // When the admin removes a media that WAS backed by an object-storage file
  // (`objectStorageDataId` set), or replaces it with a different source, the
  // media db row will be deleted/unlinked by the parent save, but the
  // underlying file in object storage stays orphaned. We memorize these ids
  // here and, on a SUCCESSFUL parent save, delete the storage files via
  // ObjectStorageService (see flushPendingStorageDeletes below).
  //
  // Timing matters:
  //   • We must delete AFTER the parent save succeeded — deleting earlier
  //     risks 404s if the media db row still references the file.
  //   • We must NOT delete if the parent save failed — the media rows still
  //     reference the file; deleting would leave dangling references.
  //   • If the admin reverts a delete (parent replaces medias with baseline),
  //     the pruned id shows back up in `medias()`. A prune effect below
  //     removes ids that are back in-use from this set, so the eventual flush
  //     doesn't delete a file that's still referenced.
  private pendingStorageDeletes = new Set<string>();

  constructor() {
    super();
    // Clamp selection whenever the array shrinks or the parent replaces it
    // entirely. Without this, deleting the last media leaves selectedIndex
    // pointing off the end and the preview area shows nothing meaningful.
    effect(() => {
      const arr = this.medias();
      const i = this.selectedIndex();
      if (arr.length === 0) {
        if (i !== 0) this.selectedIndex.set(0);
        return;
      }
      if (i >= arr.length) this.selectedIndex.set(arr.length - 1);
      if (i < 0) this.selectedIndex.set(0);
    });

    // Kick off object-storage fetches for any media that has an id but no
    // resolved blob URL yet. Fires on initial load (existing product with
    // uploaded media) AND right after Add/Replace stamps a new id.
    effect(() => {
      const cache = this.resolvedById();
      for (const m of this.medias()) {
        const id = m.objectStorageDataId;
        if (!id) continue;
        if (cache.has(id)) continue;
        if (this.resolving.has(id)) continue;
        this.resolving.add(id);
        void this.resolveById(id);
      }
    });

    // Prune stale pending uploads whenever the media list changes. This
    // covers three cases with the same logic:
    //   1. The parent reverted — its restored medias no longer reference our
    //      blob URLs, so any pendingUploads we still hold are dead weight.
    //   2. The admin replaced a still-pending media with a different one —
    //      the previous blob URL is now unreferenced.
    //   3. The admin deleted a pending media — same story.
    // Prune = revoke the blob URL and drop the map entry.
    effect(() => {
      const inUse = new Set<string>();
      for (const m of this.medias()) {
        if (m.url && m.url.startsWith('blob:')) inUse.add(m.url);
      }
      for (const url of Array.from(this.pendingUploads.keys())) {
        if (!inUse.has(url)) {
          URL.revokeObjectURL(url);
          this.pendingUploads.delete(url);
        }
      }
    });

    // Un-mark a storage id for deletion if it shows back up in the media list.
    // Covers the revert case: user deletes a storage-backed media (id added to
    // pendingStorageDeletes), then hits Revert on the parent → the parent
    // replaces medias with the baseline, which references the id again. Now
    // the eventual flush shouldn't delete a file that's back in use.
    effect(() => {
      const referenced = new Set<string>();
      for (const m of this.medias()) {
        if (m.objectStorageDataId) referenced.add(m.objectStorageDataId);
      }
      for (const id of Array.from(this.pendingStorageDeletes)) {
        if (referenced.has(id)) this.pendingStorageDeletes.delete(id);
      }
    });
  }

  ngOnDestroy(): void {
    for (const u of this.allocatedObjectUrls) URL.revokeObjectURL(u);
    this.allocatedObjectUrls = [];
    // Also release any still-pending blob URLs — we never got to flush them,
    // so the parent must be tearing us down after a discard.
    for (const url of this.pendingUploads.keys()) URL.revokeObjectURL(url);
    this.pendingUploads.clear();
  }

  // Fetch the raw file from object storage and stash a blob object URL in the
  // reactive cache. Failures are swallowed (broken thumbnail is the only side
  // effect) — the admin can still see the id and url in the disabled fields
  // below the preview to diagnose.
  private async resolveById(id: string) {
    try {
      const blob = await firstValueFrom(this.objectStorage.getFileById(id));
      const objectUrl = URL.createObjectURL(blob);
      this.allocatedObjectUrls.push(objectUrl);
      this.resolvedById.update(prev => {
        const next = new Map(prev);
        next.set(id, objectUrl);
        return next;
      });
    } catch {
      // Swallow — preview stays broken, but nothing else fails.
    } finally {
      this.resolving.delete(id);
    }
  }

  select(index: number) {
    this.selectedIndex.set(index);
  }

  // ---- Add / Replace via the source dialog --------------------------------

  // Both flows go through the same MediaSourceDialog. The dialog itself does
  // NO backend I/O — it either returns an external URL (admin chose to keep
  // the raw link) or a pendingUpload VFile (admin uploaded / picked "save on
  // service"). We stash pending VFiles here and defer the POST until the
  // parent's save flushes them.
  openAdd() {
    this.openSourceDialog(undefined).then(result => {
      if (!result) return;
      const media = DataUtils.purgeValue(new ProductMedia());
      this.applyDialogResult(media, result);
      // First media added → make it primary by default. Removes friction for
      // the common case of "just upload one image".
      if (this.medias().length === 0) media.isPrimary = true;

      const next = [...this.medias(), media];
      this.mediasChange.emit(next);
      // Auto-select the newly added row — the admin will typically want to
      // set alt text / caption on it next.
      this.selectedIndex.set(next.length - 1);
    });
  }

  openReplace() {
    const current = this.selected();
    if (!current) return;
    // Don't pre-fill blob URLs — those are scoped to a previous dialog session
    // and worthless to a fresh one. External and vies URLs pre-fill fine.
    const preFillUrl = current.url?.startsWith('blob:') ? '' : current.url;
    const initial: Partial<ProductMedia> = {
      url: preFillUrl,
      objectStorageDataId: current.objectStorageDataId,
      mediaType: current.mediaType
    };
    this.openSourceDialog(initial).then(result => {
      if (!result) return;
      const arr = this.medias();
      const i = this.selectedIndex();
      if (i < 0 || i >= arr.length) return;
      const updated: ProductMedia = { ...arr[i] };
      this.applyDialogResult(updated, result);
      const next = arr.map((m, idx) => idx === i ? updated : m);
      this.mediasChange.emit(next);
    });
  }

  // Merge the dialog's result onto a ProductMedia. For external URLs, straight
  // assignment. For pending uploads, allocate a fresh blob URL for preview and
  // register the VFile so flushPendingUploads() can find it later.
  //
  // Replace-of-storage-backed-media: `target.objectStorageDataId` was the id
  // of the OLD storage file. Once this merge overwrites `url` + clears
  // `objectStorageDataId`, that file is orphaned. Memorize the old id in
  // pendingStorageDeletes so the eventual parent save can clean it up via
  // ObjectStorageService AFTER the media db row is unlinked.
  private applyDialogResult(target: ProductMedia, result: MediaSourceDialogResult) {
    const previousStorageId = target.objectStorageDataId;
    target.mediaType = result.mediaType;
    if (result.externalUrl !== undefined) {
      target.url = result.externalUrl;
      target.objectStorageDataId = '';
      if (previousStorageId) this.pendingStorageDeletes.add(previousStorageId);
      return;
    }
    if (result.pendingUpload && result.pendingUpload.rawFile) {
      const blobUrl = URL.createObjectURL(result.pendingUpload.rawFile as Blob);
      this.pendingUploads.set(blobUrl, result.pendingUpload);
      target.url = blobUrl;
      target.objectStorageDataId = '';
      if (previousStorageId) this.pendingStorageDeletes.add(previousStorageId);
    }
  }

  hasPendingUploads(): boolean {
    return this.pendingUploads.size > 0;
  }

  // Upload every staged blob to ObjectStorageService and return a finalized
  // media list where each pending entry has been rewritten with the real vies
  // link + the id returned by the server. Called by the parent's save()
  // override BEFORE it commits the product/variant. If nothing is pending,
  // returns the current media list unchanged.
  async flushPendingUploads(): Promise<ProductMedia[]> {
    const arr = this.medias();
    if (this.pendingUploads.size === 0) return arr;

    const finalized: ProductMedia[] = [];
    for (const m of arr) {
      const pending = this.pendingUploads.get(m.url);
      if (!pending) {
        finalized.push(m);
        continue;
      }
      // POST the blob. Errors bubble up — the caller (parent save override)
      // reports via dialogUtils and aborts the save so the admin can retry.
      const meta = await firstValueFrom(this.objectStorage.postFile(pending));
      if (!meta || !meta.path || !meta.id) {
        throw new Error(`Upload for "${pending.name}" returned no id/path.`);
      }
      finalized.push({
        ...m,
        url: this.objectStorage.generateViesLinkFromPath(meta.path),
        objectStorageDataId: meta.id
      });
    }

    // Blobs are now committed to storage; drop the pending map. Revocation
    // of the blob URLs will happen via the prune-on-change effect once the
    // parent emits the finalized medias back.
    this.pendingUploads.clear();
    return finalized;
  }

  hasPendingStorageDeletes(): boolean {
    return this.pendingStorageDeletes.size > 0;
  }

  // Delete every memorized storage id via ObjectStorageService. Called by the
  // parent's save() AFTER the product/variant PUT/POST succeeds — only then
  // are we sure the media db rows referencing these files are gone.
  //
  // Uses allSettled so one failed delete (e.g. a 404 for something already
  // cleaned up) doesn't abort the rest. Failures are silent-by-design at this
  // point: the parent save already succeeded from the admin's perspective; a
  // leftover orphan file is a minor storage hygiene issue, not a UX bug.
  async flushPendingStorageDeletes(): Promise<void> {
    if (this.pendingStorageDeletes.size === 0) return;
    const ids = Array.from(this.pendingStorageDeletes);
    this.pendingStorageDeletes.clear();
    await Promise.allSettled(
      ids.map(id => firstValueFrom(this.objectStorage.deleteFileById(id)))
    );
  }

  // Shared entry point for both flows — kept private + Promise-based so the
  // "reusable function" the parent components care about is JUST openAdd()
  // and openReplace(). The dialog handles all the URL/upload branching
  // internally.
  private openSourceDialog(initial: Partial<ProductMedia> | undefined): Promise<MediaSourceDialogResult | undefined> {
    return new Promise(resolve => {
      const ref = this.matDialog.open<MediaSourceDialog, MediaSourceDialogData, MediaSourceDialogResult | undefined>(
        MediaSourceDialog,
        {
          data: { initial },
          width: '720px',
          maxWidth: '92vw',
          disableClose: false
        }
      );
      ref.afterClosed().subscribe(result => resolve(result));
    });
  }

  // ---- Delete / reorder / primary -----------------------------------------

  async removeSelected() {
    const arr = this.medias();
    const i = this.selectedIndex();
    if (i < 0 || i >= arr.length) return;
    const target = arr[i];

    // Simple confirmation — this is a client-side row removal, only committed
    // on the parent's next save. Reuses openConfirmDialog which resolves on
    // yes and rejects on no (see DialogUtils), so wrap in a try/catch to
    // treat cancel as "no".
    try {
      await this.dialogUtils.openConfirmDialog(
        'Remove media?',
        `Remove ${target.mediaType.toLowerCase()} from this list. This only takes effect after you save the parent.`,
        'Remove',
        'Cancel'
      );
    } catch {
      return;
    }

    const next = arr.filter((_, idx) => idx !== i);
    // If the deleted row was primary and there's anything left, promote the
    // first surviving row so the storefront always has a hero to show.
    if (target.isPrimary && next.length > 0 && !next.some(m => m.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    // Memorize the storage id so we can delete the underlying file after the
    // parent save succeeds (the media db row will be gone, leaving the file
    // orphaned otherwise). Skipped for medias that were never in storage —
    // external URLs and never-flushed pending uploads have no id.
    if (target.objectStorageDataId) {
      this.pendingStorageDeletes.add(target.objectStorageDataId);
    }
    this.mediasChange.emit(next);
  }

  moveSelected(direction: -1 | 1) {
    const arr = this.medias();
    const i = this.selectedIndex();
    const j = i + direction;
    if (i < 0 || i >= arr.length || j < 0 || j >= arr.length) return;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    // Also refresh sortOrder so what the UI shows matches what the backend
    // will store. Admins can still override manually in the metadata form.
    next.forEach((m, idx) => { m.sortOrder = idx; });
    this.mediasChange.emit(next);
    this.selectedIndex.set(j);
  }

  markPrimary() {
    const arr = this.medias();
    const i = this.selectedIndex();
    if (i < 0 || i >= arr.length) return;
    if (arr[i].isPrimary) return;
    const next = arr.map((m, idx) => ({ ...m, isPrimary: idx === i }));
    this.mediasChange.emit(next);
  }

  // ---- Metadata form change -----------------------------------------------

  // The metadata form (dynamic-form on the selected row) mutates its bound
  // object in place — mirror the same {...v} workaround used elsewhere in
  // the editor so downstream computeds see a fresh reference. Also enforces
  // isPrimary uniqueness in the rare case the admin toggles it directly in
  // the metadata form instead of using the "Set as primary" button.
  onMetadataChange(updated: ProductMedia) {
    const arr = this.medias();
    const i = this.selectedIndex();
    if (i < 0 || i >= arr.length) return;
    const wasPrimary = arr[i].isPrimary;
    const next = arr.map((m, idx) => idx === i ? { ...updated } : m);
    if (updated.isPrimary && !wasPrimary) {
      for (let k = 0; k < next.length; k++) {
        if (k !== i) next[k] = { ...next[k], isPrimary: false };
      }
    }
    this.mediasChange.emit(next);
  }

  // ---- Preview URL resolution ---------------------------------------------

  // Two paths:
  //   • Media with objectStorageDataId → we've fetched the blob via HttpClient
  //     (so auth interceptors ran) and cached a blob URL. Serve that.
  //     Returns '' while the fetch is in flight; the effect will populate the
  //     cache and re-run change detection.
  //   • Media without an id → external URL the admin chose to keep. Serve the
  //     URL directly; the browser fetches it on its own.
  previewSrc(m: ProductMedia): string {
    if (!m) return '';
    if (m.objectStorageDataId) {
      return this.resolvedById().get(m.objectStorageDataId) ?? '';
    }
    return m.url || '';
  }
}
