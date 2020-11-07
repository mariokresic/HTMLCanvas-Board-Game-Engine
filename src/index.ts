import Map from '@/models/Map';
import Territory from '@/models/Territory';
// import Team from '@/models/Team';
import Player from '@/models/Player';
import Screen from '@/Screen';
import Team from '@/models/Team';
import Resource from '@/models/Resource';

declare global {
  type Terrain = 'grass' | 'desert' | 'vulcan';
  type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

  interface Window {
    GameEngine: typeof GameEngine;
  }
  interface Action {
    id: string;
    text: string;
  }
  type MapShape = 'hex'; // | 'box'; box is buggy for now

  interface MapOptions {
    size: number;
    shape: MapShape;
    terrain: Terrain;
    fogOfWar: boolean;
    showTerritoryCoordinates: boolean;
    showHq: boolean;
    showUnits: boolean;
  }
  interface Point {
    x: number;
    y: number;
  }
  interface GridCoordinates {
    i: number;
    j: number;
  }
  interface ScreenOptions {
    id: string;
    width: number;
    height: number;
    zIndex?: number;
  }
}

class GameEngine {
  /**
   * Static defaults
   */
  public static DEFAULT_MAP_OPTIONS = {
    size: 5,
    shape: 'hex',
    terrain: 'grass',
    fogOfWar: false,
    showTerritoryCoordinates: false,
    showHq: true,
    showUnits: false,
  } as MapOptions;
  public static DEFAULT_SCREEN_OPTIONS = {
    id: 'game',
    width: 1024,
    height: 768,
  } as ScreenOptions;
  public static PLAYER_COLOR = {
    WHITE: 'rgba(255, 255, 255, .8)',
    BLACK: 'rgba(0, 0, 0, .8)',
    BROWN: 'rgba(121,85,72, .8)',
    BLUE: 'rgba(0, 0, 255, .8)',
    CYAN: 'rgba(51, 255, 255, .8)',
    RED: 'rgba(255, 0, 0, .8)',
    GREEN: 'rgba(0, 255, 0, .8)',
    LIME: 'rgba(128, 255, 0, .8)',
    YELLOW: 'rgba(255, 255, 51, .8)',
    PURPLE: 'rgba(204, 0, 204, .8)',
    PINK: 'rgba(255, 153, 204, .8)',
  };

  public key_bindings = {
    UP: ['ArrowUp', 'keyW'],
    RIGHT: ['ArrowUp', 'keyD'],
    DOWN: ['ArrowUp', 'keyS'],
    LEFT: ['ArrowUp', 'keyA'],
    ZOOM_IN: ['scroll-up', 'keyPlus'],
    ZOOM_OUT: ['scroll-down', 'keyMinus'],
  };

  /**
   * Properties
   */
  private readonly _map: Map;
  private readonly _screen: Screen;
  private _currentPlayerId: number | null;
  private _onClick?: (territoryCoordinates: GridCoordinates, point: Point, e: MouseEvent) => void;
  private _onKeyDown?: (key: string) => void;
  private _onKeyUp?: (key: string) => void;

  /**
   * Static game engine initializers
   */

  public static init(
    currentPlayerId: number | null = null,
    mapOptions = GameEngine.DEFAULT_MAP_OPTIONS,
    screenOptions = GameEngine.DEFAULT_SCREEN_OPTIONS,
    render = true,
  ): GameEngine {
    return new GameEngine(Map.init(currentPlayerId, mapOptions), screenOptions, currentPlayerId, render);
  }

  public static load(
    currentPlayerId: number | null = null,
    map: Map,
    screenOptions = GameEngine.DEFAULT_SCREEN_OPTIONS,
    render = true,
  ): GameEngine {
    return new GameEngine(map, screenOptions, currentPlayerId, render);
  }

  private constructor(map: Map, screenOptions: ScreenOptions, currentPlayerId: number | null, render: boolean) {
    this._map = map;
    this._screen = new Screen(map, screenOptions);
    this._currentPlayerId = currentPlayerId;

    this._screen.div.addEventListener('click', (e) => this.clicked(e));
    this._screen.div.addEventListener('mousewheel', (e) => this.scrolled(e as WheelEvent));
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.keyUp(e));

    if (render) {
      setTimeout(() => this.render(), 200);
    }
  }

  /**
   * Render func
   */

  public render(): void {
    this._screen.render();
  }

  /**
   * Players
   */
  public getPlayerInfo(playerId: number): Player {
    try {
      return this._map.getPlayerById(playerId);
    } catch (e) {
      console.warn(e);
    }
  }

  public setCurrentPlayerId(currentPlayerId: number): void {
    this._currentPlayerId = currentPlayerId;
    this._map.currentPlayerId = currentPlayerId;
  }

  public createPlayer(
    id: number,
    name: string,
    color: string,
    teamId: number | null = null,
    territoryCoordinates: GridCoordinates[] = [],
    hqTerritory: GridCoordinates | null = null,
  ): Player | undefined {
    try {
      const player = new Player(id, name, color, teamId);

      this._map.addPlayer(player);

      for (let i = 0; i < territoryCoordinates.length; i++) {
        this.addTerritoryToPlayer(player.id, territoryCoordinates[i]);
      }

      if (hqTerritory) {
        this.setPlayerHqTerritory(hqTerritory);
      }

      return player;
    } catch (e) {
      console.warn(e);
    }
  }

  public removePlayer(playerId: number): void {
    try {
      this._map.removePlayer(playerId);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Teams
   */
  public getTeamInfo(teamId: number): Team {
    try {
      return this._map.getTeamById(teamId);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Territories
   */

  public getTerritoryInfo(gridCoordinates: GridCoordinates): Territory | undefined {
    try {
      return this._map.getTerritoryByCoordinates(gridCoordinates);
    } catch (e) {
      console.warn(e.message);
    }
  }

  public getSelectedTerritories(): Territory[] {
    try {
      return this._map.getSelectedTerritories();
    } catch (e) {
      console.warn(e.message);
    }
  }

  public getTerritoriesByPlayerId(playerId: number): Territory[] {
    return this._map.getTerritoriesByPlayerId(playerId);
  }

  public addTerritoryToPlayer(playerId: number, coordinates: GridCoordinates): void {
    try {
      this._map.addTerritoryToPlayer(playerId, coordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public removeTerritoryFromPlayer(coordinates: GridCoordinates): void {
    try {
      this._map.removeTerritoryFromPlayer(coordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public setTerritoryUnits(territoryCoordinates: GridCoordinates, units: number): void {
    try {
      this._map.setTerritoryUnits(territoryCoordinates, units);
    } catch (e) {
      console.warn(e);
    }
  }

  public setPlayerHqTerritory(territoryCoordinates: GridCoordinates): void {
    try {
      this._map.setTerritoryHq(territoryCoordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public removeAllPlayerTerritoryHqs(playerId: number): void {
    try {
      this._map.removeAllTerritoryHqByPlayerId(playerId);
    } catch (e) {
      console.warn(e);
    }
  }

  public removePlayerHqTerritory(territoryCoordinates: GridCoordinates): void {
    try {
      this._map.removeTerritoryHq(territoryCoordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public getTerritoryCoordinateByPoint(point: Point): GridCoordinates | null {
    return this._screen.getTerritoryCoordinateByPoint(point);
  }

  public selectTerritory(territoryCoordinate: GridCoordinates, unselectCurrentlySelected = true): void {
    try {
      this._map.selectTerritory(territoryCoordinate, unselectCurrentlySelected);
    } catch (e) {
      console.warn(e);
    }
  }

  public updateTerritoryTerrain(territoryCoordinates: GridCoordinates, terrain: number): void {
    try {
      this._map.updateTerritoryTerrain(territoryCoordinates, terrain);
    } catch (e) {
      console.warn(e);
    }
  }

  public getTerritoryNeighbors(territoryCoordinates: GridCoordinates): Territory[] | undefined {
    try {
      return this._map.getTerritoryNeighbors(territoryCoordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public isTerritoryNeighborToPlayer(territoryCoordinates: GridCoordinates, playerId: number): boolean {
    try {
      return this._map.isTerritoryNeighborToPlayer(territoryCoordinates, playerId);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Teams
   */

  public createTeam(): void {
    // todo
  }

  public removeTeam(): void {
    // todo
  }

  public addPlayerToTeam(): void {
    // todo
  }

  public removePlayerFromTeam(): void {
    // todo
  }

  /**
   * Resources
   */

  public addResourceToTerritory(resourceId: number, territoryCoordinates: GridCoordinates): void {
    try {
      this._map.addResourceToTerritory(resourceId, territoryCoordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public removeResourceFromTerritory(resourceId: number, territoryCoordinates: GridCoordinates): void {
    try {
      this._map.removeResourceFromTerritory(resourceId, territoryCoordinates);
    } catch (e) {
      console.warn(e);
    }
  }

  public getAvailableResources(): Resource[] {
    return Resource.getAvailableResources();
  }

  /**
   * ActionMenu
   */

  public openActionMenuAtPoint(actions: Action[], point: Point): void {
    this._screen.openActionMenuAtPoint(actions, point);
  }

  public closeActionMenu(): void {
    this._screen.closeActionMenu();
  }

  /**
   * Map move-screen/zoom-in-out
   */

  public move(dir: Direction): void {
    this._screen.move(dir);
    this.closeActionMenu();
  }

  public zoomIn(): void {
    this._screen.zoomIn();
    this.closeActionMenu();
  }

  public zoomOut(): void {
    this._screen.zoomOut();
    this.closeActionMenu();
  }

  /***
   * Events / callbacks
   */

  public set onActionButtonClick(callback: (actionId: string) => void) {
    this._screen.onActionButtonClick = callback;
  }

  public set onClick(callback: (territoryCoordinates: GridCoordinates, point: Point, e: MouseEvent) => void) {
    try {
      this._onClick = callback;
    } catch (e) {
      console.warn(e);
    }
  }

  public set onKeyPress(callback: (key: string) => void) {
    try {
      this._onKeyDown = callback;
    } catch (e) {
      console.warn(e);
    }
  }

  private clicked(e: MouseEvent): void {
    const point = { x: e.clientX, y: e.clientY } as Point;

    const territoryCoordinates = this.getTerritoryCoordinateByPoint(point);

    if (this._onClick) {
      this._onClick(territoryCoordinates, point, e);
    }
  }

  private scrolled(e: WheelEvent): void {
    if (e.deltaY > 0) {
      this.zoomOut();
    } else {
      this.zoomIn();
    }
  }

  private keyDown(e: KeyboardEvent): void {
    if (this._onKeyDown) {
      this._onKeyDown(e.key);
    } else {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.move('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.move('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.move('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.move('RIGHT');
      }
    }
  }

  private keyUp(e: KeyboardEvent): void {
    if (this._onKeyUp) {
      this._onKeyUp(e.key);
    } else {
      // default keyup
    }
  }
}

window.GameEngine = GameEngine;
