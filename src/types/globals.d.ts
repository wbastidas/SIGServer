/**
 * Declaraciones globales. La Google Maps JS API se carga dinamicamente en
 * runtime (RF-GSV), por lo que se tipa de forma laxa para no acoplar el build a
 * @types/google.maps (dependencia externa opcional).
 */
declare const google: any;

interface Window {
  google?: any;
}
