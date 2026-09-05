# Sabi Shop — Final Decision Register

| ID | Decision | Canonical outcome |
|---|---|---|
| D1 | Incentive | Configurable % above acceptable floor + minimum qualifying completed-sales gate |
| D2 | Correction window | Configurable; 15-minute default |
| D3 | Correction severity | Ordinary vs high-integrity |
| D4 | Manager self-correction | Type/severity-dependent; consequential actions flagged to Owner |
| D5 | Transfer confirmation | Staff may confirm after external verification; logged/reviewable |
| D6 | Payment methods | Cash, Transfer, POS/Card, Credit + configurable classified methods |
| D7 | Refund/settlement | Successful settlement states recorded; external money movement not executed by Sabi Shop |
| D8 | Supplier returns | Unpaid: payable reduction; paid: supplier credit/receivable; replacement separate |
| D9 | Tax/VAT | First-class V1 financial value |
| D10 | Business day | Operational session; may cross midnight |
| D11 | Cash custody | Shared drawer or individual salesperson mode |
| D12 | Historical specs | Old shop-app specs superseded |
| D13 | Gross profit | Net Recognized Selling Value − COGS |
| D14 | Inventory costing | Weighted-average |
| D15 | Negative stock | Permitted exception; visible/investigated |
| D16 | Staff cash | No routine Actual Cash dashboard truth; physical count at reconciliation |
| D17 | Management performance | Includes inventory remaining/stock health |


## Remaining User Decisions

One previously surfaced business-rule question remains without an explicit user decision in the reconciliation checkpoint: **minimum required customer profile information**. The corpus consistently supports Name + Phone as the minimum, while Address and Photo are treated as optional in downstream rules. This should be confirmed before implementation if customer-profile validation depends on it.

Design-level choices such as exact typeface, final visual tokens, responsive breakpoints, route naming, API contracts, and synchronization implementation remain delegated implementation decisions and do not block the business-rule baseline.
