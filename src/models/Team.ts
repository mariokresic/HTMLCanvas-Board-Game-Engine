export default class Team {
  public readonly id: number;

  private _name: string;
  private _color: string;

  public constructor(id: number, name: string, color: string) {
    this.id = id;
    this._color = color;
    this._name = name;
  }

  public get color(): string {
    return this._color;
  }

  public set color(color: string) {
    this._color = color;
  }

  public get name(): string {
    return this._name;
  }

  public set name(name: string) {
    this._name = name;
  }
}
