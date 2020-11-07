const resourceImageMapping = [
  { id: 1, img: 'gems.png' },
  { id: 2, img: 'gold.png' },
  { id: 3, img: 'silver.png' },
  { id: 4, img: 'stone.png' },
  { id: 5, img: 'cattle.png' },
  { id: 6, img: 'fish.png' },
  { id: 7, img: 'sheep.png' },
  { id: 8, img: 'coffee.png' },
  { id: 9, img: 'sugar.png' },
] as { id: number; img: string }[];

export default class Resource {
  public readonly id: number;

  public constructor(id: number) {
    if (!resourceImageMapping.find((m) => m.id === id)) {
      throw new Error("Resource isn't available.");
    }

    this.id = id;
  }

  public static getAvailableResources(): Resource[] {
    const resources = [] as Resource[];

    for (let i = 0; i < resourceImageMapping.length; i++) {
      resources.push(new Resource(resourceImageMapping[i].id));
    }

    return resources;
  }

  public get imageSrc(): string {
    const resourceMap = resourceImageMapping.find((r) => r.id === this.id);

    if (!resourceMap) {
      throw new Error('Something went wrong when tried to get resource image.');
    }

    return `../assets/img/resources/${resourceMap.img}`;
  }
}
