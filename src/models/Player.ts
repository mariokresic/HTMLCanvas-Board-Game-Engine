export default class Player {
  public readonly id: number;

  private _name: string;
  private _color: string;
  private _teamId: number | null;

  public constructor(id: number, name: string, color: string, teamId: number | null = null) {
    this.id = id;
    this._name = name;
    this._color = color;
    this._teamId = teamId;
  }

  public get teamId(): number | null {
    return this._teamId;
  }

  public set teamId(teamId: number | null) {
    if (this._teamId && teamId) {
      throw new Error('Player already belongs to that team.');
    } else if (this._teamId === null && teamId === null) {
      throw new Error("Player already doesn't have a team.");
    }

    this._teamId = teamId;
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
    if (name.length <= 2) {
      throw new Error('Name needs to be at least 3 letters.');
    }

    this._name = name;
  }
}
