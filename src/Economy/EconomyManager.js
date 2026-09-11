/**
 * Game FreeWorld - EconomyManager
 * Manages player cash, bank accounts, and financial transactions
 */
import { events } from '../Core/EventBus.js';

export class EconomyManager {
  constructor(initialCash = 15400, initialBank = 45000) {
    this.cash = initialCash;
    this.bank = initialBank;

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('MISSION_COMPLETED', ({ rewardCash }) => {
      if (rewardCash) this.addCash(rewardCash);
    });

    events.on('DEBUG_ADD_CASH', (amount) => {
      this.addCash(amount || 10000);
    });
  }

  addCash(amount) {
    this.cash += amount;
    this.emitChange();
    events.emit('HUD_NOTIFICATION', {
      title: 'CASH RECEIVED',
      message: `+$${amount.toLocaleString()}`
    });
  }

  spendCash(amount) {
    if (this.cash >= amount) {
      this.cash -= amount;
      this.emitChange();
      return true;
    }
    events.emit('HUD_NOTIFICATION', {
      title: 'INSUFFICIENT FUNDS',
      message: 'You cannot afford this item'
    });
    return false;
  }

  deposit(amount) {
    if (this.spendCash(amount)) {
      this.bank += amount;
      this.emitChange();
      return true;
    }
    return false;
  }

  withdraw(amount) {
    if (this.bank >= amount) {
      this.bank -= amount;
      this.cash += amount;
      this.emitChange();
      return true;
    }
    return false;
  }

  emitChange() {
    events.emit('ECONOMY_CHANGED', {
      cash: this.cash,
      bank: this.bank
    });
  }
}
