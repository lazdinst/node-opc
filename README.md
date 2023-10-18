### Cert Creation

https://github.com/node-opcua/node-opcua-pki
https://github.com/node-opcua/node-opcua/issues/570
`npx node-opcua-pki createPKI`
`npx node-opcua-pki certificate --ip="0.0.0.0" -a 'urn:{localhost}:Node-OPCUA-Client' --selfSigned -o cert.pem`

12:12:40.772Z :verify :48 [NODE-OPCUA-W06] The certificate subjectAltName does not match the client applicationUri
... Please regenerate a specific certificate that matches your client applicationUri
... certificate subjectAltName = urn:{localhost}:Node-OPCUA-Client
... client applicationUri = urn:Taliss-MacBook-Pro.local:NodeOPCUAClient
... certificateFile = ./certificates/PKI/own/certs/cert.pem
