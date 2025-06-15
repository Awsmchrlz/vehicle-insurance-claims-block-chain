// server/fabric/fabricClient.ts

import { Gateway, Wallets } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { log } from '../vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function submitTransaction(fnName: string, args: string[]) {
  const ccpPath = path.resolve(__dirname, 'connection.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  const walletPath = path.resolve(__dirname, 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identityLabel = 'admin';
  const identity = await wallet.get(identityLabel);
  if (!identity) {
    throw new Error(`❌ Identity ${identityLabel} not found in wallet`);
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: identityLabel,
    discovery: { enabled: false, asLocalhost: true }
  });

  const network = await gateway.getNetwork('mychannel');
  const contract = network.getContract('insurance');

  log(`📤 Submitting Fabric TX: ${fnName} with args ${args}`);
  const result = await contract.submitTransaction(fnName, ...args);
  log(`✅ TX ${fnName} successful`);

  return result.toString();
}
export async function evaluateTransaction(functionName: string, ...args: string[]) {
  const walletPath = path.join(__dirname, 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const ccpPath = path.resolve(__dirname, 'connection.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
const identity = await wallet.get('admin');
console.log(wallet);
  const gateway = new Gateway();
  try {
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',

      discovery: { enabled: false, asLocalhost: true }
    });

    const network = await
    gateway.getNetwork('mychannel');
const contract = network.getContract('InsuranceContract');
await contract.addDiscoveryInterest({ name: 'insurance' });

const peers = network.getChannel().getEndorsers();
console.log("🔍 Peers seen by SDK:", peers.map(p => p.name));
    console.log(`⏳ Evaluating ${functionName}(${args.join(', ')})`);

    const result = await contract.evaluateTransaction(functionName, ...args);
    console.log('✅ Query Result:', result.toString());

    return result.toString();
  } catch (err) {
    console.error('❌ evaluateTransaction failed:', err);
    throw err;
  } finally {
    gateway.disconnect();
  }
}

