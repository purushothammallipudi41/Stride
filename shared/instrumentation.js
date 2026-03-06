const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Optional: Enable diagnostic logging for debugging OpenTelemetry
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
    instrumentations: [
        getNodeAutoInstrumentations({
            // We can disable specific instrumentations if they cause overhead
            '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
    ],
});

try {
    sdk.start();
    console.log('🔭 OpenTelemetry instrumentation started');
} catch (error) {
    console.error('❌ Error starting OpenTelemetry SDK', error);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('🔭 OpenTelemetry shut down successfully'))
        .catch((error) => console.log('❌ Error shutting down OpenTelemetry', error))
        .finally(() => process.exit(0));
});

module.exports = sdk;
