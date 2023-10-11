

type SoundType = keyof typeof SoundManager.volume;

export class Sound extends Audio {
    type: SoundType = "fx";
    private _volume = 1;
    constructor(src: string, type: SoundType = "fx") {
        super(src);
        this.type = type;
    }

    private refreshVolume() {
        super.volume = this._volume * SoundManager.volume[this.type];
    }

    public set volume(v) {
        this._volume = v;
        this.refreshVolume();
    }

    public get volume() {
        return this._volume;
    }

    public stop() {
        this.pause();
        this.currentTime = 0;
    }

    public play() {
        this.refreshVolume();
        return super.play();
    }
}

export class Music extends Sound {
    constructor(src: string) {
        super(src, "music");
        Music.list.push(this);
        this.loop = true;
    }

    play() {
        Music.active = this;
        return super.play();
    }
    static list: Music[] = [];
    static active: Music;
}

export class SoundEffect extends Sound {
    constructor(src: string, volume=1) {
        super(src, "fx");
        this.loop = false;
        this.volume = volume;
    }

    play() {
        this.currentTime = 0;
        return super.play();
    }
}


export class SoundManager {
    static volume = {
        music: .8,
        fx: 1
    }
    static update(dt: number) {
        Music.active.volume = Math.min(0.5, Music.active.volume + 0.004);
        for (const music of Music.list) {
            music.volume *= 0.994;
            if (music.volume < .001) music.stop();
        }
    }
    static music = {
        mountains: new Music("sound/music/melted_mountains.ogg"),
        ruins: new Music("sound/music/urban_ruins.ogg"),
        wasteland: new Music("sound/music/industrial_wasteland.ogg"),
        forest: new Music("sound/music/dead_forest.ogg"),
        swamp: new Music("sound/music/dead_forest.ogg"),
        menu: new Music("sound/music/menu.ogg"),
    }
    static fx = {
        hit: new SoundEffect("sound/fx/hit.wav",.8),
        robotDeath:new SoundEffect("sound/fx/robot_explosion.wav",.3),
        robotHit:new SoundEffect("sound/fx/robot_hit.wav",.15),
        playerHit:new SoundEffect("sound/fx/player_hit.wav",.2),
        gunfire:new SoundEffect("sound/fx/gunfire.wav",.2),
        gunfire2:new SoundEffect("sound/fx/gunfire2.wav",.2),
        gunfire3:new SoundEffect("sound/fx/gunfire3.wav",.2)
    }
}
