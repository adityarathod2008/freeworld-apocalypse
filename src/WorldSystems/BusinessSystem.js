/**
 * Game FreeWorld - BusinessSystem
 * City businesses: Apex Armory (Weapons & Ammo), Dealership (Vehicles), Octane Gas
 */
export class BusinessSystem {
  constructor(economy) {
    this.economy = economy;
  }

  buyAmmo(weaponId, cost) {
    if (this.economy.spendCash(cost)) {
      return true;
    }
    return false;
  }
}
