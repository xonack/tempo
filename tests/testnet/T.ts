import { T} from '../../src/contracts/T';
import { signAndSend } from './util/txHelper';
import { privateKey } from './util/privateKey';
import { getUtxoManager } from './util/utxoManager';

async function main() {
    await T.compile();
    const utxoMgr = await getUtxoManager();

    // deployment
    // 1. create genesis instance
    const t = new T(0n).markAsGenesis();
    // 2. get available utxos for the private key
    const utxos = await utxoMgr.getUtxos()
    // 3. construct a transaction fo deployment
    const unsignedDeployTx = t.getDeployTx(utxos, 1);
    // 4. sign and broadcast the transaction
    const deployTx = await signAndSend(unsignedDeployTx);
    console.log('T deploy tx:', deployTx.id);

    //???
    // collect the new p2pkh utxo if it exists in `deploy TX`
    utxoMgr.collectUtxoFrom(deployTx);

    //???
    // fee in satoshi for `callTx` - can be estimated with `tx.getEstimateFee()`
    const fee = 230;
    let prevTx = deployTx;
    let prevInstance = t;

    // CALL CONTRACT
    // 1
    // 1. build a new contract instance
    const newT1 = prevInstance.next();
    // 2. apply the updates on the new instance
    newT1.a = 2n;
    // 3. get the available utxos for the private key
    const utxos1 = await utxoMgr.getUtxos(fee);
    // 4. construct a transaction for contract call
    const unsignedCallTx1 = prevInstance.getCallTx(utxos1, prevTx, newT1, 2n);
    // 5. sign and broadcast
    const callTx1 = await signAndSend(unsignedCallTx1, privateKey, false); 
    // prepare for next call
    prevTx = callTx1;
    prevInstance = newT1;

    // 2 - cross threshold
    const newT2 = prevInstance.next();
    newT2.a = 10n;
    newT2.b = false;
    const utxos2 = await utxoMgr.getUtxos(fee);
    const unsignedCallTx2 = prevInstance.getCallTx(utxos2, prevTx, newT2, 10n)
    const callTx2 = await signAndSend(unsignedCallTx2, privateKey, false); 
    // prepare for next call
    prevTx = callTx1;
    prevInstance = newT1;

    // 3 - fails bc open = false
    // const newT3 = prevInstance.next();
    // newT2.a = 5n;
    // const utxos3 = await utxoMgr.getUtxos(fee);
    // const unsignedCallTx3 = prevInstance.getCallTx(utxos3, prevTx, newT3, 5n)
    // const callTx3 = await signAndSend(unsignedCallTx3, privateKey, false); 
}  

describe('Test SmartContract `T` on testnet', () => {
    it('should success', async () => {
      await main();
    })
  })