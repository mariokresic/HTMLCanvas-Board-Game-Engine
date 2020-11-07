import Resource from '@/models/Resource';

export default class Territory implements GridCoordinates {
  public readonly i: number;
  public readonly j: number;

  private _terrain: number;
  private _isHq = false;
  private _playerId: number | null;
  private _isSelected = false;
  private _units: number | null;
  private _resources = [] as Resource[];

  public constructor(
    i: number,
    j: number,
    terrainNumber: number,
    playerId: number | null = null,
    isHq = false,
    units: number | null = 0,
    resources: Resource[] = [],
  ) {
    this.i = i;
    this.j = j;
    this._terrain = terrainNumber;
    this._playerId = playerId;
    this._isHq = isHq;
    this._units = units;
    this._resources = resources;
  }

  public get coordinates(): GridCoordinates {
    return {
      i: this.i,
      j: this.j,
    };
  }

  public get id(): string {
    return `i${this.i}_j${this.j}`;
  }

  public get terrain(): number {
    return this._terrain;
  }

  public set terrain(terrainNumber: number) {
    this._terrain = terrainNumber;
  }

  public get imageId(): string {
    return `${this.isHq ? 'hq' : this._terrain}-image`;
  }

  public get playerId(): number | null {
    return this._playerId;
  }

  public set playerId(playerId: number | null) {
    if (this._playerId && playerId && this._playerId === playerId) {
      throw new Error('The territory already belongs to this player.');
    } else if (!(playerId || this._playerId)) {
      throw new Error('The territory already doesnt belong to any player.');
    }

    this._playerId = playerId;
  }

  public get isSelected(): boolean {
    return this._isSelected;
  }

  public set isSelected(val: boolean) {
    this._isSelected = val;
  }

  public get isHq(): boolean {
    return this._isHq;
  }

  public set isHq(val: boolean) {
    if (!this._playerId) {
      throw new Error('The territory is not owned by any player.');
    } else if (this._isHq && val) {
      throw new Error('The territory is already a HQ.');
    } else if (!(this._isHq || val)) {
      throw new Error('The territory is already not a HQ.');
    }

    this._isHq = val;
  }

  public get units(): number | null {
    return this._units;
  }

  public set units(units: number) {
    this._units = units;
  }

  public get resources(): Resource[] {
    return this._resources;
  }

  public addResource(resource: Resource): void {
    if (this._resources.length >= 3) {
      throw new Error('Territory can have up to 3 resources.');
    }

    this._resources.push(resource);
  }

  public removeResource(resourceId: number): void {
    const resourceIndex = this._resources.findIndex((r) => r.id === resourceId);

    if (resourceIndex < 0) {
      throw new Error("Territory doesn't have that resource");
    }

    this._resources.splice(resourceIndex, 1);
  }
}
