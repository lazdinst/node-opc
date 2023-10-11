const opcua = require("node-opcua");
const os = require("os");

// Create an instance of OPCUAServer
const server = new opcua.OPCUAServer({
  port: 6969,
  resourcePath: "/opc",
  buildInfo: {
    productName: "MySampleServer1",
    buildNumber: "7658",
    buildDate: new Date(2014, 5, 2),
  },
});

function post_initialize() {
  console.log("Server initialized");

  function construct_my_address_space(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    // Declare a new object "MyDevice"
    const device = namespace.addObject({
      organizedBy: addressSpace.rootFolder.objects,
      browseName: "MyDevice",
    });

    // Emulate MyVariable1 changing every 500 ms
    let variable1 = 1;
    setInterval(() => {
      variable1 += 1;
    }, 500);

    namespace.addVariable({
      componentOf: device,
      browseName: "MyVariable1",
      dataType: "Double",
      minimumSamplingInterval: 500, // Added this line
      minimumSamplingInterval: 500, // Added this line
      value: {
        get: function () {
          return new opcua.Variant({
            dataType: opcua.DataType.Double,
            value: variable1,
          });
        },
      },
    });

    // Add variable MyVariable2 with set functionality
    let variable2 = 10.0;
    namespace.addVariable({
      componentOf: device,
      nodeId: "ns=1;b=1020FFAA",
      browseName: "MyVariable2",
      dataType: "Double",
      minimumSamplingInterval: 500, // Added this line
      value: {
        get: function () {
          return new opcua.Variant({
            dataType: opcua.DataType.Double,
            value: variable2,
          });
        },
        set: function (variant) {
          variable2 = parseFloat(variant.value);
          return opcua.StatusCodes.Good;
        },
      },
    });

    // Add variable FreeMemory that provides memory info
    function available_memory() {
      return (os.freemem() / os.totalmem()) * 100.0;
    }
    namespace.addVariable({
      componentOf: device,
      nodeId: "s=free_memory",
      browseName: "FreeMemory",
      dataType: "Double",
      minimumSamplingInterval: 500, // Added this line
      value: {
        get: function () {
          return new opcua.Variant({
            dataType: opcua.DataType.Double,
            value: available_memory(),
          });
        },
      },
    });
  }

  // Construct address space and start the server
  construct_my_address_space(server);

  server.alternateHostname = "0.0.0.0";

  server.start(() => {
    console.log("Server is now listening... (press CTRL+C to stop)");
    console.log("port ", server.endpoints[0].port);
    const endpointUrl =
      server.endpoints[0].endpointDescriptions()[0].endpointUrl;
    console.log("the primary server endpoint URL is ", endpointUrl);
    console.log(server);
  });
}

// Initialize the server
server.initialize(post_initialize);
