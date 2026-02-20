declare module "https://esm.sh/@supabase/supabase-js@2" {
  export const createClient: (...args: any[]) => any;
}

declare module "https://esm.sh/bcryptjs@2.4.3" {
  export function hash(s: string, salt: number | string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function hashSync(s: string, salt: number | string): string;
  export function compareSync(s: string, hash: string): boolean;
  export default { hash, compare, hashSync, compareSync };
}
