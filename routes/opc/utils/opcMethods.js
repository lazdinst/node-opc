const opcua = require("node-opcua");

async function simpleBrowse(session, nodeId) {
  const browseResult = await session.browse(nodeId);
  let nodes = [];

  for (const reference of browseResult.references) {
    nodes.push({
      nodeId: reference.nodeId.toString(),
      browseName: reference.browseName.toString(),
      nodeClass: opcua.NodeClass[reference.nodeClass],
      typeDefinition: reference.typeDefinition
        ? reference.typeDefinition.toString()
        : null,
    });
  }

  return nodes;
}

async function browseNode(session, nodeId) {
  const browseResult = await session.browse(nodeId);
  let nodes = [];

  for (const reference of browseResult.references) {
    nodes.push({
      nodeId: reference.nodeId.toString(),
      browseName: reference.browseName.toString(),
      nodeClass: opcua.NodeClass[reference.nodeClass],
      typeDefinition: reference.typeDefinition
        ? reference.typeDefinition.toString()
        : null,
    });

    // Recursively browse child nodes
    const childNodes = await browseNode(session, reference.nodeId);
    nodes = nodes.concat(childNodes);
  }

  return nodes;
}

async function browseAndReadRecursively(session, nodeId) {
  try {
    const browseResult = await session.browse(nodeId);

    if (!browseResult || !browseResult.references) {
      return [];
    }

    const results = [];
    for (const reference of browseResult.references) {
      const node = {
        nodeId: reference.nodeId.toString(),
        browseName: reference.browseName.toString(),
        nodeClass: opcua.NodeClass[reference.nodeClass],
        typeDefinition: reference.typeDefinition
          ? reference.typeDefinition.toString()
          : null,
      };

      if (reference.nodeClass === opcua.NodeClass.Variable) {
        try {
          const dataValue = await session.read({
            nodeId: reference.nodeId,
            attributeId: opcua.AttributeIds.Value,
          });
          node.value = dataValue.value ? dataValue.value.value : null;
        } catch (err) {
          node.value = `Error reading value: ${err.message}`;
        }
      }

      const childNodes = await browseAndReadRecursively(
        session,
        reference.nodeId
      );
      results.push(node, ...childNodes);
    }

    return results;
  } catch (err) {
    console.error(`Error in browsing and reading recursively: ${err.message}`);
    return [];
  }
}

async function createSubscription(session) {
  const subscription = await session.createSubscription2({
    requestedPublishingInterval: 1000,
    requestedMaxKeepAliveCount: 20,
    requestedLifetimeCount: 6000,
    maxNotificationsPerPublish: 1000,
    publishingEnabled: true,
    priority: 10,
  });
  return subscription;
}

async function monitorNode({ session, nodeId, onChange }) {
  const nodesToMonitor = await browseNode(session, nodeId);
  console.log("Collected Nodes: ", nodesToMonitor);

  const subscription = await createSubscription(session);
  const monitoredItems = [];

  for (const node of nodesToMonitor) {
    console.log(`Monitoring Node: ${node.nodeId}`);
    const monitoredItem = await subscription.monitor(
      {
        nodeId: opcua.resolveNodeId(node.nodeId),
        attributeId: opcua.AttributeIds.Value,
      },
      {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10,
      },
      opcua.TimestampsToReturn.Both
    );

    monitoredItem.on("changed", async (dataValue) => {
      await onChange({ nodeId: node.nodeId, data: dataValue.value.value });
      console.log(`Node ${node.nodeId}:`);
      console.log(JSON.stringify(dataValue.value.value, 0, 2));
    });

    monitoredItems.push(monitoredItem);
  }

  return {
    session,
    subscription,
    monitoredItems, // Array of monitored items
  };
}

const stopMonitoring = async ({ session, subscription, monitoredItems }) => {
  for (const item of monitoredItems) {
    console.info(`Terminating Monitored`);
    await item.terminate();
  }

  // Delete the subscription
  console.info(`Terminating Subscription`);
  await subscription.terminate();
};

module.exports = {
  browseNode,
  browseAndReadRecursively,
  monitorNode,
  stopMonitoring,
  simpleBrowse,
};
