# Final V2 economic lifecycle

Network: Studionet 61999  
MARGIN: `0x4E0a75B63D913FC2d39A75F61905CA5973c77491`  
Consumer: `0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F`  
Claim: `006e13f4fee1713961c4a45148e7e196fb5e35204c9ab97c5831da2fe7c87880`  
Page: https://a-murex-one.vercel.app/v2-contradicted-strong.html

This is a fresh final-deployment run. Every write below finalized as
`FINALIZED / MAJORITY_AGREE / SUCCESS`.

| Step | Transaction |
| --- | --- |
| Submit | `0xd5ea31415a05ddef336b1b6bb8607539f79926becab98245a0e9977fc20adc06` |
| Normal resolve | `0xeeece74db4c82f21351f252bc4f69342045dc4991fadee35e3550bd3f1bb056f` |
| Register Covered | `0x8df2cfda100f2ada0a2945358b3837eceec7835939e6d9c454b7dec18596a61d` |
| Create protected release before settlement | `0x898587d82463671404ca48e544de29b5c5ce6f10b7555646fb21db3b75b5ce07` |
| Challenge | `0x4649e2587d3c51f31d8eee7dcf4dd2b4b3efc6067a9efc0468424b1842fd7a60` |
| Covered resolve | `0xfc5a979290579177341e5645228891ed6aa05527596d2b7a79e030d6fa1177a5` |
| Settle after appeal deadline | `0xecd78cb02684a3ae2cff8145ae588dd579bbc82f50d38afeacdee8ad03fb82d2` |
| Refund release | `0x95b9f5d763e98e942c14a03ec2eb3e780b95a7c9af67d43f769de77c08a642e0` |
| Withdraw release credit | `0x70033ff56ac3914841f286d923ec84073d1631c3360e0866ff61c9874fbf87ee` |
| Withdraw challenger credit | `0xe88947412cb05f2ad8af0c7bdef8739ebad9eedf0d8c1e8a0d15f3de6934b8dc` |

Canonical final readback: `SETTLED`, `final_status=CONTRADICTED`, release
`REFUNDED`, `active_exposure=0`, publisher/challenger/creator credits all `0`
after withdrawal. The complete machine-readable checkpoint is
[`final-v2-economic-contradicted.json`](final-v2-economic-contradicted.json).
