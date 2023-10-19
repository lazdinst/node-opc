module.exports = function (opcua) {
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
      console.error(
        `Error in browsing and reading recursively: ${err.message}`
      );
      return [];
    }
  }

  return {
    browseNode,
    browseAndReadRecursively,
  };
};
