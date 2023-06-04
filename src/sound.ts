

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
        music: .0,
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
        swamp: new Music("sound/music/industrial_wasteland.ogg"),
        menu: new Music("sound/music/menu.ogg"),
    }
}
