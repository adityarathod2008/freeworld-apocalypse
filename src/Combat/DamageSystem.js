/**
 * Game FreeWorld - DamageSystem
 * Handles weapon damage calculations, armor mitigation, critical headshots, and vehicle damage
 */
export class DamageSystem {
  static calculateDamage(baseDamage, isHeadshot = false, hasArmor = false) {
    let dmg = baseDamage;
    if (isHeadshot) {
      dmg *= 2.2;
    }
    if (hasArmor) {
      dmg *= 0.6; // Armor absorbs 40%
    }
    return Math.round(dmg);
  }
}
