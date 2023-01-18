import { Submit } from '../../src/contracts/Submit';
import { signAndSend } from './util/txHelper';
import { privateKey } from './util/privateKey';
import { getUtxoManager } from './util/utxoManager';
import { 
    ByteString, 
    FixedArray, 
    PubKeyHash, 
    Ripemd160, 
    toByteString, 
    utf8ToByteString
} from 'scrypt-ts';

async function main() {
    await Submit.compile();
    const utxoMgr = await getUtxoManager();

    // deployment
    const submit = new Submit(0n).markAsGenesis();
    let utxos = await utxoMgr.getUtxos();
    const unsignedDeployTx = submit.getDeployTx(utxos, 1);
    const deployTx = await signAndSend(unsignedDeployTx);
    console.log('Submit deploy tx:', deployTx.id);

    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx);

    // fee in satoshis for `callTx`, can be estimated in local tests by calling `tx.getEstimateFee()`.
    const fee = 230;
    let prevTx = deployTx;
    let prevInstance = submit

    // submission calls
    // 1.
    // 1. build a new contract instance
    const newSubmit1 = prevInstance.next()
    // 2. apply the updates on the new instance.
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'));
    const submission1: ByteString = utf8ToByteString('submission1');
    const hunters: FixedArray<PubKeyHash, 3> = [hunter1, Ripemd160(toByteString('00')), Ripemd160(toByteString('00'))];
    const submissions: FixedArray<ByteString, 3> = [submission1, utf8ToByteString('0'), utf8ToByteString('0')]
    newSubmit1.hunters = hunters;
    newSubmit1.submissions = submissions;
    newSubmit1.submissionCount = 1n;
    // 3. get the available utxos for the private key
    utxos = await utxoMgr.getUtxos(fee);
    // 4. construct a transaction for contract call
    const unsignedSubmitTx1 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit1, hunter1, submission1)
    // 5. sign and broadcast the transaction
    const submitTx1 = await signAndSend(unsignedSubmitTx1, privateKey, false)
    console.log('Submit call # ', newSubmit1.submissionCount, 'TX ID: ', submitTx1.id, ', \nhunters updated to: ', newSubmit1.hunters, '\nsubmissions updated to: ', newSubmit1.submissions);
    // prepare for the next call
    prevTx = submitTx1;
    prevInstance = newSubmit1;

    // 2.
    const newSubmit2 = prevInstance.next()
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'));
    const submission2: ByteString = utf8ToByteString('submission2');
    // set new submission
    hunters[1] = hunter2;
    submissions[1] = submission2;
    newSubmit2.hunters = hunters;
    newSubmit2.submissions = submissions;
    newSubmit2.submissionCount = 2n;
    // get utxos
    utxos = await utxoMgr.getUtxos(fee);
    // construct a transaction for contract call
    const unsignedSubmitTx2 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit2, hunter2, submission2)
    // sign and broadcast the transaction
    const submitTx2 = await signAndSend(unsignedSubmitTx2, privateKey, false)
    console.log('Submit call # ', newSubmit2.submissionCount, 'TX ID: ', submitTx2.id, ', \nhunters updated to: ', newSubmit2.hunters, '\nsubmissions updated to: ', newSubmit2.submissions);
    // prepare for the next call
    prevTx = submitTx2;
    prevInstance = newSubmit2;

    // 3.
    const newSubmit3 = prevInstance.next()
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'));
    const submission3: ByteString = utf8ToByteString('submission3');
    // set new submission
    hunters[2] = hunter3;
    submissions[2] = submission3;
    newSubmit3.hunters = hunters;
    newSubmit3.submissions = submissions;
    newSubmit3.submissionCount = 3n;
    // get utxos
    utxos = await utxoMgr.getUtxos(fee);
    // construct a transaction for contract call
    const unsignedSubmitTx3 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit3, hunter3, submission3)
    // sign and broadcast the transaction
    const submitTx3 = await signAndSend(unsignedSubmitTx3, privateKey, false)
    console.log('Submit call # ', newSubmit3.submissionCount, 'TX ID: ', submitTx3.id, ', \nhunters updated to: ', newSubmit3.hunters, '\nsubmissions updated to: ', newSubmit3.submissions);
    // prepare for the next call
    prevTx = submitTx3;
    prevInstance = newSubmit3;

    // 4. FAILS bc of MAX_SUBMISSIONS === 3
    console.log('FAIL HERE')
    const newSubmit4 = prevInstance.next()
    const hunter4 = hunter1;
    const submission4 = submission1;
    // get utxos
    utxos = await utxoMgr.getUtxos(fee);
    // construct a transaction for contract call
    console.log('creating unsigned tx')
    const unsignedSubmitTx4 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit4, hunter4, submission4)
    // sign and broadcast the transaction
    console.log('signing and sending')
    const submitTx4 = await signAndSend(unsignedSubmitTx4, privateKey, false)
    console.log('Submit call # ', newSubmit4.submissionCount, 'TX ID: ', submitTx4.id, ', \nhunters updated to: ', newSubmit4.hunters, '\nsubmissions updated to: ', newSubmit4.submissions);
}

describe('Test SmartContract `Submit` on testnet', () => {
    it('should success', async() => {
        await main();
    })
})