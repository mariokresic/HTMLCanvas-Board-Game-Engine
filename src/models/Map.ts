import Territory from '@/models/Territory';
import Player from '@/models/Player';
import Team from '@/models/Team';
import Resource from '@/models/Resource';

export default class Map {
  public readonly options: MapOptions;
  private readonly _territories: Territory[];
  private _teams: Team[] = [];
  private _players: Player[] = [];
  private _currentPlayerId: number | null;

  /**
   * Static
   */

  public static init(currentPlayerId: number | null, options: MapOptions): Map {
    return new Map(currentPlayerId, options);
  }

  private constructor(currentPlayerId: number | null, options: MapOptions) {
    if (options.size < 3 || options.size > 10) {
      throw new Error('Map size must be an integer from 3 to 10');
    }

    this._currentPlayerId = currentPlayerId;
    this.options = options;
    this._territories = this.createTerritories();
  }

  /**
   * Get/Set
   */
  public get teams(): Team[] {
    return this._teams;
  }

  public get territories(): Territory[] {
    return this._territories;
  }

  public get currentPlayerId(): number | null {
    return this._currentPlayerId;
  }

  public set currentPlayerId(value: number | null) {
    this._currentPlayerId = value;
  }

  /**
   * Players
   */
  public getPlayerById(playerId: number): Player {
    return this.findPlayer(playerId);
  }

  public getPlayersByTeamId(teamId: number): Player[] {
    const team = this.findTeam(teamId);

    return this._players.filter((p) => p.teamId === team.id);
  }

  public getPlayerColor(playerId: number): string {
    return this.findPlayer(playerId).color;
  }

  public addPlayers(players: Player[]): void {
    for (let i = 0; i < players.length; i++) {
      this.addPlayer(players[i]);
    }
  }

  public addPlayer(player: Player): void {
    if (this._players.find((p: Player) => p.id === player.id)) {
      throw new Error('Player with that id already exists.');
    }

    this._players.push(player);
  }

  public removePlayer(playerId: number): void {
    const territories = this.getTerritoriesByPlayerId(playerId);
    const playerIndex = this.findPlayerIndex(playerId);

    for (let i = 0; i < territories.length; i++) {
      this.removeTerritoryFromPlayer(territories[i].coordinates);
    }

    this._players.splice(playerIndex, 1);
  }

  /**
   * Teams
   */

  public getTeamById(teamId: number): Team {
    return this.findTeam(teamId);
  }

  public addTeam(team: Team): void {
    if (this._teams.find((t) => t.id === team.id)) {
      throw new Error('Team with that id already exists.');
    }

    this._teams.push(team);
  }

  public removeTeam(teamId: number): void {
    const players = this.getPlayersByTeamId(teamId);
    const teamIndex = this.findTeamIndex(teamId);

    for (let i = 0; i < players.length; i++) {
      this.removePlayerFromTeam(players[i].id);
    }

    this._players.splice(teamIndex, 1);
  }

  public addPlayerToTeam(playerId: number, teamId: number): void {
    const player = this.findPlayer(playerId);
    const team = this.findTeam(teamId);

    player.teamId = team.id;
  }

  public removePlayerFromTeam(playerId: number): void {
    const player = this.findPlayer(playerId);

    player.teamId = null;
  }

  /**
   * Resources
   */

  public addResourceToTerritory(resourceId: number, territoryCoordinates: GridCoordinates): void {
    const territory = this.findTerritory(territoryCoordinates);

    territory.addResource(new Resource(resourceId));
  }

  public removeResourceFromTerritory(resourceId: number, territoryCoordinates: GridCoordinates): void {
    const territory = this.findTerritory(territoryCoordinates);

    territory.removeResource(resourceId);
  }

  /**
   * Territories
   */
  public getTerritoryByCoordinates(territoryCoordinates: GridCoordinates): Territory {
    return this.findTerritory(territoryCoordinates);
  }

  public getTerritoriesByPlayerId(playerId: number): Territory[] {
    return this._territories.filter((t) => t.playerId === playerId);
  }

  public getSelectedTerritories(): Territory[] {
    return this.territories.filter((t) => t.isSelected);
  }

  public setTerritoryHq(territoryCoordinates: GridCoordinates): void {
    this.findTerritory(territoryCoordinates).isHq = true;
  }

  public removeTerritoryHq(territoryCoordinates: GridCoordinates): void {
    this.findTerritory(territoryCoordinates).isHq = false;
  }

  public removeAllTerritoryHqByPlayerId(playerId: number): void {
    const territories = this.getTerritoriesByPlayerId(playerId).filter((t) => t.isHq);

    for (let i = 0; i < territories.length; i++) {
      this.removeTerritoryHq(territories[i].coordinates);
    }
  }

  public setTerritoryUnits(territoryCoordinates: GridCoordinates, units: number): void {
    const territory = this.findTerritory(territoryCoordinates);

    territory.units = units;
  }

  public addTerritoryToPlayer(playerId: number, territoryCoordinates: GridCoordinates): void {
    const territory = this.findTerritory(territoryCoordinates);

    territory.playerId = playerId;
  }

  public addTerritoriesToPlayer(playerId: number, territoryCoordinates: GridCoordinates[]): void {
    for (let i = 0; i < territoryCoordinates.length; i++) {
      this.addTerritoryToPlayer(playerId, territoryCoordinates[i]);
    }
  }

  public removeTerritoryFromPlayer(territoryCoordinates: GridCoordinates): void {
    const territory = this.findTerritory(territoryCoordinates);

    if (!territory.playerId) {
      throw new Error("This territory doesn't belong to any player.");
    }

    if (territory.isHq) {
      territory.isHq = false;
    }

    territory.playerId = null;
  }

  public isTerritoryInFogOfWar(territory: Territory): boolean {
    if (territory.playerId === this._currentPlayerId) return false;

    const currentPlayerTerritories = this.getTerritoriesByPlayerId(this._currentPlayerId);

    for (let i = 0; i < currentPlayerTerritories.length; i++) {
      if (this.isTerritoryNeighbor(currentPlayerTerritories[i].coordinates, territory.coordinates)) {
        return false;
      }
    }

    return true;
  }

  public isTerritoryNeighborToPlayer(territoryCoordinates: GridCoordinates, playerId: number): boolean {
    const territory = this.getTerritoryByCoordinates(territoryCoordinates);

    if (territory.playerId === playerId) {
      throw new Error('Player is territory owner.');
    }

    const territoryNeighbors = this.getTerritoryNeighbors(territoryCoordinates);

    for (let i = 0; i < territoryNeighbors.length; i++) {
      if (territoryNeighbors[i].playerId === playerId) {
        return true;
      }
    }

    return false;
  }

  public isTerritoryNeighbor(
    territoryCoordinates: GridCoordinates,
    secondTerritoryCoordinates: GridCoordinates,
  ): boolean {
    return !!this.getTerritoryNeighbors(territoryCoordinates).find(
      (t) => t.i === secondTerritoryCoordinates.i && t.j === secondTerritoryCoordinates.j,
    );
  }

  public getTerritoryNeighbors(territoryCoordinates: GridCoordinates): Territory[] {
    const directions = [
      [0, 1],
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
    ];
    const neighborTerritories = [] as Territory[];

    for (let i = 0; i < directions.length; i++) {
      const territory = this._territories.find(
        (t) =>
          t.coordinates.i === territoryCoordinates.i + directions[i][0] &&
          t.coordinates.j === territoryCoordinates.j + directions[i][1],
      );

      if (territory) {
        neighborTerritories.push(territory);
      }
    }

    return neighborTerritories;
  }

  public selectTerritory(territoryCoordinates: GridCoordinates, unselectCurrentlySelected: boolean): void {
    if (unselectCurrentlySelected) {
      this.unselectAllTerritories();
    }

    this.findTerritory(territoryCoordinates).isSelected = true;
  }

  public unselectAllTerritories(): void {
    const selectedTerritories = this.getSelectedTerritories();

    for (let i = 0; i < selectedTerritories.length; i++) {
      selectedTerritories[i].isSelected = false;
    }
  }

  public updateTerritoryTerrain(territoryCoordinates: GridCoordinates, terrain: number): void {
    const territory = this.getTerritoryByCoordinates(territoryCoordinates);

    territory.terrain = terrain;
  }

  /**
   * Private functions
   */

  private findPlayer(playerId: number): Player {
    const player = this._players.find((p) => p.id === playerId);

    if (!player) {
      throw new Error('There is no player with that id.');
    }

    return player;
  }

  private findPlayerIndex(playerId: number): number {
    const index = this._players.findIndex((p) => p.id === playerId);

    if (!index) {
      throw new Error('There is no player with that id.');
    }

    return index;
  }

  private findTerritory(territoryCoordinates: GridCoordinates): Territory {
    const territory = this._territories.find((t) => t.i === territoryCoordinates.i && t.j === territoryCoordinates.j);

    if (!territory) {
      throw new Error('There is no territory with that coordinates.');
    }

    return territory;
  }

  private findTeam(teamId: number): Team {
    const team = this._teams.find((t) => t.id === teamId);

    if (!team) {
      throw new Error('There is no team with that id.');
    }

    return team;
  }

  private findTeamIndex(teamId: number): number {
    const index = this._teams.findIndex((t) => t.id === teamId);

    if (!index) {
      throw new Error('There is no team with that id.');
    }

    return index;
  }

  private createTerritories(): Territory[] {
    const territories = [] as Territory[];

    for (let j = this.options.size - 1; j > -this.options.size; j--) {
      for (let i = this.options.size - 1; i > -this.options.size; i--) {
        for (let k = -this.options.size + 1; k < this.options.size; k++) {
          // if (this.options.shape === 'box' || i + j + k === 0) { // box is buggy
          if (i + j + k === 0) {
            const terrainNumber = Math.floor(Math.random() * 9) + 1;
            territories.push(new Territory(i, j, terrainNumber));
          }
        }
      }
    }

    return territories;
  }
}
