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
        }
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
        }
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