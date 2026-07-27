// This project deliberately omits @types/node (the app is browser-only).
// Tests run under Node via vitest; declare the minimal surface they use.
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string
  export interface Dirent {
    name: string
    isDirectory(): boolean
  }
  export function readdirSync(path: string, options: { withFileTypes: true }): Dirent[]
}
