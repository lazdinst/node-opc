## Installation

`npm install`
`npm run start:server`

## OPC PLC Simulator

https://learn.microsoft.com/en-us/samples/azure-samples/iot-edge-opc-plc/azure-iot-sample-opc-ua-server/

## Certificate Generation

Related Issues:
https://github.com/node-opcua/node-opcua-pki
https://github.com/node-opcua/node-opcua/issues/570

Commands:
`npx node-opcua-pki createPKI`
`npx node-opcua-pki certificate --ip="0.0.0.0" -a 'urn:Taliss-MacBook-Pro.local:node-opc-client' --selfSigned -o cert.pem`
