class Panel {
  dom =
    typeof document !== 'undefined' ? document.createElement('div') : ({} as HTMLDivElement)
  update(_value?: number, _maxValue?: number) {}
}

class Stats {
  static REVISION = 17
  static Panel = Panel
  REVISION = 17
  dom =
    typeof document !== 'undefined' ? document.createElement('div') : ({} as HTMLDivElement)
  get domElement() {
    return this.dom
  }
  addPanel(panel?: Panel) {
    return panel ?? new Panel()
  }
  showPanel(_id?: number) {}
  begin() {}
  end() {
    return 0
  }
  update() {}
  setMode(_id?: number) {}
}

export default Stats
export { Stats, Panel }
