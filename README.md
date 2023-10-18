### Cert Creation

https://github.com/node-opcua/node-opcua-pki
https://github.com/node-opcua/node-opcua/issues/570
`npx node-opcua-pki createPKI`
`npx node-opcua-pki certificate --ip="0.0.0.0" -a 'urn:{localhost}:Node-OPCUA-Client' --selfSigned -o cert.pem`
