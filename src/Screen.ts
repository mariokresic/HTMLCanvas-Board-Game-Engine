import Map from '@/models/Map';
import Territory from '@/models/Territory';
import Resource from '@/models/Resource';

interface Scalable {
  scale: number;
  zoomIn(): void;
  zoomOut(): void;
}

interface Translatable {
  translateX: number;
  translateY: number;
  translate(x: number, y: number): void;
  moveUp(): void;
  moveDown(): void;
  moveLeft(): void;
  moveRight(): void;
}

interface Canvas {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  screenOptions: ScreenOptions;
  offsetX: number;
  offsetY: number;
}

class ImagesLoader {
  private readonly _dir: string;

  public constructor(dir: string) {
    this._dir = dir;
  }

  public static loadImages(dir: string): HTMLImageElement[] {
    const images = [] as HTMLImageElement[];

    const resources = Resource.getAvailableResources();

    for (let i = 0; i < resources.length; i++) {
      images.push(ImagesLoader.loadImage(`resource-${resources[i].id}`, resources[i].imageSrc));
    }

    images.push(ImagesLoader.loadImage('bg-image', `${dir}/bg.jpg`));
    images.push(ImagesLoader.loadImage('hq-image', `${dir}/hq.png`));
    images.push(ImagesLoader.loadImage('house-image', `${dir}/house.png`));
    // loop images 1-10
    for (let j = 1; j <= 9; j++) {
      images.push(ImagesLoader.loadImage(`${j}-image`, `${dir}/${j}.png`));
    }

    return images;
  }

  private static loadImage(id: string, src: string): HTMLImageElement {
    const image = new Image();
    image.id = id;
    image.src = src;

    return image;
  }
}

class Drawer {
  private readonly _territorySize: number;
  private readonly _territoryWidth: number;
  private readonly _territoryHeight: number;
  private _mapShape: MapShape;
  private _imageDir: string;
  private readonly _images: HTMLImageElement[] = [];

  public constructor(territorySize: number, terrain: Terrain, mapShape: MapShape, imagesDir = '../assets/img') {
    this._territorySize = territorySize;
    this._territoryWidth = territorySize * Math.sqrt(3);
    this._territoryHeight = territorySize * 2;
    this._mapShape = mapShape;
    this._imageDir = imagesDir;
    this._images = ImagesLoader.loadImages(imagesDir + '/' + terrain);
  }

  public drawTerritory(
    ctx: CanvasRenderingContext2D,
    territory: Territory,
    playerColor: string | null = null,
    mapCenter: Point = { x: 0, y: 0 },
    scale = 1,
    highlighted = false,
    showUnits = false,
    showCoordinates = false,
  ): void {
    const territoryCenter = this.getTerritoryCenter(territory.coordinates, mapCenter, scale);

    ctx.drawImage(
      this.findImage(territory.imageId),
      territoryCenter.x - (this._territoryWidth * scale) / 2 - 0.5,
      territoryCenter.y - (this._territoryHeight * scale) / 2 - 0.5,
      this._territoryWidth * scale + 1,
      this._territoryHeight * scale + 1,
    );

    if (playerColor && showUnits) {
      this.drawTerritoryUnitsCount(ctx, territoryCenter, playerColor, territory.units, scale);
    }

    if (playerColor && !showUnits) {
      this.drawPlayerColor(ctx, playerColor, territoryCenter, scale);
    }

    if (territory.resources.length) {
      for (let i = 0; i < territory.resources.length; i++) {
        ctx.drawImage(
          this.findImage(`resource-${territory.resources[i].id}`),
          territoryCenter.x - 30 * scale + i * 22 * scale,
          territoryCenter.y - 30 * scale,
          16 * scale,
          16 * scale,
        );
      }
    }

    if (highlighted) {
      this.highlightTerritory(ctx, territory.coordinates, mapCenter, scale);
    }

    if (showCoordinates) {
      ctx.strokeStyle = '#d50000';
      ctx.font = `800`;
      ctx.strokeText(`${territory.i}, ${territory.j}`, territoryCenter.x - 12 * scale, territoryCenter.y);
    }
  }

  public drawTerritoryWithFog(
    ctx: CanvasRenderingContext2D,
    territory: Territory,
    mapCenter: Point = { x: 0, y: 0 },
    scale = 1,
    highlighted = false,
    showCoordinates = false,
  ): void {
    const territoryCenter = this.getTerritoryCenter(territory.coordinates, mapCenter, scale);
    const territoryPath = this.getTerritoryHighlightPath(territoryCenter, scale);

    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill(territoryPath);

    if (highlighted) {
      this.highlightTerritory(ctx, territory.coordinates, mapCenter, scale);
    }

    if (showCoordinates) {
      ctx.strokeStyle = '#d50000';
      ctx.font = `800`;
      ctx.strokeText(`${territory.i}, ${territory.j}`, territoryCenter.x - 12 * scale, territoryCenter.y);
    }
  }

  public drawTerritoryUnitsCount(
    ctx: CanvasRenderingContext2D,
    territoryCenter: Point,
    playerColor: string,
    units: number,
    scale = 1,
  ): void {
    ctx.beginPath();
    ctx.fillStyle = playerColor;
    console.log(scale);
    ctx.moveTo(territoryCenter.x, territoryCenter.y);

    ctx.arc(territoryCenter.x, territoryCenter.y - 6 * scale, 12 * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    ctx.strokeStyle = '#000';
    ctx.strokeText('25', territoryCenter.x - 5, territoryCenter.y - 5);
  }

  public drawPlayerColor(
    ctx: CanvasRenderingContext2D,
    playerColor: string,
    territoryCenter: Point,
    scale: number,
  ): void {
    ctx.beginPath();
    ctx.fillStyle = playerColor;

    ctx.moveTo(territoryCenter.x, territoryCenter.y + (this._territoryHeight * scale) / 2 - 8 * scale);

    ctx.arc(
      territoryCenter.x,
      territoryCenter.y + (this._territoryHeight * scale) / 2 - 8 * scale,
      12 * scale,
      (-6 / 7) * Math.PI,
      (-1 / 7) * Math.PI,
    );
    ctx.closePath();
    ctx.fill();
  }

  public drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.drawImage(this.findImage('bg-image'), 0, 0, width, height);
    // ctx.fillStyle = "brown";
    // ctx.fillRect(0, 0, width, height);
  }

  public highlightTerritory(
    ctx: CanvasRenderingContext2D,
    coordinate: GridCoordinates,
    mapCenter: Point = { x: 0, y: 0 },
    scale = 1,
  ): void {
    const territoryCenter = this.getTerritoryCenter(coordinate, mapCenter, scale);
    const territoryPath = this.getTerritoryHighlightPath(territoryCenter, scale);

    ctx.fillStyle = 'rgba(233,30,99, .4)';
    ctx.fillStyle;
    ctx.fill(territoryPath);
  }

  public isPointInTerritory(
    ctx: CanvasRenderingContext2D,
    territoryCoordinate: GridCoordinates,
    point: Point,
    mapCenter: Point = { x: 0, y: 0 },
    scale = 1,
  ): boolean {
    const territoryCenter = this.getTerritoryCenter(territoryCoordinate, mapCenter, scale);

    return ctx.isPointInPath(this.getTerritoryPath(territoryCenter, scale), point.x, point.y);
  }

  private getTerritoryPath(territoryCenter: Point = { x: 0, y: 0 }, scale = 1): Path2D {
    const path = new Path2D();

    // move to first point
    path.moveTo(
      territoryCenter.x + Math.sin(0) * this._territorySize * scale,
      territoryCenter.y + Math.cos(0) * this._territorySize * scale,
    );
    // prepare 6 lines
    for (let j = 1; j <= 6; j++) {
      path.lineTo(
        territoryCenter.x + Math.sin((j / 6) * Math.PI * 2) * this._territorySize * scale,
        territoryCenter.y + Math.cos((j / 6) * Math.PI * 2) * this._territorySize * scale,
      );
    }

    return path;
  }

  private getTerritoryHighlightPath(territoryCenter: Point = { x: 0, y: 0 }, scale = 1): Path2D {
    const path = new Path2D();

    // move to first point
    path.moveTo(
      territoryCenter.x + Math.sin(0) * (this._territorySize + 0.25) * scale,
      territoryCenter.y + Math.cos(0) * (this._territorySize + 0.25) * scale - 5 * scale,
    );
    // prepare 6 lines
    for (let j = 1; j <= 6; j++) {
      path.lineTo(
        territoryCenter.x + Math.sin((j / 6) * Math.PI * 2) * (this._territorySize + 0.25) * scale,
        territoryCenter.y +
          Math.cos((j / 6) * Math.PI * 2) * (this._territorySize + 0.25) * scale -
          (j === 1 || j === 5 || j === 6 ? 5 * scale : 0),
      );
    }

    return path;
  }

  private getTerritoryCenter(coordinate: GridCoordinates, offset: Point = { x: 0, y: 0 }, scale = 1): Point {
    const mapShape = 1; //this._mapShape === 'box' ? -1 : 1;

    return {
      x: offset.x + (mapShape * ((2 * mapShape * coordinate.i + coordinate.j) * this._territoryWidth * scale)) / 2,
      y:
        offset.y +
        (this._territoryWidth / 10) * coordinate.j * scale -
        (this._territoryHeight * scale * coordinate.j * 3) / 4,
    };
  }

  private findImage(id: string): HTMLImageElement {
    const image = this._images.find((img) => img.id === id);
    if (!image) {
      throw new Error("Couldn't find image data");
    }

    return image;
  }
}

class ActionMenu {
  private readonly _div: HTMLDivElement;
  private _onActionButtonClick: ((actionId: string) => void) | null = null;

  public constructor(div: HTMLDivElement, onActionButtonClickCallback: ((actionId: string) => void) | null = null) {
    this._div = div;
    if (onActionButtonClickCallback) {
      this._onActionButtonClick = onActionButtonClickCallback;
    }
    this._div.id = 'action-menu';
    this._div.style.padding = '10px 5px';
    this._div.style.backgroundColor = 'rgba(0, 0, 0, .8)';
    this._div.style.position = 'absolute';
    this._div.style.top = '50%';
    this._div.style.left = '50%';
    this._div.style.display = 'none';
  }

  public get div(): HTMLDivElement {
    return this._div;
  }

  public set onActionButtonClick(onActionButtonClick: (actionId: string) => void) {
    this._onActionButtonClick = onActionButtonClick;
  }

  public show(point: Point, actions: Action[]): void {
    this.clearMenu();
    this._div.style.top = `${point.y - 5}px`;
    this._div.style.left = `${point.x + 5}px`;

    for (let i = 0; i < actions.length; i++) {
      this.createActionButton(actions[i]);
    }

    this._div.style.display = 'block';
  }

  public hide(): void {
    this._div.style.display = 'none';

    this.clearMenu();
  }

  private clearMenu(): void {
    this._div.innerHTML = '';
    // const childNotesLength = this._div.childNodes.length;
    //
    // for (let i = 0; i < childNotesLength; i++) {
    //   this._div.removeChild(this._div.childNodes[0]);
    // }
  }

  private createActionButton(action: Action): void {
    const button = document.createElement('button');
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.padding = '5px';
    button.style.margin = '5px 0';
    button.style.textTransform = 'uppercase';
    button.style.fontSize = '12px';
    button.style.fontWeight = '800';
    button.type = 'button';
    button.id = action.id;
    button.value = action.id;
    button.textContent = action.text;
    button.onclick = (e: MouseEvent) => {
      e.stopPropagation();

      const target = e.target as HTMLButtonElement;

      if (target && target.id && this._onActionButtonClick) {
        this._onActionButtonClick(target.id);
      }
      this.hide();
    };
    this._div.appendChild(button);
  }
}

abstract class CanvasScreen implements Canvas {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _context: CanvasRenderingContext2D;
  private readonly _screenOptions: ScreenOptions;

  protected constructor(canvas: HTMLCanvasElement, screenOptions: ScreenOptions) {
    this._canvas = canvas;
    this._context = this._canvas.getContext('2d') as CanvasRenderingContext2D;
    this._screenOptions = screenOptions;
    this._canvas.width = this._screenOptions.width;
    this._canvas.height = this._screenOptions.height;
    this._canvas.id = this._screenOptions.id;

    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public get context(): CanvasRenderingContext2D {
    return this._context;
  }

  public get screenOptions(): ScreenOptions {
    return this._screenOptions;
  }

  public get offsetX(): number {
    return this._canvas.getBoundingClientRect().x;
  }

  public get offsetY(): number {
    return this._canvas.getBoundingClientRect().y;
  }

  public get width(): number {
    return this._screenOptions.width;
  }

  public get height(): number {
    return this._screenOptions.height;
  }

  public refresh(): void {
    this.clear();
    this.render();
  }

  public clear(): void {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  abstract render(): void;
}

class BackgroundCanvas extends CanvasScreen {
  private readonly _drawer: Drawer;

  public constructor(canvas: HTMLCanvasElement, screenOptions: ScreenOptions, drawer: Drawer) {
    super(canvas, screenOptions);

    this._drawer = drawer;
  }

  public render(): void {
    this._drawer.drawBackground(this.context, this.width, this.height);
  }
}

class BoardCanvas extends CanvasScreen implements Scalable, Translatable {
  private _translateX = 0;
  private _translateY = 0;
  private _scale = 1;
  private readonly _drawer: Drawer;
  private readonly _map: Map;

  public constructor(canvas: HTMLCanvasElement, map: Map, screenOptions: ScreenOptions, drawer: Drawer) {
    super(canvas, screenOptions);

    this._map = map;
    this._drawer = drawer;
  }

  public get center(): Point {
    return {
      x: this.width / 2,
      y: this.height / 2,
    };
  }

  public get scale(): number {
    return this._scale;
  }

  public get translateX(): number {
    return this._translateX;
  }

  public get translateY(): number {
    return this._translateY;
  }

  public moveUp(): void {
    if (this._translateY >= (this.height / 2) * this._scale) {
      this._translateY = (this.height / 2) * this._scale;
    } else {
      this._translateY =
        this._translateY + 10 * this._scale < (-this.height / 2) * this._scale
          ? (-this.height / 2) * this._scale
          : this._translateY < 0 && this._translateY > -10 * this._scale
          ? 0
          : this._translateY + 10 * this._scale;
    }

    this.refresh();
  }

  public moveDown(): void {
    if (this._translateY <= (-this.height / 2) * this._scale) {
      this._translateY = (-this.height / 2) * this._scale;
    } else {
      this._translateY =
        this._translateY - 10 * this._scale > (this.height / 2) * this._scale
          ? (this.height / 2) * this._scale
          : this._translateY > 0 && this._translateY < 10 * this._scale
          ? 0
          : this._translateY - 10 * this._scale;
    }

    this.refresh();
  }

  public moveLeft(): void {
    if (this._translateX >= (this.width / 2) * this._scale) {
      this._translateX = (this.width / 2) * this._scale;
    } else {
      this._translateX =
        this._translateX + 10 * this._scale < (-this.width / 2) * this._scale
          ? (-this.width / 2) * this._scale
          : this._translateX < 0 && this._translateX > -10 * this._scale
          ? 0
          : this._translateX + 10 * this._scale;
    }

    this.refresh();
  }

  public moveRight(): void {
    if (this._translateX <= (-this.width / 2) * this._scale) {
      this._translateX = (-this.width / 2) * this._scale;
    } else {
      this._translateX =
        this._translateX - 10 * this._scale > (this.width / 2) * this._scale
          ? (this.width / 2) * this._scale
          : this._translateX > 0 && this._translateX < 10 * this._scale
          ? 0
          : this._translateX - 10 * this._scale;
    }

    this.refresh();
  }

  public zoomIn(): void {
    if (this._scale >= 3) return;

    if (this._translateX < 0) {
      this.moveRight();
    } else if (this._translateX > 0) {
      this.moveLeft();
    }

    if (this._translateY < 0) {
      this.moveDown();
    } else if (this._translateY > 0) {
      this.moveUp();
    }

    this._scale = this._scale + 0.1;
    this.refresh();
  }

  public zoomOut(): void {
    if (this._scale <= 1) return;

    if (this._translateX < 0) {
      this.moveLeft();
    } else if (this._translateX > 0) {
      this.moveRight();
    }

    if (this._translateY < 0) {
      this.moveUp();
    } else if (this._translateY > 0) {
      this.moveDown();
    }

    this._scale = this._scale - 0.1;
    this.refresh();
  }

  public render(): void {
    if (!this._drawer) {
      throw new Error('Territory drawer not initialized.');
    }
    for (let i = 0; i < this._map.territories.length; i++) {
      if (this._map.options.fogOfWar && this._map.isTerritoryInFogOfWar(this._map.territories[i])) {
        this._drawer.drawTerritoryWithFog(
          this.context,
          this._map.territories[i],
          {
            x: this.width / 2 + this._translateX,
            y: this.height / 2 + this._translateY,
          },
          this._scale,
          this._map.territories[i].isSelected,
          this._map.options.showTerritoryCoordinates,
        );
      } else {
        this._drawer.drawTerritory(
          this.context,
          this._map.territories[i],
          this._map.territories[i].playerId ? this._map.getPlayerColor(this._map.territories[i].playerId) : null,
          {
            x: this.width / 2 + this._translateX,
            y: this.height / 2 + this._translateY,
          },
          this._scale,
          this._map.territories[i].isSelected,
          this._map.options.showUnits,
          this._map.options.showTerritoryCoordinates,
        );
      }
    }
  }

  public isPointInTerritory(point: Point, territoryCoordinates: GridCoordinates): boolean {
    return this._drawer.isPointInTerritory(
      this.context,
      territoryCoordinates,
      point,
      {
        x: this.width / 2 + this._translateX + this.canvas.getBoundingClientRect().x,
        y: this.height / 2 + this._translateY + this.canvas.getBoundingClientRect().y,
      },
      this._scale,
    );
  }

  public highlightTerritory(territoryCoordinates: GridCoordinates) {
    this._drawer.highlightTerritory(
      this.context,
      territoryCoordinates,
      {
        x: this.width / 2 + this._translateX,
        y: this.height / 2 + this._translateY,
      },
      this._scale,
    );
  }

  public translate(x: number, y: number): void {
    this.context.translate(x, y);
  }
}

export default class Screen {
  private readonly _div: HTMLDivElement;
  private readonly _backgroundCanvas: BackgroundCanvas;
  private readonly _boardCanvas: BoardCanvas;
  private readonly _screenOptions: ScreenOptions;
  private readonly _actionMenu: ActionMenu;
  private readonly _drawer: Drawer;
  private readonly _map: Map;

  private _onActionButtonClick: ((actionId: string) => void) | null;

  public constructor(
    map: Map,
    screenOptions: ScreenOptions,
    onActionButtonClick: ((actionId: string) => void) | null = null,
  ) {
    this._div = document.getElementById(screenOptions.id) as HTMLDivElement;

    if (!this._div) {
      throw new Error(`Couldn't find game html div.`);
    }

    this._div.style.position = 'relative';
    this._div.style.width = `${screenOptions.width}px`;
    this._div.style.minWidth = `${screenOptions.width}px`;
    this._div.style.height = `${screenOptions.height}px`;
    this._div.style.minHeight = `${screenOptions.height}px`;
    this._div.style.backgroundColor = `rgba(0,0,0,.2)`;

    this._map = map;
    this._screenOptions = screenOptions;
    this._onActionButtonClick = onActionButtonClick;

    const territorySize = screenOptions.height / (2 * Math.sqrt(2) * map.options.size);

    this._drawer = new Drawer(territorySize, this._map.options.terrain, this._map.options.shape);

    this._backgroundCanvas = this.initBackgroundCanvas();
    this._boardCanvas = this.initBoardCanvas();
    this._actionMenu = this.initActionMenu();

    setTimeout(() => this._backgroundCanvas.render(), 150);
  }

  public set onActionButtonClick(onActionButtonClick: (actionId: string) => void) {
    this._onActionButtonClick = onActionButtonClick;
    this._actionMenu.onActionButtonClick = this._onActionButtonClick;
  }

  public get div(): HTMLDivElement {
    return this._div;
  }

  public render(): void {
    this._boardCanvas.refresh();
  }

  public zoomIn(): void {
    this._boardCanvas.zoomIn();
  }

  public zoomOut(): void {
    this._boardCanvas.zoomOut();
  }

  public move(direction: Direction): void {
    if (direction === 'LEFT') {
      this._boardCanvas.moveLeft();
    }
    if (direction === 'RIGHT') {
      this._boardCanvas.moveRight();
    }
    if (direction === 'UP') {
      this._boardCanvas.moveUp();
    }
    if (direction === 'DOWN') {
      this._boardCanvas.moveDown();
    }
  }

  public getTerritoryCoordinateByPoint(point: Point): GridCoordinates | null {
    let territoryCoordinates = null;

    for (let i = 0; i < this._map.territories.length; i++) {
      if (this._boardCanvas.isPointInTerritory(point, this._map.territories[i].coordinates)) {
        territoryCoordinates = this._map.territories[i].coordinates;
      }
    }

    return territoryCoordinates;
  }

  public openActionMenuAtPoint(actions: Action[], point: Point): void {
    this._actionMenu.show(
      { x: point.x - this._div.getBoundingClientRect().x, y: point.y - this._div.getBoundingClientRect().y },
      actions,
    );
  }

  public closeActionMenu(): void {
    this._actionMenu.hide();
  }

  private initBackgroundCanvas(): BackgroundCanvas {
    const canvas = document.createElement('canvas');
    const screenOptions = {
      id: 'background',
      width: this._screenOptions.width,
      height: this._screenOptions.height,
      zIndex: 1,
    };

    const background = new BackgroundCanvas(canvas, screenOptions, this._drawer);

    this._div.appendChild(background.canvas);

    return background;
  }

  private initBoardCanvas(): BoardCanvas {
    const canvas = document.createElement('canvas');
    const screenOptions = {
      id: 'board',
      width: this._screenOptions.width,
      height: this._screenOptions.height,
      zIndex: 2,
    };

    const board = new BoardCanvas(canvas, this._map, screenOptions, this._drawer);

    this._div.appendChild(board.canvas);

    return board;
  }

  private initActionMenu(): ActionMenu {
    const actionMenuDiv = document.createElement('div');
    actionMenuDiv.style.zIndex = '3';

    this._div.appendChild(actionMenuDiv);

    return new ActionMenu(actionMenuDiv, this._onActionButtonClick);
  }
}

// ctx.imageSmoothingEnabled = true;
// ctx.imageSmoothingQuality = "high";
