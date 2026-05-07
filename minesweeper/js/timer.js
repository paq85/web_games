class GameTimer {
    constructor(onTick, onSecond) {
        this._onTick = onTick;
        this._onSecond = onSecond;
        this._elapsed = 0;
        this._intervalId = null;
        this._countdown = false;
        this._total = 0;
        // Debug: expose internal state
        this._debug = true;
    }

    start(totalSeconds = 600) {
        console.log('[TIMER] start() called with totalSeconds:', totalSeconds);
        if (this._intervalId !== null) {
            console.log('[TIMER] Already running, not starting again');
            return;
        }
        console.log('[TIMER] Starting with totalSeconds:', totalSeconds);
        if (this._countdown) {
            this._total = totalSeconds;
            this._elapsed = totalSeconds;
        } else {
            this._elapsed = 0;
            if (this._onTick) {
                console.log('[TIMER] Calling initial _onTick with _elapsed:', this._elapsed);
                this._onTick(this._elapsed);
            }
        }
        this._intervalId = setInterval(() => {
            console.log('[TIMER] Interval callback firing, _elapsed before:', this._elapsed);
            if (this._countdown) {
                this._elapsed--;
                if (this._elapsed <= 0) {
                    this._elapsed = 0;
                    this.stop();
                    if (this._onSecond) this._onSecond(0);
                    return;
                }
            } else {
                if (this._elapsed >= 999) {
                    this._elapsed = 999;
                    return;
                }
                this._elapsed++;
            }
            console.log('[TIMER] Calling _onTick with _elapsed:', this._elapsed);
            if (this._onTick) this._onTick(this._elapsed);
            if (this._onSecond) this._onSecond(this._elapsed);
        }, 500);
    }

    stop() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    reset() {
        this.stop();
        this._elapsed = 0;
    }

    setCountdown(enabled, totalSeconds) {
        this._countdown = enabled;
        if (enabled && this._total !== totalSeconds) {
            this._total = totalSeconds;
        }
    }

    getCountdown() {
        return this._countdown;
    }

    getTotal() {
        return this._total;
    }

    getElapsed() {
        return this._elapsed;
    }

    isRunning() {
        return this._intervalId !== null;
    }
}

if (typeof module !== 'undefined') module.exports = { GameTimer };
