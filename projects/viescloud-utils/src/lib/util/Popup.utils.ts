import { ApplicationRef, ComponentFactoryResolver, ComponentRef, Injectable, Injector, Type } from "@angular/core";
import { MessagePopup } from "../popup/message-popup/message-popup.component";
import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { POPUP_DATA, POPUP_DISMISS } from "../model/Popup.model";

@Injectable({
    providedIn: 'root'
})
export class PopupUtils {
    private popups: Array<{ overlayRef: OverlayRef, componentRef: ComponentRef<any>, vertical: string, horizontal: string }> = [];

    constructor(private overlay: Overlay, private injector: Injector) { }

    // Specific method for message popups
    openMessagePopup(message: string, vertical: 'top' | 'bottom' = 'bottom', horizontal: 'left' | 'middle' | 'right' = 'right', ttl: number = 5000) {
        this.open(MessagePopup, { message }, vertical, horizontal, ttl);
    }

    // Generic open method
    open<T>(component: Type<T>, data: any, vertical: 'top' | 'bottom' = 'bottom', horizontal: 'left' | 'middle' | 'right' = 'right', ttl: number = 5000) {
        const overlayConfig = new OverlayConfig({
            hasBackdrop: false,
            positionStrategy: this.overlay.position()
                .global()
                .top(vertical === 'top' ? '0' : undefined)
                .bottom(vertical === 'bottom' ? '0' : undefined)
                .left(horizontal === 'left' ? '0' : undefined)
                .right(horizontal === 'right' ? '0' : undefined)
                .centerHorizontally(horizontal === 'middle' ? '0' : undefined),
        });

        const overlayRef = this.overlay.create(overlayConfig);
        const dismissFn = () => this.dismiss(overlayRef); // Dismiss function to be passed
        const componentPortal = new ComponentPortal(component, null, this.createInjector(data, dismissFn));
        const componentRef = overlayRef.attach(componentPortal);

        // Push the popup with its position info
        this.popups.push({ overlayRef, componentRef, vertical, horizontal });
        this.repositionPopups();

        if (ttl > 0) {
            setTimeout(() => this.dismiss(overlayRef), ttl);
        }
    }

    dismiss(overlayRef: OverlayRef) {
        const index = this.popups.findIndex(p => p.overlayRef === overlayRef);
        if (index !== -1) {
            const popup = this.popups[index];
            popup.overlayRef.detach();
            popup.overlayRef.dispose();
            this.popups.splice(index, 1);
            this.repositionPopups();
        }
    }

    private repositionPopups() {
        const offset = 10; // Space between popups
        const positions = {
            'top-left': 0, 'top-middle': 0, 'top-right': 0,
            'bottom-left': 0, 'bottom-middle': 0, 'bottom-right': 0,
        };

        this.popups.forEach(popup => {
            const positionKey = `${popup.vertical}-${popup.horizontal}`;
            const positionStrategy = popup.overlayRef.getConfig().positionStrategy;

            // Use getBoundingClientRect to get the height of the popup
            const popupElement = popup.overlayRef.overlayElement;
            const height = popupElement ? popupElement.getBoundingClientRect().height : 0;

            if (popup.vertical === 'top') {
                (positionStrategy as any).top(`${(positions as any)[positionKey]}px`);
            } else if (popup.vertical === 'bottom') {
                (positionStrategy as any).bottom(`${(positions as any)[positionKey]}px`);
            }

            // Handle horizontal positions
            if (popup.horizontal === 'left') {
                (positionStrategy as any).left('0');
            } else if (popup.horizontal === 'right') {
                (positionStrategy as any).right('0');
            } else if (popup.horizontal === 'middle') {
                (positionStrategy as any).centerHorizontally('0');
            }

            // Update position
            popup.overlayRef.updatePosition();

            // Adjust stacking for this vertical-horizontal position
            (positions as any)[positionKey] += height + offset; // Use actual height for stacking
        });
    }

    private createInjector(data: any, dismissFn: () => void) {
        return Injector.create({
            providers: [
                { provide: POPUP_DATA, useValue: data },
                { provide: POPUP_DISMISS, useValue: dismissFn } // Add dismiss function to the injector
            ],
            parent: this.injector,
        });
    }
}