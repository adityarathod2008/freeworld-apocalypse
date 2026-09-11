/**
 * Game FreeWorld - ShopSystem
 * Apex Armory weapons vendor, ATM banking transactions, and Luxury auto delivery
 */
import { events } from '../Core/EventBus.js';

export class ShopSystem {
  constructor(economyManager) {
    this.economy = economyManager;
    this.modal = document.getElementById('shop-modal');
    this.title = document.getElementById('shop-title');
    this.list = document.getElementById('shop-items-list');
    this.closeBtn = document.getElementById('shop-close-btn');

    this.armoryCatalog = [
      { id: 'ammo_pistol', name: 'Vortex-9 Rounds (30x)', cost: 250, type: 'ammo', weaponId: 1, amount: 30 },
      { id: 'ammo_rifle', name: 'Apex Carbine Drum (60x)', cost: 650, type: 'ammo', weaponId: 2, amount: 60 },
      { id: 'ammo_shotgun', name: 'Titan 12-Gauge Shells (24x)', cost: 450, type: 'ammo', weaponId: 3, amount: 24 },
      { id: 'armor_heavy', name: 'Tactical Kevlar Vest', cost: 1200, type: 'armor' }
    ];

    this.setupListeners();
  }

  setupListeners() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    events.on('TRIGGER_ACTIVATED', (trigger) => {
      if (trigger.type === 'shop') {
        this.openArmory();
      } else if (trigger.type === 'safehouse') {
        events.emit('SAVE_GAME');
        events.emit('HUD_NOTIFICATION', {
          title: 'SAFEHOUSE PENTHOUSE',
          message: 'Game saved successfully. Health restored!'
        });
        events.emit('RESTORE_HEALTH');
      } else if (trigger.type === 'atm') {
        this.openATM();
      }
    });
  }

  openArmory() {
    if (!this.modal || !this.list) return;
    this.title.textContent = 'APEX ARMORY — WEAPONS & GEAR';
    this.list.innerHTML = '';

    this.armoryCatalog.forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div>
          <div style="font-weight:700; color:#fff;">${item.name}</div>
          <div style="font-size:12px; color:#00f0ff;">$${item.cost.toLocaleString()}</div>
        </div>
        <button class="shop-item-buy-btn">BUY</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        if (this.economy.spendCash(item.cost)) {
          if (item.type === 'ammo') {
            events.emit('BUY_AMMO', { weaponId: item.weaponId, amount: item.amount });
          } else if (item.type === 'armor') {
            events.emit('RESTORE_ARMOR');
          }
          events.emit('HUD_NOTIFICATION', {
            title: 'PURCHASE COMPLETE',
            message: `Acquired ${item.name}`
          });
        }
      });

      this.list.appendChild(card);
    });

    this.modal.style.display = 'flex';
  }

  openATM() {
    if (!this.modal || !this.list) return;
    this.title.textContent = 'FLEECA BANK ATM';
    this.list.innerHTML = `
      <div class="shop-item-card">
        <div>
          <div style="font-weight:700; color:#fff;">Deposit $5,000 Cash</div>
          <div style="font-size:12px; color:#55ff77;">Transfer into secure bank balance</div>
        </div>
        <button class="shop-item-buy-btn" id="atm-dep-btn">DEPOSIT</button>
      </div>
      <div class="shop-item-card">
        <div>
          <div style="font-weight:700; color:#fff;">Withdraw $5,000 Cash</div>
          <div style="font-size:12px; color:#ffb700;">Take out physical currency</div>
        </div>
        <button class="shop-item-buy-btn" id="atm-wdr-btn">WITHDRAW</button>
      </div>
    `;

    document.getElementById('atm-dep-btn').addEventListener('click', () => {
      if (this.economy.deposit(5000)) {
        events.emit('HUD_NOTIFICATION', { title: 'ATM DEPOSIT', message: 'Deposited $5,000 to bank' });
      }
    });

    document.getElementById('atm-wdr-btn').addEventListener('click', () => {
      if (this.economy.withdraw(5000)) {
        events.emit('HUD_NOTIFICATION', { title: 'ATM WITHDRAWAL', message: 'Withdrew $5,000 in cash' });
      }
    });

    this.modal.style.display = 'flex';
  }

  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
}
