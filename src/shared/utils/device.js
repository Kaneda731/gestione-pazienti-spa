/**
 * Rileva se l'utente sta navigando da un vero dispositivo mobile.
 * Controlla lo user agent per i pattern più comuni e la larghezza dello schermo.
 * @returns {boolean} - True se è un dispositivo mobile, altrimenti false.
 */
export function isTrueMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // Pattern per i dispositivi mobili più comuni
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    // Il controllo `window.matchMedia` è un modo moderno per verificare le media query
    const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;

    return mobileRegex.test(userAgent) || isSmallScreen;
}
