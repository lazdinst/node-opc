const opcua = require("node-opcua");

const endpointUrl = "opc.tcp://0.0.0.0:6969/opc";
const client = opcua.OPCUAClient.create({
  endpointMustExist: false,
});

client.on("backoff", (retry, delay) =>
  console.log(
    "still trying to connect to ",
    endpointUrl,
    ": retry =",
    retry,
    "next attempt in ",
    delay / 1000,
    "seconds"
  )
);

async function run() {
  try {
    // step 1 : connect to
    await client.connect(endpointUrl);
    console.log("connected!");

    // step 2 : createSession
    const session = await client.createSession();
    console.log("session created!");

    // step 3 : browse
    const browseResult = await session.browse("RootFolder");
    console.log("Browsing rootfolder: ");
    for (let reference of browseResult.references) {
      console.log(reference.browseName.toString(), reference.nodeId.toString());
    }

    // step 4 : read a variable with readVariableValue
    const dataValue1 = await session.readVariableValue("ns=1;s=free_memory");
    console.log("free mem % =", dataValue1.toString());

    // step 4' : read a variable with read
    const maxAge = 0;
    const nodeToRead = {
      nodeId: "ns=1;s=free_memory",
      attributeId: opcua.AttributeIds.Value,
    };
    const dataValue2 = await session.read(nodeToRead, maxAge);
    console.log("free mem % =", dataValue2.toString());

    // step 5: install a subscription and install a monitored item for 10 seconds
    const subscriptionOptions = {
      maxNotificationsPerPublish: 1000,
      publishingEnabled: true,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      requestedPublishingInterval: 1000,
    };
    const subscription = await session.createSubscription2(subscriptionOptions);

    console.log(
      "subscription started for 2 seconds - subscriptionId=",
      subscription.subscriptionId
    );

    subscription
      .on("keepalive", () => {
        console.log("subscription keepalive");
      })
      .on("terminated", () => {
        console.log("terminated");
      });

    // install monitored item
    const monitoredItem = subscription.monitor(
      {
        nodeId: opcua.resolveNodeId("ns=1;s=free_memory"),
        attributeId: opcua.AttributeIds.Value,
      },
      {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10,
      },
      opcua.TimestampsToReturn.Both
    );
    console.log("-------------------------------------");

    monitoredItem.on("changed", (dataValue) => {
      console.log(
        "monitored item changed:  % free mem =",
        dataValue.value.value
      );
    });

    // wait a little bit : 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    // terminate session
    await subscription.terminate();
    console.log("subscription terminated!");

    // close session
    await session.close();
    console.log("session closed!");

    console.log("done!");
  } catch (error) {
    console.log("failure", error);
  } finally {
    await client.disconnect();
  }
}

run();
