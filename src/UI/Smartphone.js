/**
 * Game FreeWorld - Smartphone
 * In-game mobile phone interface with Banking, Valet Car Delivery, Mission logs, and Contacts
 */
import { events } from '../Core/EventBus.js';

export class Smartphone {
  constructor(economyManager, playerPosGetter) {
    this.economy = economyManager;
    this.getPlayerPos = playerPosGetter;

    this.container = document.getElementById('smartphone-container');
    this.clockEl = document.getElementById('phone-clock');
    this.homeGrid = document.getElementById('phone-home-app-grid');
    this.appContent = document.getElementById('phone-app-content');
    this.appBody = document.getElementById('phone-app-body');
    this.backBtn = document.getElementById('phone-back-btn');
    this.homeBar = document.getElementById('phone-home-bar');

    this.isOpen = false;
    this.currentApp = null;

    this.setupListeners();
  }

  setupListeners() {
    events.on('PHONE_TOGGLE', () => this.toggle());

    events.on('TIME_TICK', ({ timeStr }) => {
      if (this.clockEl) this.clockEl.textContent = timeStr;
    });

    if (this.homeBar) {
      this.homeBar.addEventListener('click', () => this.showHome());
    }

    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => this.showHome());
    }

    if (this.homeGrid) {
      this.homeGrid.querySelectorAll('.phone-app-icon').forEach(icon => {
        icon.addEventListener('click', () => {
          this.openApp(icon.dataset.app);
        });
      });
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.isOpen || !this.container) return;
    this.isOpen = true;
    this.container.classList.add('active');
    this.showHome();
  }

  close() {
    if (!this.isOpen || !this.container) return;
    this.isOpen = false;
    this.container.classList.remove('active');
  }

  showHome() {
    if (!this.homeGrid || !this.appContent) return;
    this.currentApp = null;
    this.homeGrid.style.display = 'grid';
    this.appContent.style.display = 'none';
  }

  openApp(appName) {
    this.currentApp = appName;
    this.homeGrid.style.display = 'none';
    this.appContent.style.display = 'flex';
    this.appBody.innerHTML = '';

    switch (appName) {
      case 'bank': this.renderBankApp(); break;
      case 'valet': this.renderValetApp(); break;
      case 'missions': this.renderMissionsApp(); break;
      case 'contacts': this.renderContactsApp(); break;
      case 'settings': this.renderSettingsApp(); break;
      default: this.showHome();
    }
  }

  renderBankApp() {
    this.appBody.innerHTML = `
      <div style="text-align:center; padding:10px 0;">
        <div style="font-size:12px; color:#94a3b8;">SECURE ACCOUNT</div>
        <div style="font-size:24px; font-weight:800; color:#55ff77; margin:6px 0;">
          $${this.economy.bank.toLocaleString()}
        </div>
        <div style="font-size:11px; color:#64748b;">Physical Cash: $${this.economy.cash.toLocaleString()}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:16px;">
        <button class="shop-item-buy-btn" id="phone-wire-cash">+ Deposit $2,500</button>
        <button class="shop-item-buy-btn" id="phone-wire-bank" style="background:#f59e0b;">- Withdraw $2,500</button>
      </div>
    `;

    document.getElementById('phone-wire-cash').addEventListener('click', () => {
      if (this.economy.deposit(2500)) this.renderBankApp();
    });
    document.getElementById('phone-wire-bank').addEventListener('click', () => {
      if (this.economy.withdraw(2500)) this.renderBankApp();
    });
  }

  renderValetApp() {
    this.appBody.innerHTML = `
      <div style="font-size:13px; font-weight:800; color:#ffb700; margin-bottom:8px;">VALET DISPATCH</div>
      <div style="font-size:11px; color:#888; margin-bottom:12px;">Deliver ride to your current coordinates:</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button class="shop-item-buy-btn" data-v="apex">⚡ Apex GT-X (Supercar)</button>
        <button class="shop-item-buy-btn" data-v="v8">🔥 Vindicator V8 (Muscle)</button>
        <button class="shop-item-buy-btn" data-v="sedan">💼 Kestrel (Sedan)</button>
        <button class="shop-item-buy-btn" data-v="truck">🛡️ Goliath 6x6 (Truck)</button>
        <button class="shop-item-buy-btn" data-v="bike">🏍️ Phantom Shadow (Bike)</button>
      </div>
    `;

    this.appBody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const vType = btn.dataset.v;
        const playerPos = this.getPlayerPos();
        const spawnPos = playerPos.clone().add({ x: 4, y: 0, z: 4 });
        events.emit('SPAWN_VEHICLE', { type: vType, position: spawnPos });
        this.close();
      });
    });
  }

  renderMissionsApp() {
    this.appBody.innerHTML = `
      <div style="font-size:13px; font-weight:800; color:#ec4899; margin-bottom:10px;">AVAILABLE CONTRACTS</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
          <div style="font-weight:700; color:#fff; font-size:12px;">Heist: The Syndicate Contract</div>
          <div style="font-size:10px; color:#55ff77; margin-top:2px;">Payout: $25,000</div>
          <button class="shop-item-buy-btn" id="start-heist-btn" style="margin-top:6px; width:100%;">START MISSION</button>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
          <div style="font-weight:700; color:#fff; font-size:12px;">Street Outlaw Drag Race</div>
          <div style="font-size:10px; color:#55ff77; margin-top:2px;">Payout: $6,500</div>
          <button class="shop-item-buy-btn" id="start-race-btn" style="margin-top:6px; width:100%; background:#3b82f6;">START RACE</button>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
          <div style="font-weight:700; color:#fff; font-size:12px;">Underground Courier Bounty</div>
          <div style="font-size:10px; color:#55ff77; margin-top:2px;">Payout: $8,000</div>
          <button class="shop-item-buy-btn" id="start-courier-btn" style="margin-top:6px; width:100%; background:#10b981;">START COURIER</button>
        </div>
      </div>
    `;

    document.getElementById('start-heist-btn').addEventListener('click', () => {
      events.emit('TRIGGER_START_MAIN_MISSION');
      this.close();
    });
    document.getElementById('start-race-btn').addEventListener('click', () => {
      events.emit('TRIGGER_START_RACE');
      this.close();
    });
    document.getElementById('start-courier-btn').addEventListener('click', () => {
      events.emit('TRIGGER_START_COURIER');
      this.close();
    });
  }

  renderContactsApp() {
    this.appBody.innerHTML = `
      <div style="font-size:13px; font-weight:800; color:#3b82f6; margin-bottom:10px;">CONTACTS</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; color:#fff; font-size:12px;">Marco (Syndicate Broker)</div>
            <div style="font-size:10px; color:#888;">Downtown Docks</div>
          </div>
          <button class="shop-item-buy-btn" id="call-marco">CALL</button>
        </div>
      </div>
    `;

    document.getElementById('call-marco').addEventListener('click', () => {
      events.emit('SHOW_SUBTITLE', {
        speaker: 'MARCO',
        text: 'Keep your head on a swivel out there. The police scanners are buzzing.'
      });
      this.close();
    });
  }

  renderSettingsApp() {
    this.appBody.innerHTML = `
      <div style="font-size:13px; font-weight:800; color:#94a3b8; margin-bottom:10px;">GAME SETTINGS</div>
      <div style="font-size:11px; color:#cbd5e1; line-height:1.6;">
        Controls:<br>
        • <b>WASD</b> - Move / Steer<br>
        • <b>Shift</b> - Sprint<br>
        • <b>Space</b> - Jump / Handbrake<br>
        • <b>C</b> - Crouch<br>
        • <b>E / F</b> - Enter Vehicle / Interact<br>
        • <b>Right Click</b> - Aim Weapon<br>
        • <b>Left Click</b> - Fire / Melee<br>
        • <b>1, 2, 3, 4</b> or <b>Tab</b> - Weapon Wheel<br>
        • <b>M</b> - Fullscreen District Map<br>
        • <b>P</b> or <b>↑</b> - Smartphone<br>
        • <b>~</b> or <b>F1</b> - Developer Console
      </div>
    `;
  }
}
