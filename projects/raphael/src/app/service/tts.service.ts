import { HttpClient } from "@angular/common/http";
import { Injectable, OnInit } from "@angular/core";
import { MatOption } from "projects/viescloud-utils/src/lib/model/mat.model";
import { ViesService } from "projects/viescloud-utils/src/lib/service/rest.service";
import { first, map, retry, switchMap, tap } from "rxjs";
import { TTS } from "../model/raphael.model";
import { ObjectStorage, ObjectStorageService } from "projects/viescloud-utils/src/lib/service/object-storage-manager.service";
import { Metadata } from "projects/viescloud-utils/src/lib/model/object-storage-manager.model";

@Injectable({
  providedIn: 'root'
})
export class TTSService extends ViesService {

    models: string[] = [];
    voices: string[] = [];

    modelOptions: MatOption<string>[] = [];
    voiceOptions: MatOption<string>[] = [];

    defaultModel: string = '';
    defaultMultilingualModel: string = '';

    selectedVoice: string = '';
    selectedModel: string = '';

    constructor(httpClient: HttpClient) {
        super(httpClient);
        this.ngOnInit();
    }

    ngOnInit(): void {
        this.getModels()
        .pipe(
            retry({
                count: 3,
                delay: 1000
            })
        )
        .subscribe({
            next: models => {
                this.models = models;
                models.forEach(model => {
                    let split = model.split('/');
                    let matOption: MatOption<string> = {
                        value: model,
                        valueLabel: split[split.length - 1]
                    }
                    this.modelOptions.push(matOption);
                })
            }
        });

        this.getVoices()
        .pipe(
            retry({
                count: 3,
                delay: 1000
            })
        ).subscribe({
            next: voices => {
                this.voices = voices;
                voices.forEach(voice => {
                    let split = voice.split('/');
                    let matOption: MatOption<string> = {
                        value: voice,
                        valueLabel: split[split.length - 1]
                    }
                    this.voiceOptions.push(matOption);
                })
            }
        });

        this.getDefaultSetting()
        .pipe(
            retry({
                count: 3,
                delay: 1000
            })
        ).subscribe({
            next: setting => {
                this.defaultModel = setting.defaultModel;
                this.defaultMultilingualModel = setting.defaultMultilingualModel;
                this.selectedModel = this.defaultModel;
            }
        });
    }

    protected override getPrefixes(): string[] {
        return ['api', 'v1', 'tts'];
    }

    getModels() {
        return this.httpClient.get<string[]>(`${this.getPrefixUri()}/models`);
    }

    getVoices() {
        return this.httpClient.get<string[]>(`${this.getPrefixUri()}/voices`);
    }

    getDefaultSetting() {
        return this.httpClient.get<{defaultModel: string, defaultMultilingualModel: string}>(`${this.getPrefixUri()}/default`);
    }

    generateWav(tts: TTS) {
        return this.httpClient.put(`${this.getPrefixUri()}/wav`, tts, { responseType: 'blob' });
    }

    generateWavMetadata(tts: TTS) {
        return this.httpClient.put<Metadata>(`${this.getPrefixUri()}/wav/metadata`, tts);
    }

    generateWavVfile(tts: TTS, objectStorageService: ObjectStorageService) {
        return this.generateWavMetadata(tts)
                    .pipe(
                        map(metadata => {
                            if(metadata.path && !metadata.temporaryAccessLink) {
                                metadata.temporaryAccessLink = objectStorageService.generateViesLinkFromPath(metadata.path);
                            }
                            return metadata;
                        }),
                        switchMap(async metadata => {
                            return objectStorageService.fetchFile(metadata.temporaryAccessLink, undefined);
                        }),
                        first()
                    )
    }
}