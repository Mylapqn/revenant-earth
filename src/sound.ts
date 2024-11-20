import { lerp } from "./utils";


type SoundType = keyof typeof SoundManager.volume;

export class Sound extends Audio {
    type: SoundType = "fx";
    private _volume = 1;
    public playing = false;
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
        this.playing = false;
        this.pause();
        this.currentTime = 0;
    }

    public play() {
        this.playing = true;
        this.refreshVolume();
        return super.play();
    }
}

export class Music extends Sound {
    targetVolume = .5;
    constructor(src: string) {
        super(src, "music");
        Music.list.push(this);
        this.loop = false;
        this.onended = this.onEnd.bind(this);
    }

    play(active = true) {
        if (active)
            Music.active = this;
        return super.play();
    }

    onEnd() {
        Music.next = SoundManager.music.new;
        Music.timeToNext = 10;
    }
    fadeIn(startTime = 0) {
        this.targetVolume = .5;
        //this.currentTime = startTime;
        //if (this.playing) return;
        //this.volume = 0;
        //this.play(false);
    }
    fadeOut() {
        this.targetVolume = 0;
    }
    static next: Music;
    static timeToNext: number;
    static list: Music[] = [];
    static active: Music;
}

export class SoundEffect extends Sound {
    constructor(src: string, volume = 1) {
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
        for (const music of Music.list) {
            if (music.playing) {
                //music.volume = lerp(music.volume, music.targetVolume, dt * 2);
                let firstSign = Math.sign(music.targetVolume - music.volume);
                music.volume = Math.max(0, music.volume + firstSign * dt * .5);
                let secondSign = Math.sign(music.targetVolume - music.volume);
                if (firstSign !== secondSign) {
                    music.volume = music.targetVolume;
                }
                //if (music.volume < .001) music.stop();
            }
        }
        if (Music.next) {
            Music.timeToNext -= dt;
            if (Music.timeToNext < 0) {
                SoundManager.music.combat.play();
                SoundManager.music.combat.volume = 0;
                Music.next.play();
                Music.active = Music.next;
                Music.next = null;
            }
        }
    }
    static music = {
        mountains: new Music("sound/music/melted_mountains.ogg"),
        ruins: new Music("sound/music/urban_ruins.ogg"),
        wasteland: new Music("sound/music/industrial_wasteland.ogg"),
        forest: new Music("sound/music/dead_forest.ogg"),
        swamp: new Music("sound/music/dead_forest.ogg"),
        menu: new Music("sound/music/menu.ogg"),
        new: new Music("sound/music/new.mp3"),
        combat: new Music("sound/music/combat.mp3")
    }
    static fx = {
        hit: new SoundEffect("sound/fx/hit.wav", .8),
        robotDeath: new SoundEffect("sound/fx/robot_explosion.wav", .3),
        robotHit: new SoundEffect("sound/fx/robot_hit.wav", .15),
        playerHit: new SoundEffect("sound/fx/player_hit.wav", .2),
        gunfire: new SoundEffect("sound/fx/gunfire.wav", .2),
        gunfire2: new SoundEffect("sound/fx/gunfire2.wav", .2),
        gunfire3: new SoundEffect("sound/fx/gunfire3.wav", .2),
        electric: new SoundEffect("sound/fx/electric.mp3", .3)
    }
}
