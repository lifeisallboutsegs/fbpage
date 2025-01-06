const { EventEmitter } = require('events');
const { logger } = require('./logger');

class Metrics extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      startTime: Date.now(),
      messageCount: 0,
      commandCount: {},
      latencies: {},
      errors: {
        count: 0,
        lastError: null
      },
      memory: {
        readings: [],
        lastReading: null
      },
      performance: {
        commandLatencies: new Map(),
        apiLatencies: new Map()
      }
    };

    // Start periodic memory monitoring
    this.startMemoryMonitoring();
  }

  startMemoryMonitoring(interval = 60000) {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.metrics.memory.readings.push({
        timestamp: Date.now(),
        ...memoryUsage
      });

      // Keep only last hour of readings
      if (this.metrics.memory.readings.length > 60) {
        this.metrics.memory.readings.shift();
      }

      this.metrics.memory.lastReading = memoryUsage;
      this.emit('memoryUpdate', memoryUsage);
    }, interval);
  }

  recordCommand(command, duration) {
    // Update command count
    this.metrics.commandCount[command] = (this.metrics.commandCount[command] || 0) + 1;

    // Update latencies
    if (!this.metrics.performance.commandLatencies.has(command)) {
      this.metrics.performance.commandLatencies.set(command, []);
    }
    this.metrics.performance.commandLatencies.get(command).push(duration);

    // Keep only last 100 latencies per command
    const latencies = this.metrics.performance.commandLatencies.get(command);
    if (latencies.length > 100) {
      latencies.shift();
    }

    this.emit('commandExecuted', { command, duration });
  }

  recordApiCall(endpoint, duration) {
    if (!this.metrics.performance.apiLatencies.has(endpoint)) {
      this.metrics.performance.apiLatencies.set(endpoint, []);
    }
    this.metrics.performance.apiLatencies.get(endpoint).push(duration);

    const latencies = this.metrics.performance.apiLatencies.get(endpoint);
    if (latencies.length > 100) {
      latencies.shift();
    }

    this.emit('apiCall', { endpoint, duration });
  }

  recordError(error) {
    this.metrics.errors.count++;
    this.metrics.errors.lastError = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
    };

    this.emit('error', error);
  }

  getStats() {
    const now = Date.now();
    return {
      uptime: now - this.metrics.startTime,
      messageCount: this.metrics.messageCount,
      commandStats: Object.entries(this.metrics.commandCount).map(([command, count]) => ({
        command,
        count,
        averageLatency: this.getAverageLatency(command)
      })),
      errors: {
        total: this.metrics.errors.count,
        lastError: this.metrics.errors.lastError
      },
      memory: {
        current: this.metrics.memory.lastReading,
        averageHeapUsed: this.getAverageMemoryUsage()
      },
      performance: {
        commandLatencies: Object.fromEntries(
          Array.from(this.metrics.performance.commandLatencies.entries())
            .map(([cmd, latencies]) => [
              cmd,
              {
                average: this.calculateAverage(latencies),
                min: Math.min(...latencies),
                max: Math.max(...latencies),
                p95: this.calculatePercentile(latencies, 95)
              }
            ])
        )
      }
    };
  }

  getAverageLatency(command) {
    const latencies = this.metrics.performance.commandLatencies.get(command);
    return latencies ? this.calculateAverage(latencies) : 0;
  }

  getAverageMemoryUsage() {
    const heapUsed = this.metrics.memory.readings.map(r => r.heapUsed);
    return this.calculateAverage(heapUsed);
  }

  calculateAverage(numbers) {
    return numbers.length ? 
      numbers.reduce((a, b) => a + b) / numbers.length : 
      0;
  }

  calculatePercentile(numbers, percentile) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  reset() {
    this.metrics = {
      startTime: Date.now(),
      messageCount: 0,
      commandCount: {},
      latencies: {},
      errors: {
        count: 0,
        lastError: null
      },
      memory: {
        readings: [],
        lastReading: null
      },
      performance: {
        commandLatencies: new Map(),
        apiLatencies: new Map()
      }
    };
    logger.info('Metrics reset');
  }
}

const metrics = new Metrics();
module.exports = { metrics };