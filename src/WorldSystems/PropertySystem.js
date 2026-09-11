/**
 * Game FreeWorld - PropertySystem
 * Tracks player-owned real estate: Safehouse Penthouse, Garages, Harbor Warehouses
 */
export class PropertySystem {
  constructor() {
    this.properties = [
      { id: 'safehouse', name: 'Bayside Penthouse & Garage', owned: true, price: 0 },
      { id: 'warehouse', name: 'Harbor Marina Warehouse 04', owned: false, price: 120000 },
      { id: 'dealership_lot', name: 'Commercial Boulevard Showroom', owned: false, price: 350000 }
    ];
  }

  getOwnedProperties() {
    return this.properties.filter(p => p.owned);
  }
}
