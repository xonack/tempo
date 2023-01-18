import {
    assert, 
    bsv, 
    ByteString, 
    FixedArray, 
    hash256,
    method, 
    prop, 
    PubKeyHash, 
    Ripemd160, 
    SmartContract,
    toByteString,
    utf8ToByteString
} from "scrypt-ts";
import { UTXO } from '../types'

export class Submit extends SmartContract {

    private balance: number

    @prop(true)
    hunters: FixedArray<PubKeyHash, 3>;

    @prop(true)
    submissions: FixedArray<ByteString, 3>;

    @prop(true)
    submissionCount: bigint;

    constructor(submissionCount: bigint) {
        super(...arguments);

        this.submissionCount = submissionCount;
        this.hunters = [Ripemd160(toByteString('00')), Ripemd160(toByteString('00')), Ripemd160(toByteString('00'))];
        this.submissions = [utf8ToByteString('0'), utf8ToByteString('0'), utf8ToByteString('0')];
    }

    @method()
    public submit(hunter:PubKeyHash, submissionContent: ByteString) {
        assert(this.submissionCount < 3);
        this.hunters[Number(this.submissionCount)] = hunter;
        this.submissions[Number(this.submissionCount)] = submissionContent;
        this.submissionCount++;
        assert(this.ctx.hashOutputs == hash256(this.buildStateOutput(this.ctx.utxo.value)));
    }

    getDeployTx(utxos: UTXO[], initBalance: number): bsv.Transaction {
        this.balance = initBalance
        const tx = new bsv.Transaction().from(utxos).addOutput(
            new bsv.Transaction.Output({
                script: this.lockingScript,
                satoshis: initBalance,
            })
        )
        this.lockTo = { tx, outputIndex: 0 }
        return tx
    }

    getSubmitTx(
        utxos: UTXO[],
        prevTx: bsv.Transaction,
        nextInst: Submit,
        hunter: PubKeyHash,
        submission: ByteString
    ): bsv.Transaction {
        const inputIndex = 1
        return new bsv.Transaction()
            .from(utxos)
            .addInputFromPrevTx(prevTx)
            .setOutput(0, (tx: bsv.Transaction) => {
                nextInst.lockTo = { tx, outputIndex: 0 }
                return new bsv.Transaction.Output({
                    script: nextInst.lockingScript,
                    satoshis: this.balance,
                })
            })
            .setInputScript(inputIndex, (tx: bsv.Transaction) => {
                this.unlockFrom = { tx, inputIndex }
                return this.getUnlockingScript((self) => {
                    self.submit(hunter, submission)
                })
            })
    }

}