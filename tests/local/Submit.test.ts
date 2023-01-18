import { expect } from 'chai';
import { Submit } from '../../src/contracts/submit';
import { dummyUTXO } from './util/txHelper'
import { 
    ByteString, 
    FixedArray, 
    PubKeyHash, 
    Ripemd160, 
    toByteString, 
    utf8ToByteString
} from 'scrypt-ts';

describe('Test SmartContract `Submit`', () => {

    before(async () => {
        await Submit.compile(); // asm
    })

    it('should always pass', async () => {

        // expect(result.success).to.be.true
        const utxos = [dummyUTXO]
        // create a genesis instance
        let prevInstance = new Submit(0n).markAsGenesis()
        // construct a transaction for deployment
        let prevTx = prevInstance.getDeployTx(utxos, 1)

        // 1
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
        // 3. construct a transaction for contract call
        const callTx1 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit1, hunter1, submission1)
        // 4. run `verify` method on `prevInstance`
        const result1 = prevInstance.verify((self) => {
            self.submit(hunter1, submission1)
        })

        expect(result1.success, result1.error).to.be.true

        // prepare for the next iteration
        prevTx = callTx1
        prevInstance = newSubmit1

        // // 2
        const newSubmit2 = prevInstance.next()
        const hunter2: Ripemd160 = Ripemd160(toByteString('02'));
        const submission2: ByteString = utf8ToByteString('submission2');
        // set new submission
        hunters[1] = hunter2;
        submissions[1] = submission2;
        newSubmit2.hunters = hunters;
        newSubmit2.submissions = submissions;
        newSubmit2.submissionCount = 2n;

        const callTx2 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit2, hunter2, submission2)

        const result2 = prevInstance.verify((self) => {
            self.submit(hunter2, submission2)
        })
    
        expect(result2.success, result2.error).to.be.true
    
        // // prepare for the next iteration
        prevTx = callTx2
        prevInstance = newSubmit2

        // // 3
        const newSubmit3 = prevInstance.next()
        const hunter3: Ripemd160 = Ripemd160(toByteString('03'));
        const submission3: ByteString = utf8ToByteString('submission3');
        // set new submission
        hunters[2] = hunter3;
        submissions[2] = submission3;
        newSubmit3.hunters = hunters;
        newSubmit3.submissions = submissions;
        newSubmit3.submissionCount = 3n;

        const callTx3 = prevInstance.getSubmitTx(utxos, prevTx, newSubmit3, hunter3, submission3)

        const result3 = prevInstance.verify((self) => {
            self.submit(hunter3, submission3)
        })
    
        expect(result3.success, result3.error).to.be.true
    
        // prepare for the next iteration
        prevTx = callTx3
        prevInstance = newSubmit3
        
        // // 4 max submissions reached --> FAILS
        const newSubmit4 = prevInstance.next()
        const hunter4 = hunter1;
        const submission4 = submission1;

        expect(() => {
            newSubmit4.submit(hunter4, submission4);
        }).to.throw(/Execution failed/)
    })
})
