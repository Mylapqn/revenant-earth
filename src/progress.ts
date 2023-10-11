import { BiomeData } from "./biome";

/* export class Progress {
    static controlsUnlocked = true;
    static visitedBiomes:number[] = [1,2,3,4,5];
    static firstNight = true;
    static plantedSeed = true;
    static timeUnlocked = true;
    static terrainUnlocked = true;
} */

export class Progress {
    static controlsUnlocked = false;
    static visitedBiomes:number[] = [];
    static firstNight = false;
    static plantedSeed = false;
    static timeUnlocked = false;
    static terrainUnlocked = false;
}