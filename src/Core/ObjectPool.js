/**
 * Game FreeWorld - ObjectPool
 * High-performance pooling system for bullets, particles, decals, and audio voices
 */
export class ObjectPool {
  constructor(factory, initialSize = 20, maxCapacity = 200) {
    this.factory = factory;
    this.maxCapacity = maxCapacity;
    this.pool = [];
    this.active = new Set();

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire() {
    let item;
    if (this.pool.length > 0) {
      item = this.pool.pop();
    } else if (this.active.size < this.maxCapacity) {
      item = this.factory();
    } else {
      // Force recycle oldest item if max capacity exceeded
      const oldest = this.active.values().next().value;
      this.release(oldest);
      item = this.pool.pop();
    }

    this.active.add(item);
    return item;
  }

  release(item) {
    if (this.active.has(item)) {
      this.active.delete(item);
      if (item.onRecycle) {
        item.onRecycle();
      }
      this.pool.push(item);
    }
  }

  getActiveCount() {
    return this.active.size;
  }

  clear() {
    this.pool.length = 0;
    this.active.clear();
  }
}
