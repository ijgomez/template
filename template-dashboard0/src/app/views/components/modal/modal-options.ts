import { Injector } from '@angular/core';

/**
 * Represent options available when opening new modal windows.
 */
export interface ModalOptions {
    /**
     * Whether a backdrop element should be created for a given modal (true by default).
     * Alternatively, specify 'static' for a backdrop which doesn't close the modal on click.
     */
    backdrop?: boolean | 'static';

    /**
     * Function called when a modal will be dismissed.
     * If this function returns false, the modal is not dismissed.
     */
    beforeDismiss?: () => boolean;

    /**
     * An element to which to attach newly opened modal windows.
     */
    container?: string;

    /**
     * Injector to use for modal content.
     */
    injector?: Injector;

    /**
     * Whether to close the modal when escape key is pressed (true by default).
     */
    keyboard?: boolean;

    /**
     * Size of a new modal window.
     */
    size?: 'sm' | 'lg' | 'xl';

    /**
     * Custom class to append to the modal window
     */
    windowClass?: string;
}
