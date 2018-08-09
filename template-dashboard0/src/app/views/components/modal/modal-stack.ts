import {
  ApplicationRef,
  Injectable,
  Injector,
  ReflectiveInjector,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  TemplateRef
} from '@angular/core';

import { ContentRef } from '../util/popup';
import { isDefined, isString } from '../util/util';

import { ModalBackdropComponent } from './modal-backdrop.component';
import { ModalWindowComponent } from './modal-window.component';
import { ActiveModal, ModalRef } from './modal-ref';

@Injectable()
export class ModalStack {
  private _backdropFactory: ComponentFactory<ModalBackdropComponent>;
  private _windowFactory: ComponentFactory<ModalWindowComponent>;

  constructor(
      private _applicationRef: ApplicationRef, private _injector: Injector,
      private _componentFactoryResolver: ComponentFactoryResolver) {
    this._backdropFactory = _componentFactoryResolver.resolveComponentFactory(ModalBackdropComponent);
    this._windowFactory = _componentFactoryResolver.resolveComponentFactory(ModalWindowComponent);
  }

  open(moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any, options): ModalRef {
    const containerSelector = options.container || 'body';
    const containerEl = document.querySelector(containerSelector);

    if (!containerEl) {
      throw new Error(`The specified modal container "${containerSelector}" was not found in the DOM.`);
    }

    const activeModal = new ActiveModal();
    const contentRef = this._getContentRef(moduleCFR, options.injector || contentInjector, content, activeModal);

    let windowCmptRef: ComponentRef<ModalWindowComponent>;
    let backdropCmptRef: ComponentRef<ModalBackdropComponent>;
    let ngbModalRef: ModalRef;


    if (options.backdrop !== false) {
      backdropCmptRef = this._backdropFactory.create(this._injector);
      this._applicationRef.attachView(backdropCmptRef.hostView);
      containerEl.appendChild(backdropCmptRef.location.nativeElement);
    }
    windowCmptRef = this._windowFactory.create(this._injector, contentRef.nodes);
    this._applicationRef.attachView(windowCmptRef.hostView);
    containerEl.appendChild(windowCmptRef.location.nativeElement);

    ngbModalRef = new ModalRef(windowCmptRef, contentRef, backdropCmptRef, options.beforeDismiss);

    activeModal.close = (result: any) => { ngbModalRef.close(result); };
    activeModal.dismiss = (reason: any) => { ngbModalRef.dismiss(reason); };

    this._applyWindowOptions(windowCmptRef.instance, options);

    return ngbModalRef;
  }

  private _applyWindowOptions(windowInstance: ModalWindowComponent, options: Object): void {
    ['backdrop', 'keyboard', 'size', 'windowClass'].forEach((optionName: string) => {
      if (isDefined(options[optionName])) {
        windowInstance[optionName] = options[optionName];
      }
    });
  }

  private _getContentRef(
      moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any,
      context: ActiveModal): ContentRef {
    if (!content) {
      return new ContentRef([]);
    } else if (content instanceof TemplateRef) {
      const viewRef = content.createEmbeddedView(context);
      this._applicationRef.attachView(viewRef);
      return new ContentRef([viewRef.rootNodes], viewRef);
    } else if (isString(content)) {
      return new ContentRef([[document.createTextNode(`${content}`)]]);
    } else {
      const contentCmptFactory = moduleCFR.resolveComponentFactory(content);
      const modalContentInjector =
          ReflectiveInjector.resolveAndCreate([{provide: ActiveModal, useValue: context}], contentInjector);
      const componentRef = contentCmptFactory.create(modalContentInjector);
      this._applicationRef.attachView(componentRef.hostView);
      return new ContentRef([[componentRef.location.nativeElement]], componentRef.hostView, componentRef);
    }
  }
}
