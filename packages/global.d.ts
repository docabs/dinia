import 'docuejs'

/**
 * 重新定义docuejs
 */
declare module 'docuejs' {
  export const isDocue2: boolean | undefined
  // export function set<T>(target: any, key: any, val: T): T
  // export function del(target: any, key: any): void
}
