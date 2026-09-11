/**
 * Game FreeWorld - EconomyManager
 * Dual-currency economy (Cash in wallet & Fleeca Bank account) with ATM banking and transactions
 */
import { events } from '../Core/EventBus.js';

export class EconomyManager {
  constructor(initialCash = 15400, initialBank = 45000) {
    this.cash = initialCash;
    this.bank = initialBank;

    this.setupListeners();
  }

  setupListeners() {
    events.on('DEBUG_ADD_CASH', (amount) => {
      this.addCash(amount || 10000);
    });

    events.on('MISSION_REWARD', ({ cash, bank }) => {
      if (cash) this.addCash(cash);
      if (bank) this.addBank(bank);
    });
  }

  addCash(amount) {
    this.cash += amount;
    this.emitChange();
    events.emit('HUD_NOTIFICATION', {
      title: 'CASH RECEIVED',
      message: `+ $${amount.toLocaleString()}`
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
      message: 'Not enough cash in wallet!'
    });
    return false;
  }

  addBank(amount) {
    this.bank += amount;
    this.emitChange();
  }

  depositToBank(amount) {
    if (this.cash >= amount) {
      this.cash -= amount;
      this.bank += amount;
      this.emitChange();
      events.emit('HUD_NOTIFICATION', {
        title: 'FLEECA ATM DEPOSIT',
        message: `Deposited $${amount.toLocaleString()}`
      });
      return true;
    }
    return false;
  }

  withdrawFromBank(amount) {
    if (this.bank >= amount) {
      this.bank -= amount;
      this.cash += amount;
      this.emitChange();
      events.emit('HUD_NOTIFICATION', {
        title: 'FLEECA ATM WITHDRAWAL',
        message: `Withdrew $${amount.toLocaleString()}`
      });
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
