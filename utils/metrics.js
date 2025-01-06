class Metrics {
  constructor() {
    this.startTime = Date.now();
    this.commandLatency = new Map();
    this.messageCount = 0;
  }
  incrementCount() {
    this.messageCount = this.messageCount + 1;
  }
  recordStartTime() {
    this.startTime = Date.now();
  }

  updateMetrics(command, latency) {
    if (!this.commandLatency.has(command)) {
      this.commandLatency.set(command, []);
    }
    this.commandLatency.get(command).push(latency);
  }

  getStats() {
    return {
      uptime: Date.now() - this.startTime,
      messageCount: this.messageCount,
      averageLatency: Object.fromEntries(
        Array.from(this.commandLatency.entries()).map(([cmd, latencies]) => [
          cmd,
          (latencies.reduce((a, b) => a + b) / latencies.length).toFixed(2),
        ])
      ),
    };
  }
}

const metrics = new Metrics();
module.exports = { metrics };
