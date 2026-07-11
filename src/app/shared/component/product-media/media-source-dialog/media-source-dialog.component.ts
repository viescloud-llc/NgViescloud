import { Component, Inject, inject, signal, computed, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ViesHttpClientService } from '../../../../../lib/service/vies.service';
import { VFile } from '../../../../../lib/model/vies.model';
import { FileUtils } from '../../../../../lib/util/File.utils';
import { RxJSUtils } from '../../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../../lib/util/Dialog.utils';
import { ProductMedia, ProductMediaType } from '../../../model/product.model';
import { StringUtils } from '../../../../../lib/util/String.utils';

// Data blob passed in via MAT_DIALOG_DATA. When `initial` is set the dialog
// pre-fills the URL/type and treats the flow as "replace existing media",
// otherwise it starts empty for "add new media".
export interface MediaSourceDialogData {
  initial?: Partial<ProductMedia>;
}

// Result blob returned via dialogRef.close(). Exactly one of `externalUrl`
// / `pendingUpload` is set:
//
//   externalUrl   — the admin picked URL mode and chose "Keep the original
//                   URL". No upload is deferred; the caller just stores the
//                   raw external link on ProductMedia.url and leaves
//                   objectStorageDataId empty.
//
//   pendingUpload — the admin either uploaded a local file OR picked URL
//                   mode with "Save a copy on our service". The blob is
//                   returned so the caller can defer the actual POST until
//                   the parent product/variant is saved. Until then, the
//                   caller allocates its own blob URL for preview.
//
// The other ProductMedia metadata (altText, caption, sortOrder, isPrimary)
// is edited outside the dialog and untouched by this flow.
export interface MediaSourceDialogResult {
  mediaType: ProductMediaType;
  externalUrl?: string;
  pendingUpload?: VFile;
}

// Which side of the picker is active. Persisted only in-memory for this dialog
// instance — no need to remember across opens.
type Mode = 'url' | 'upload';

// Preview state machine. Once we successfully render a preview (either directly
// from the URL or via the backend proxy), the "Save" button unlocks. The
// storage choice (keep URL vs upload) is only asked in URL mode; upload mode
// always uploads because there's no external URL to keep.
type PreviewStatus = 'idle' | 'loading' | 'ok-direct' | 'ok-proxied' | 'failed';

// Reusable "pick a media source" dialog. Packages BOTH flows the admin can use
// to attach an image/video to a ProductMedia row:
//
//   1. From URL  — paste a link. We try to render it directly in the preview
//                  first. If the browser blocks it (CORS, hotlink protection,
//                  4xx), we fall back to fetching through ViesHttpClientService
//                  (backend proxy) so the admin still sees a preview. After a
//                  successful preview, the admin picks how to STORE it:
//                    (a) keep the original external URL as-is — no upload,
//                        objectStorageDataId stays empty;
//                    (b) save on our service — POST the blob we already have
//                        via ObjectStorageService, use the returned vies link
//                        as `url`, stash the id in `objectStorageDataId`.
//
//   2. From upload — pick a local file. Preview via URL.createObjectURL. On
//                    save, POST via ObjectStorageService, wire url + id.
//
// Same dialog is used for BOTH "add new" and "replace existing" — the gallery
// invokes it from either an "Add media" button or a "Replace" button on a
// selected row. In "replace" mode, `initial` pre-fills the URL and media type
// so the admin can just tweak instead of re-entering everything.
@Component({
  selector: 'app-media-source-dialog',
  templateUrl: './media-source-dialog.component.html',
  styleUrls: ['./media-source-dialog.component.scss'],
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ]
})
export class MediaSourceDialog implements OnDestroy {

  private viesHttpClient = inject(ViesHttpClientService);
  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);

  readonly ProductMediaType = ProductMediaType;
  readonly mediaTypeValues = Object.values(ProductMediaType);

  // ---- Form state ----------------------------------------------------------

  mode = signal<Mode>('url');
  urlInput = signal<string>('');
  mediaType = signal<ProductMediaType>(ProductMediaType.IMAGE);

  // For URL mode: how the media should be stored once the admin confirms.
  //   'external' — keep the URL as-is, no upload.
  //   'upload'   — upload the fetched blob to our object storage.
  // We DEFAULT to 'external' because it's the least invasive choice and
  // matches "I just want to link this image" cases; the admin has to
  // explicitly opt into re-hosting.
  storageChoice = signal<'external' | 'upload'>('external');

  // Preview state.
  previewStatus = signal<PreviewStatus>('idle');
  // Best-effort preview URL — either the original external link (direct
  // render worked) or a blob object URL from the backend proxy fallback.
  previewUrl = signal<string>('');
  // If we fetched a blob (via proxy in URL mode, or file input in upload
  // mode), we keep the VFile around so save() can POST it without a second
  // fetch. Null if we're in URL mode and direct render worked (no blob yet).
  // Public because the template reads .name to show a "selected file" label
  // in upload mode.
  stagedFile = signal<VFile | null>(null);

  // Blob URLs we've allocated via URL.createObjectURL. Track them so we can
  // revoke on destroy — otherwise a long-lived product editor leaks them
  // every time the admin opens/replaces a media.
  private allocatedObjectUrls: string[] = [];

  // Save is only meaningful once we have SOMETHING to store: either a
  // successful preview in URL mode (so we know the URL resolves, or we have
  // a proxied blob to upload if the admin picks upload-storage), or a staged
  // local file in upload mode.
  canSave = computed<boolean>(() => {
    if (this.mode() === 'url') {
      const s = this.previewStatus();
      return s === 'ok-direct' || s === 'ok-proxied';
    }
    return !!this.stagedFile();
  });

  constructor(
    private dialogRef: MatDialogRef<MediaSourceDialog, MediaSourceDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: MediaSourceDialogData
  ) {
    if (data?.initial) {
      const init = data.initial;
      if (init.url) this.urlInput.set(init.url);
      if (init.mediaType) this.mediaType.set(init.mediaType);
      // Existing media with an objectStorageDataId came from our storage
      // originally — bias the storage choice back toward re-uploading rather
      // than accidentally downgrading to an external link the admin didn't
      // ask for.
      if (init.objectStorageDataId) this.storageChoice.set('upload');
    }
  }

  ngOnDestroy(): void {
    // Release any blob URLs we minted for previews. Note: we do NOT release
    // the previewUrl we return to the caller — they don't get a blob URL,
    // they get either the original external URL or a vies backend URL.
    for (const u of this.allocatedObjectUrls) URL.revokeObjectURL(u);
    this.allocatedObjectUrls = [];
  }

  onModeChange(newMode: Mode) {
    this.mode.set(newMode);
    this.resetPreview();
  }

  // ---- URL mode ------------------------------------------------------------

  // "Load preview" for URL mode. Two-step fallback:
  //   1. Ask the browser to fetch the URL directly. Fastest path and doesn't
  //      touch our backend, but many hosts block cross-origin fetches.
  //   2. If the direct fetch throws (CORS, network, 4xx), route through the
  //      backend's ViesHttpClientService which serves as a CORS proxy AND
  //      hands us back a VFile with the actual Blob — so if the admin later
  //      picks "save on our service", we can upload from the blob we already
  //      have instead of asking the backend to re-fetch.
  async loadUrlPreview() {
    const url = this.urlInput().trim();
    if (!url) return;

    this.previewStatus.set('loading');
    this.releaseStagedPreview();

    // First attempt: direct browser fetch → blob → object URL. This gives us
    // a VFile we can also upload later without re-fetching. FileUtils handles
    // content-type sniffing and extension resolution.
    try {
      const vFile = await FileUtils.fetchAsVFile(url);
      if (vFile && vFile.rawFile) {
        this.applyPreviewFromVFile(vFile, 'ok-direct');
        return;
      }
    } catch {
      // Fall through to proxied fetch — direct fetch typically fails on CORS
      // for third-party hosts that don't return Access-Control-Allow-Origin.
    }

    // Second attempt: ask the backend to fetch on our behalf. This bypasses
    // browser-side CORS entirely.
    try {
      const resp = await firstValueFrom(
        this.viesHttpClient.getBlobAsVFile({ url }).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      const vFile = resp.body;
      if (vFile && vFile.rawFile) {
        this.applyPreviewFromVFile(vFile, 'ok-proxied');
        return;
      }
      this.previewStatus.set('failed');
    } catch (err) {
      this.previewStatus.set('failed');
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  // ---- Upload mode ---------------------------------------------------------

  onFilePicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.releaseStagedPreview();

    const vFile: VFile = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      extension: file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : '',
      rawFile: file,
      originalLink: '',
      objectUrl: ''
    };
    this.applyPreviewFromVFile(vFile, 'ok-direct');
  }

  // ---- Shared helpers ------------------------------------------------------

  // Take a fetched or picked VFile, build a preview URL, and infer the media
  // type from the content-type header if the admin hasn't overridden it.
  private applyPreviewFromVFile(vFile: VFile, status: PreviewStatus) {
    const url = URL.createObjectURL(vFile.rawFile as Blob);
    this.allocatedObjectUrls.push(url);
    vFile.objectUrl = url;
    this.stagedFile.set(vFile);
    this.previewUrl.set(url);

    // Only auto-detect the media type on first preview — don't overwrite an
    // explicit admin choice.
    const inferred = this.inferMediaType(vFile.type);
    if (inferred) this.mediaType.set(inferred);

    this.previewStatus.set(status);
  }

  private inferMediaType(contentType: string): ProductMediaType | null {
    if (!contentType) return null;
    if (contentType.startsWith('video/')) return ProductMediaType.VIDEO;
    if (contentType.startsWith('image/')) return ProductMediaType.IMAGE;
    return null;
  }

  private resetPreview() {
    this.releaseStagedPreview();
    this.previewStatus.set('idle');
  }

  private releaseStagedPreview() {
    const staged = this.stagedFile();
    if (staged?.objectUrl) {
      URL.revokeObjectURL(staged.objectUrl);
      this.allocatedObjectUrls = this.allocatedObjectUrls.filter(u => u !== staged.objectUrl);
    }
    this.stagedFile.set(null);
    this.previewUrl.set('');
  }

  // ---- Save / cancel -------------------------------------------------------

  async save() {
    const mode = this.mode();
    if (mode === 'url') {
      await this.saveFromUrl();
    } else {
      await this.saveFromUpload();
    }
  }

  // URL mode: honor the admin's storage choice.
  //   external — return the URL exactly as they entered it.
  //   upload   — return the staged VFile as a pendingUpload; the actual POST
  //              happens later, when the parent product/variant is saved.
  private async saveFromUrl() {
    const originalUrl = this.urlInput().trim();
    if (this.storageChoice() === 'external') {
      this.dialogRef.close({
        mediaType: this.mediaType(),
        externalUrl: originalUrl
      });
      return;
    }

    const staged = this.stagedFile();
    if (!staged || !staged.rawFile) {
      // Should be unreachable — canSave() gates on having a preview which
      // implies a staged file. Defensive path.
      this.dialogUtils.openErrorMessage('No file staged', 'Load a preview before saving.');
      return;
    }

    this.closeWithPending(staged);
  }

  private async saveFromUpload() {
    const staged = this.stagedFile();
    if (!staged || !staged.rawFile) return;
    this.closeWithPending(staged);
  }

  // Package the staged blob for the caller. Strips the objectUrl deliberately —
  // that URL belongs to THIS dialog and will be revoked in ngOnDestroy. The
  // gallery allocates its own blob URL for its own preview lifetime.
  private closeWithPending(staged: VFile) {
    const pending: VFile = {
      name: StringUtils.makeId(5) + '-' + staged.name,
      type: staged.type,
      extension: staged.extension,
      rawFile: staged.rawFile,
      originalLink: staged.originalLink,
      objectUrl: ''
    };
    this.dialogRef.close({
      mediaType: this.mediaType(),
      pendingUpload: pending
    });
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
