# V2 strong contradiction lifecycle

- Claim: `006e13f4fee1713961c4a45148e7e196fb5e35204c9ab97c5831da2fe7c87880`
- Final state: `SETTLED`, `CONTRADICTED`
- Release: `7:006e13f4fee1713961c4a45148e7e196fb5e35204c9ab97c5831da2fe7c87880`, refunded and withdrawn
- Final credits: publisher `0`, challenger `0`, creator `0`
- Evidence source: `V2-contradicted-strong.json`

The first attempted submit `0x486b2962b297bb8b6a5ed8925e2508fc6e117bc41af7095fc79b969a23cff4ec` finalized with execution `ERROR` (`claim key does not match claim payload`) and rolled back; it is explicitly not successful evidence. The corrected lifecycle writes were `FINALIZED / MAJORITY_AGREE / SUCCESS`:

`0x88b6893682d93b5fdf21091d05574971e909e341423e0f0b664a2e4f24db3471` submit; `0xfba904da4b47945ccc3efa9c0895653e16e05e7423b4cfc610599a80f07b3ec1` normal resolve; `0x504ce3132b5f6c596edfcdaaa727443cdf59557447d379f6b1356aa6fa3f6553` register; `0x8246b93f788ed4c3be72fd7e435204a443d19ed2caa488044d66b0000ccfcad5` release; `0x7aa33a0891bbe171ea6db1bb80104a39a3722cb1f38c89a0496e0346ce3b4ac7` challenge; `0x4091bbdbf9efe82b3bfe9f6a6d3503c4458eac929533b6b843572f98d36d9c0b` assured resolve; `0xbbfb8351d44f6f7f9927ec5c4a4ad81a48daa6c8dda5dff3e3ab39c4ed1547a0` settle; `0x476d92acfdfed73b2c006f4548b7e1f39261e6206c1f6036c87a46aadc5f7386` refund; `0x4af9b24a9d639a4e355be9b8ec9f6f41e274c1a6ae379e43e7ebc5ebd0e87b86` release withdrawal; `0x8cc02755721fe67bc78aa17a8800b60d256f621897dca3878bc412202225195a` challenger withdrawal.
