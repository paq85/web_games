export class StateMachine {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  setState(nextState, detail = {}) {
    const previousState = this.state;
    this.state = nextState;
    for (const listener of this.listeners) {
      listener({ previousState, nextState, detail });
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
