export interface SoldierProfile {
    name: string;
    rank: string;
    age: number;
    hometown: string;
    backstory: string;
    family: string;
}
export declare const SOLDIER_PROFILES: SoldierProfile[];
export declare function getRandomSoldierProfile(): SoldierProfile;
