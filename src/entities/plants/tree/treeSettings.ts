import { randomInt } from "../../../utils";

type Subset<K> = {
    [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends object | null
    ? Subset<K[attr]> | null
    : K[attr] extends object | null | undefined
    ? Subset<K[attr]> | null | undefined
    : K[attr];
};

export interface TreeSettings extends Required<typeof defaultTreeSettings> { }

export const defaultTreeSettings = {
    name:"oak",
    main: {
        maxGrowth: 100,
        growSpeed: .1,
        angleWarping: .1,
        angleRising: .04,
        maxBranches: 5,
        growthLeafLimit: 10,
        leafAmount: 2,
        gravityBend: {
            limit: .4,
            speed: 1
        },
        branchGreenStart:-.1,
        pollutionClean:1,
    },
    splitOffsets: {
        angleRising: -.01,
        leafiness: 0,
        maxGrowthMultiplier: 1,
    },
    split: {
        initialDelay:7,
        requiredGrowth: 10,
        angle: {
            min: .3,
            max: .4,
        },
        amount: {
            min: 1,
            max: 1,
        },
    }
}

export const coniferousSettings:TreeSettings = {
    name:"pine",
    main: {
        maxGrowth: 200,
        growSpeed: .1,
        angleWarping: 0,
        angleRising: .04,
        maxBranches: 200,
        growthLeafLimit: 50,
        leafAmount: 0,
        gravityBend: {
            limit: 1.9,
            speed: 10
        },
        branchGreenStart:-.5,
        pollutionClean:.7,
    },
    splitOffsets: {
        angleRising: .05,
        maxGrowthMultiplier: .2,
        leafiness: 1,
    },
    split: {
        initialDelay:5,
        requiredGrowth: 1,
        angle: {
            min: .2,
            max: .3,
        },
        amount: {
            min: 2,
            max: 2,
        },
    }
}

export const bushSettings:TreeSettings = {
    name:"bush",
    main: {
        maxGrowth: 15,
        growSpeed: .08,
        angleWarping: .1,
        angleRising: .04,
        maxBranches: 4,
        growthLeafLimit: 10,
        leafAmount: 2,
        gravityBend: {
            limit: .4,
            speed: 1
        },
        branchGreenStart:-.1,
        pollutionClean:.2,
    },
    splitOffsets: {
        angleRising: -.01,
        leafiness: .5,
        maxGrowthMultiplier: 1,
    },
    split: {
        initialDelay:3,
        requiredGrowth: 4,
        angle: {
            min: .4,
            max: .6,
        },
        amount: {
            min: 1,
            max: 2,
        },
    }
}

export const poplarSettings:TreeSettings = {
    name:"poplar",
    main: {
        maxGrowth: 150,
        growSpeed: .2,
        angleWarping: .05,
        angleRising: .04,
        maxBranches: 16,
        growthLeafLimit: 15,
        leafAmount: 2,
        gravityBend: {
            limit: .4,
            speed: 1
        },
        branchGreenStart:-.1,
        pollutionClean:.9,
    },
    splitOffsets: {
        angleRising: -.02,
        leafiness: .1,
        maxGrowthMultiplier: .4,
    },
    split: {
        initialDelay:5,
        requiredGrowth: 10,
        angle: {
            min: .2,
            max: .3,
        },
        amount: {
            min: 1,
            max: 2,
        },
    }
}
export const deadTreeSettings:TreeSettings = {
    name:"dead tree",
    main: {
        maxGrowth: 90,
        growSpeed: .1,
        angleWarping: .5,
        angleRising: .06,
        maxBranches: 5,
        growthLeafLimit: 30,
        leafAmount: 0,
        gravityBend: {
            limit: .3,
            speed: 1
        },
        branchGreenStart:1,
        pollutionClean:0,
    },
    splitOffsets: {
        angleRising: -.01,
        leafiness: 0,
        maxGrowthMultiplier: .8,
    },
    split: {
        initialDelay:8,
        requiredGrowth: 10,
        angle: {
            min: .3,
            max: .45,
        },
        amount: {
            min: 1,
            max: 1,
        },
    }
}

export const treeSettingsList:TreeSettings[] = [defaultTreeSettings,bushSettings,coniferousSettings,poplarSettings];
export function randomTreeSettings(){
    return treeSettingsList[randomInt(0,treeSettingsList.length-1)];
}
/*
export const poplarSettings = new TreeSettings({
    maxGrowth: 150,
    growSpeed: .1,
    warping: .1,
    rising: .05,
    maxBranches: 12,
    growthLeafLimit: 20,
    growthPerSplit: 10,
    leafAmount: 5,
    maxGravityBend: .3,
    splitOffsets: {
        rising: 0,
        maxGrowthMultiplier: .5,
        leafiness: 0
    },
    split: {
        angleMin: .5,
        angleMax: .9,
        min: 1,
        max: 2,
    }
});
*/