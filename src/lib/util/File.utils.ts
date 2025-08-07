import { VFile } from '../model/vies.model';
import { ViesService } from '../service/rest.service';

export class FileUtils {
  private constructor() {}

  static async isObjectUrlValid(url: string): Promise<boolean> {
    if(ViesService.isNotCSR()) {
      return true;
    }

    return fetch(url)
      .then(response => response.ok)
      .catch(() => false);
  }

  static async fetchAsVFile(uri: string): Promise<VFile> {
    if(ViesService.isNotCSR()) {
      return {} as VFile;
    }

    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      let contentType = response.headers.get('Content-Type');
      let extension = '';
      let fileName = uri.substring(uri.lastIndexOf('/') + 1);

      if (!contentType) {
        // If Content-Type is not provided, derive it from the file name
        const fileName = uri.substring(uri.lastIndexOf('/') + 1);
        extension = fileName.split('.').pop()?.toLowerCase() || '';
        contentType = FileUtils.mapExtensionToContentType(extension);
      } else {
        // If Content-Type is provided, extract extension from it
        extension = contentType.split('/')[1];
      }

      const blob = await response.blob();

      const vFile: VFile = {
        name: uri.substring(uri.lastIndexOf('/') + 1), // Use filename from URI
        type: contentType,
        extension: extension,
        rawFile: blob,
        originalLink: uri,
        objectUrl: '',
      };

      return vFile;
    } catch (error) {
      throw error;
    }
  }

  static async fetch<T>(uri: string) {
    if(ViesService.isNotCSR()) {
      return {} as T;
    }

    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      return JSON.parse(await response.json()) as T;
    } catch (error) {
      throw error;
    }
  }

  static mapExtensionToContentType(extension: string): string {
    const extensionMap: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      pdf: 'application/pdf',
      txt: 'text/plain',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip: 'application/zip',
      // Add more mappings as needed
    };

    return extensionMap[extension] || 'application/octet-stream'; // Default type if not found
  }

  static async resizeVideo(
    file: File,
    resolution: '1080p' | '720p' | '480p' | '360p'
  ): Promise<string> {
    const resolutions = {
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
      '360p': { width: 640, height: 360 },
    };

    const targetResolution = resolutions[resolution];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context is not available');
    }

    video.src = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      video.onloadeddata = () => {
        canvas.width = targetResolution.width;
        canvas.height = targetResolution.height;

        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/mp4' });
          resolve(URL.createObjectURL(blob));
        };

        mediaRecorder.start();

        video.play();
        video.ontimeupdate = () => {
          if (video.currentTime > 0.1) {
            // Ensure we capture some frames
            ctx.drawImage(
              video,
              0,
              0,
              targetResolution.width,
              targetResolution.height
            );
            video.pause();
            mediaRecorder.stop();
          }
        };

        video.onerror = (error) => {
          reject(error);
        };
      };
    });
  }

  static resizeImage(
    file: File | Blob,
    resolution: '1080p' | '720p' | '480p' | '360p'
  ): Promise<string> {
    const resolutions = {
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
      '360p': { width: 640, height: 360 },
    };

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Canvas context is not available');
          return;
        }

        const targetResolution = resolutions[resolution];
        canvas.width = targetResolution.width;
        canvas.height = targetResolution.height;

        const widthRatio = targetResolution.width / img.width;
        const heightRatio = targetResolution.height / img.height;
        const ratio = Math.min(widthRatio, heightRatio);

        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        const xOffset = (targetResolution.width - newWidth) / 2;
        const yOffset = (targetResolution.height - newHeight) / 2;

        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          xOffset,
          yOffset,
          newWidth,
          newHeight
        );

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject('Canvas blob is null');
          }
        }, 'image/jpeg');
      };

      img.onerror = reject;
    });
  }

  static saveBlobAsFile(fileName: string, blob: Blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    link.remove();
  }

  static saveFile(fileName: string, fileType: string, fileContent: string) {
    const file = new Blob([fileContent], { type: fileType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    link.remove();
  }

  static async uploadFileAsVFile(accept: string): Promise<VFile> {
    return new Promise<VFile>((resolve, reject) => {
      let fileInput = document.createElement('input');
      fileInput.accept = accept;
      fileInput.type = 'file';
      fileInput.click();

      fileInput.onchange = (e) => {
        let rawFile = fileInput.files![0];
        let fileName = rawFile.name;
        let fileType = rawFile.type;
        let lastIndex =
          fileName.lastIndexOf('.') > 0
            ? fileName.lastIndexOf('.') + 1
            : fileName.length;
        let extension = fileName.substring(lastIndex);

        let reader = new FileReader();

        reader.onload = () => {
          let value: string =
            reader.result && typeof reader.result === 'string'
              ? reader.result
              : '';
          let file: VFile = {
            name: fileName,
            type: fileType,
            rawFile: rawFile,
            objectUrl: '',
            extension: extension,
            value: value
          };

          fileInput.remove();
          resolve(file);
        };
        reader.readAsText(rawFile);
      };
    });
  }

  static localStorageSetItem(key: string, value: any): void {
    if(ViesService.isCSR()) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static localStorageGetItem<T>(key: string): T | null {
    if(ViesService.isNotCSR()) {
      return null;
    }

    let value = localStorage.getItem(key);
    if (value) {
      let parseValue: T = JSON.parse(value) as T;
      return parseValue;
    }

    return null;
  }

  static localStorageRemoveItem(key: string): void {
    if(ViesService.isCSR()) {
      localStorage.removeItem(key);
    }
  }

  static localStorageGetAndRemoveItem<T>(key: string): T | null {
    let value = FileUtils.localStorageGetItem<T>(key);
    if(value) {
      FileUtils.localStorageRemoveItem(key);
    }

    return value;
  }

  static async isObjectUrlActive(objectUrl: string): Promise<boolean> {
    if(ViesService.isNotCSR()) {
      return true;
    }

    try {
      const response = await fetch(objectUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
