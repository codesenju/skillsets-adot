/*tracing.js*/
const opentelemetry = require("@opentelemetry/sdk-node");
const {getNodeAutoInstrumentations,} = require("@opentelemetry/auto-instrumentations-node");
const {OTLPTraceExporter,} = require("@opentelemetry/exporter-trace-otlp-proto");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { ConsoleSpanExporter, BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
/*X-Ray*/
const process = require('process');
const { OTLPTraceExporterGRPC } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { AWSXRayPropagator } = require("@opentelemetry/propagator-aws-xray");
const { AWSXRayIdGenerator } = require("@opentelemetry/id-generator-aws-xray");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { AwsInstrumentation } = require("opentelemetry-instrumentation-aws-sdk");

// Optionally register instrumentation libraries
registerInstrumentations({
  instrumentations: [],
});

//const {
//  OTLPMetricExporter
//} = require("@opentelemetry/exporter-metrics-otlp-proto");

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
//diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new opentelemetry.NodeSDK({

  resource: new Resource({
    [ SemanticResourceAttributes.SERVICE_NAME ]: "skillsets-ui",
    [ SemanticResourceAttributes.SERVICE_NAMESPACE ]: "docker",
    [ SemanticResourceAttributes.SERVICE_VERSION ]: "1.0",
    [ SemanticResourceAttributes.SERVICE_INSTANCE_ID ]: "1234",
  }),

  traceExporter: new OTLPTraceExporter({
    // optional - default url is http://localhost:4318/v1/traces
    url: "http://otel-collector:4318/v1/traces",
    // optional - collection of custom headers to be sent with each request, empty by default
    headers: {},
  }),


  instrumentations: [getNodeAutoInstrumentations()],
});


sdk.start();
