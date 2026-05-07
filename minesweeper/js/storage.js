class GameStorage {
  constructor(prefix) {
    this.prefix = prefix;
  }

  _key(name) {
    return `${this.prefix}_${name}`;
  }

  _getJson(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  _setJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // storage full or unavailable
    }
  }

  getBestTime(difficulty) {
    const times = this._getJson(this._key('best_times'), {});
    return times[difficulty] != null ? Number(times[difficulty]) : null;
  }

  setBestTime(difficulty, time) {
    const times = this._getJson(this._key('best_times'), {});
    const current = times[difficulty];
    if (current === undefined || time < current) {
      times[difficulty] = time;
      this._setJson(this._key('best_times'), times);
    }
  }

  getBestTimes() {
    return this._getJson(this._key('best_times'), {});
  }

  clearBestTime(difficulty) {
    const times = this._getJson(this._key('best_times'), {});
    delete times[difficulty];
    this._setJson(this._key('best_times'), times);
  }

  clearAllBestTimes() {
    try {
      localStorage.removeItem(this._key('best_times'));
    } catch {
      // unavailable
    }
  }

  getSetting(key) {
    try {
      return localStorage.getItem(this._key(key));
    } catch {
      return null;
    }
  }

  setSetting(key, value) {
    try {
      localStorage.setItem(this._key(key), String(value));
    } catch {
      // storage full or unavailable
    }
  }

  getLastDifficulty() {
    return this.getSetting('last_difficulty');
  }

  setLastDifficulty(d) {
    this.setSetting('last_difficulty', d);
  }

  getQuestionMode() {
    return this._getJson(this._key('question_mode'), false);
  }

  setQuestionMode(enabled) {
    this._setJson(this._key('question_mode'), enabled);
  }

  getCustomSettings() {
    return this._getJson(this._key('custom_settings'), null);
  }

  setCustomSettings(settings) {
    this._setJson(this._key('custom_settings'), settings);
  }

  getMuted() {
    return this._getJson(this._key('audio_muted'), false);
  }

  setMuted(muted) {
    this._setJson(this._key('audio_muted'), muted);
  }
}

if (typeof module !== 'undefined') module.exports = { GameStorage };
