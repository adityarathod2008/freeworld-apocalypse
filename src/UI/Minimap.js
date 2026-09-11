/**
 * Game FreeWorld - Minimap
 * Circular radar minimap rendering roads, player heading, police search zones, and GPS waypoints
 */
export class Minimap {
  constructor(canvasId = 'minimap-canvas', navGraph) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.navGraph = navGraph;
    this.zoom = 1.1; // Scale meters to pixels
  }

  render(playerPos, playerYaw, policeUnits, trafficCars, waypoint, wantedLevel) {
    if (!this.ctx || !playerPos) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Clip to circle
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    // Rotate map with player heading
    ctx.translate(cx, cy);
    ctx.rotate(playerYaw);

    // 1. Draw Road Network
    if (this.navGraph && this.navGraph.roadNodes) {
      ctx.strokeStyle = '#222d3d';
      ctx.lineWidth = 9 * this.zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const node of this.navGraph.roadNodes) {
        for (const conn of node.connections) {
          const x1 = (node.position.x - playerPos.x) * this.zoom;
          const y1 = (node.position.z - playerPos.z) * this.zoom;
          const x2 = (conn.position.x - playerPos.x) * this.zoom;
          const y2 = (conn.position.z - playerPos.z) * this.zoom;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // 2. Draw GPS Waypoint Line & Beacon
    if (waypoint) {
      const wx = (waypoint.x - playerPos.x) * this.zoom;
      const wy = (waypoint.z - playerPos.z) * this.zoom;

      // Waypoint dotted route line
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wx, wy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint Icon
      ctx.fillStyle = '#ffb700';
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Traffic Cars
    if (trafficCars) {
      ctx.fillStyle = '#94a3b8';
      for (const car of trafficCars) {
        const tx = (car.position.x - playerPos.x) * this.zoom;
        const ty = (car.position.z - playerPos.z) * this.zoom;
        if (Math.hypot(tx, ty) < cx) {
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. Draw Police Units & Flashing Radius
    if (policeUnits && policeUnits.length > 0) {
      const flash = Math.sin(Date.now() * 0.01) > 0;
      ctx.fillStyle = flash ? '#ff2222' : '#0088ff';

      for (const cop of policeUnits) {
        const px = (cop.position.x - playerPos.x) * this.zoom;
        const py = (cop.position.z - playerPos.z) * this.zoom;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // 5. Draw Player Blip (Center, pointing straight up)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
