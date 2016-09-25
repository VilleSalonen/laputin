declare module "walk" {
    import * as fs from "fs";
    
    export interface WalkStat extends fs.Stats {
        name: string;
        type: string;
    }
    
    export function walk(pathname: string, options: any): Walker;
    export function walkSync(pathname: string, options: any): Walker;
    
    export class Walker {
        on(event: string, callback: (root: string, stat: WalkStat, callback: (() => void)) => void): void;
        pause(): void;
        resume(): void;
    }
}