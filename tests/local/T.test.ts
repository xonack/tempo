import {expect} from 'chai';
import {T} from '../../src/contracts/t';
import { dummyUTXO } from './util/txHelper'


describe('Test SmartContract `T`', () => {

    before(async () => {
        await T.compile(); // asm
    })

    it('should always pass', async () => {

        // expect(result.success).to.be.true
        const utxos = [dummyUTXO]
        // create a genesis instance
        let prevInstance = new T(0n).markAsGenesis()
        // construct a transaction for deployment
        let prevTx = prevInstance.getDeployTx(utxos, 1)

        // 1. build a new contract instance
        const newT = prevInstance.next()
        // 2. apply the updates on the new instance.
        newT.a = 2n;
        // 3. construct a transaction for contract call
        const callTx = prevInstance.getCallTx(utxos, prevTx, newT, 2n)
        // 4. run `verify` method on `prevInstance`
        const result = prevInstance.verify((self) => {
            self.unlock(2n)
        })

        expect(result.success, result.error).to.be.true

        // prepare for the next iteration
        prevTx = callTx
        prevInstance = newT

        // 1. build a new contract instance
        const newT2 = prevInstance.next()
        // 2. apply the updates on the new instance.
        newT2.a = 10n;
        newT2.b = false;
        // 3. construct a transaction for contract call
        const callTx2 = prevInstance.getCallTx(utxos, prevTx, newT2, 10n)
        // 4. run `verify` method on `prevInstance`
        const result2 = prevInstance.verify((self) => {
            self.unlock(10n)
        })

        expect(result2.success, result2.error).to.be.true

        expect(result2.success, result2.error).to.be.true

        // // 4 max submissions reached --> FAILS
        const newT4 = prevInstance.next()

        expect(() => {
            newT4.unlock(3n);
        }).to.throw(/Execution failed/)
    })
})