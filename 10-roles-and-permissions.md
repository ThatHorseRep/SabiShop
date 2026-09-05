# B09 --- Roles & Permissions

**Product:** Sabi Shop\
**Package:** B --- Business Operations Specification\
**Status:** FINAL — RECONCILED V1
**Authority:** B09 defines the role/permission model and authority
boundaries. Domain deliverables remain authoritative for the underlying
business rules.

------------------------------------------------------------------------

## 1. Purpose

B09 defines who may perform which actions in Sabi Shop and under what
conditions.

The model is based on:

-   least privilege;
-   role-based access control;
-   separation of duties;
-   explicit approval;
-   management escalation;
-   business-level accountability;
-   preservation of audit history.

Sabi Shop already establishes a **Role → Permission → User** model. A
user may belong to multiple businesses, each business has its own users
and records, and a user may possess both Owner and Manager capabilities
where appropriate. fileciteturn22file7L1047-L1059
fileciteturn22file7L1077-L1138

B09 turns that principle into a practical authorization system.

------------------------------------------------------------------------

# 2. Authorization Philosophy

## 2.1 The system should be simple for staff and strict underneath

A salesperson should not need to understand the permission system while
making a normal sale.

The system should make normal work fast while automatically preventing
or escalating actions that could materially affect:

-   money;
-   inventory;
-   debt;
-   purchasing;
-   pricing;
-   incentives;
-   customer identity;
-   historical records;
-   reconciliation;
-   audit integrity.

## 2.2 Permission is not ownership

Having access to a screen does not automatically mean a user may perform
every action on that screen.

For example:

> A salesperson may open a sale screen, but that does not give them
> permission to authorize their own credit exception or material
> correction.

## 2.3 Permission is contextual

A permission may depend on:

-   role;
-   business;
-   transaction state;
-   transaction ownership;
-   correction severity;
-   whether the business day is closed;
-   whether reconciliation has occurred;
-   whether management approval is required;
-   whether the user is attempting to approve their own action;
-   whether the device is offline;
-   whether an integrity conflict exists.

------------------------------------------------------------------------

# 3. Core Roles

Sabi Shop V1 uses three primary business roles.

## 3.1 Owner

The Owner has ultimate business authority.

The Owner can perform or authorize management-level actions, subject to
the non-negotiable requirement that history and audit trails are
preserved.

Typical responsibilities include:

-   business configuration;
-   user and role administration;
-   pricing policy;
-   supplier relationship;
-   customer credit oversight;
-   cash oversight;
-   inventory oversight;
-   sensitive approvals;
-   major corrections;
-   reconciliation escalation;
-   integrity escalation;
-   business reporting.

## 3.2 Manager

The Manager is the primary operational management role.

A business may have:

-   no dedicated Manager;
-   one Manager;
-   multiple Managers.

Manager capabilities are assigned through permissions rather than
assuming every Manager has unlimited authority.

Managers generally supervise daily operations, approvals,
reconciliation, inventory, purchasing records, customer credit, returns,
and operational exceptions.

## 3.3 Staff / Salesperson

Staff/Salesperson is the normal execution role.

Staff should be able to:

-   search products;
-   see current selling prices;
-   see available stock;
-   record sales;
-   record successful money received;
-   perform permitted repayment collection;
-   perform permitted operational actions;
-   end their shift;
-   review their own relevant transactions.

Staff should not automatically see sensitive business information such
as acquisition cost, gross margin, or unrestricted price overrides.
fileciteturn22file7L1112-L1128

------------------------------------------------------------------------

# 4. Owner + Manager Capability

A single user may possess both Owner and Manager capabilities.

This is important for a small business where the Owner also manages
daily operations.

The system should therefore avoid creating a special permanent
"Owner-Manager" role. Instead:

> **Owner and Manager are capabilities/roles that may coexist on the
> same user.**

The effective permissions are the union of permitted capabilities,
subject to all self-approval, integrity, and separation-of-duty
constraints.

------------------------------------------------------------------------

# 5. Role Hierarchy

Recommended authority hierarchy:

**Owner** ↓\
**Manager** ↓\
**Staff / Salesperson**

This is a hierarchy of authority, not a license to bypass audit
controls.

Higher authority may approve or resolve actions that lower roles cannot,
but no role can use its authority to erase historical evidence.

------------------------------------------------------------------------

# 6. Permission Categories

B09 groups permissions into:

1.  Authentication & account
2.  Business membership
3.  Sales
4.  Customers
5.  Credit & debt
6.  Payments
7.  Pricing & discounts
8.  Inventory
9.  Suppliers & purchasing
10. Returns & refunds
11. Cash & reconciliation
12. Incentives
13. Corrections & exceptions
14. Reports
15. Staff management
16. Audit & integrity
17. Offline operation
18. Business configuration

------------------------------------------------------------------------

# 7. Permission Matrix

Legend:

-   **A** = Allowed
-   **L** = Allowed with configured limits/conditions
-   **R** = Request only; management approval required
-   **M** = Manager authorization required
-   **O** = Owner authorization required
-   **D** = Depends on domain/configuration
-   **---** = Not permitted

  Permission / Action                      Owner   Manager                              Staff
  -------------------------------------- ------- --------- ----------------------------------
  Sign in                                      A         A                                  A
  Work in assigned business                    A         A                                  A
  Switch between authorized businesses         A         A                                  A
  View normal sales workflow                   A         A                                  A
  Create sale                                  A         A                                  A
  Complete normal sale                         A         A                                  A
  Record successful payment                    A         A                                  A
  View own sales                               A         A                                  A
  View other staff sales                       A         A                                ---
  View business-wide sales                     A         A                                ---
  View current selling price                   A         A                                  A
  View acquisition cost                        A         A                                ---
  View gross profit/margin                     A         A                                ---
  Apply normal configured discount             A         A                                  L
  Override normal pricing                      A       A/L                                ---
  Sell below floor                             A       M/D                                ---
  Complete ₦0/free sale                        O       M/O                                ---
  Request credit sale                          A         A                                  R
  Approve credit sale                          A         A                                ---
  Approve over-limit credit                    A         M                                ---
  Restrict/block customer credit               A         A                                ---
  Record customer repayment                    A         A                                  L
  Allocate repayment across debts              A         M                                ---
  Write off customer debt                    O/M         M                                ---
  View customer debt history                   A         A                                  D
  Record supplier purchase/receipt             A         A                                ---
  Create supplier relationship                 A         A                                ---
  Authorize purchasing                         A         A                                ---
  Record supplier payment                      A         A                                ---
  Adjust supplier liability                  O/M         M                                ---
  Add stock through approved receipt           A         A                                ---
  Manually adjust inventory                  O/M         M                                ---
  Resolve inventory discrepancy                A         A                                ---
  Resolve negative-stock exception             A         A                                ---
  Create/edit product master data              A         A                                ---
  Change price/floor configuration             A       A/D                                ---
  Process approved return                      A         A                                  D
  Approve return                               A         A                                ---
  Approve exceptional return                   A         A                                ---
  Record successful refund/settlement          A         A                              ---/D
  Approve refund exception                   O/M         M                                ---
  Open business day/shift                      A         A                                  A
  End own shift                                A         A                                  A
  Review own cash                              A         A                                  A
  Perform cash reconciliation                  A         A                                  D
  Resolve cash discrepancy                     A         A                                ---
  Record Owner withdrawal                      O     ---/D                                ---
  Record business expense                      A       A/D                                  D
  Close business day                         O/M         M                                ---
  Reopen closed business day                   O       M/O                                ---
  View incentive result                        A         A                                  D
  Manage incentive policy                      O       M/D                                ---
  Correct own completed sale                   D         D   --- where authorization required
  Correct another user's sale                  A         M                                ---
  Material payment correction                O/M         M                                ---
  Correction after window                      A         M                                  R
  Correction involving closed day              O         M                                  R
  Correct customer identity                    A       M/O                                ---
  Correct SKU on completed sale                A         M                                ---
  Correct salesperson attribution              A         M                                ---
  Approve own material correction          ---\*     ---\*                                ---
  View audit trail                             A         A                        ---/limited
  View integrity alerts                        A         A                                ---
  Resolve integrity escalation                 O         M                                ---
  Override integrity block                     O       M/D                                ---
  Manage users                                 A       A/D                                ---
  Create staff account                         A       A/D                                ---
  Change staff permissions                     A         D                                ---
  Change Owner permissions                     O       ---                                ---
  Configure business-wide controls             A         D                                ---

**\* Self-approval is prohibited for material actions where separation
of duties applies.**

The matrix is a recommended baseline. Exact domain-specific permission
details remain subject to the authoritative business rules and the final
Roles & Permissions implementation.

------------------------------------------------------------------------

# 8. Sales Permissions

## 8.1 Normal sale

All three roles may perform a normal sale.

A normal sale must still satisfy the existing transaction rules:

-   actual products;
-   actual quantities;
-   actual prices;
-   confirmed payment or approved credit;
-   required authorization;
-   completion state.

## 8.2 Salesperson accountability

A sale is recorded under the user who actually conducted it.

This means salesperson attribution is not intended to be casually edited
after completion.

The system should make the active user clear before completion.

## 8.3 Staff should not need management permission for ordinary sales

The goal is not to make every sale require approval.

Management approval should be reserved for exceptions and sensitive
actions.

------------------------------------------------------------------------

# 9. Credit & Debt Permissions

Customer credit requires Owner/Manager authorization. Credit eligibility
does not automatically authorize every credit sale. Credit limits are
management controls, and exceeding a limit requires an authorized
exception. fileciteturn22file6L902-L922

Recommended model:

### Staff

-   may request/record a credit sale where the workflow permits;
-   may not independently authorize a required credit exception;
-   may collect successful repayments where permitted;
-   may not write off debt.

### Manager

-   may approve ordinary credit;
-   may manage customer credit status;
-   may approve credit-limit exceptions;
-   may manage repayment allocation;
-   may authorize debt adjustments within assigned authority.

### Owner

-   has ultimate credit authority;
-   may approve escalated exceptions;
-   may authorize write-offs and major debt corrections.

Debt history must remain explainable from underlying events, and cleared
debt is never deleted. fileciteturn22file0L94-L124

------------------------------------------------------------------------

# 10. Payment Permissions

Only successful/confirmed payments are treated as successful payment
records.

Unconfirmed payment claims do not become successful payments.
fileciteturn22file6L974-L982

### Staff

May record successful payments in normal workflows.

May not independently alter completed payment amounts where
authorization is required.

### Manager

May authorize material payment corrections and reconciliation actions.

### Owner

May authorize escalated payment corrections and major financial
exceptions.

No payment permission permits destruction of payment history.

------------------------------------------------------------------------

# 11. Pricing & Discount Permissions

### Staff

Staff may:

-   see current selling price;
-   sell at configured prices;
-   apply permitted normal discounts within configured limits.

Staff may not have unrestricted price override authority.

### Manager

Manager may:

-   configure prices where assigned;
-   approve exceptions;
-   authorize below-floor sales according to the configured policy;
-   review pricing exceptions.

### Owner

Owner has ultimate pricing-policy authority and may configure the
business's exception model.

The existing pricing rule remains authoritative: a sale at floor is
allowed; below-floor sales use the configured block-or-authorize/flag
model.

------------------------------------------------------------------------

# 12. Inventory Permissions

Inventory is management-controlled.

### Staff

Staff should not:

-   manually increase stock;
-   manually reduce stock;
-   resolve discrepancies;
-   rewrite stock history.

### Manager

Manager may:

-   record authorized receipts;
-   manage inventory corrections;
-   investigate discrepancies;
-   resolve operational stock exceptions.

### Owner

Owner has ultimate inventory authority and may resolve escalated
discrepancies.

Physical counts do not overwrite the inventory ledger. A discrepancy is
investigated before a corrective inventory event is recorded.
fileciteturn22file9L1376-L1417

------------------------------------------------------------------------

# 13. Suppliers & Purchasing

Supplier relationships and purchasing belong to management.

Staff may assist operationally but must not independently create or
authorize purchases as though they own the supplier relationship.
fileciteturn22file4L736-L749

### Staff

-   may assist with receiving/inspection;
-   may communicate supplier information;
-   may not independently authorize purchasing.

### Manager

-   manages supplier records;
-   records received inventory;
-   records purchase information;
-   manages supplier payments;
-   manages supplier returns and adjustments within authority.

### Owner

-   has ultimate supplier/purchasing authority;
-   may authorize major supplier adjustments;
-   oversees supplier liabilities.

------------------------------------------------------------------------

# 14. Returns & Refunds

### Staff

May initiate or assist with a return request where configured, but may
not independently approve a required return.

### Manager

May approve normal returns and associated settlement actions within
authority.

### Owner

May approve escalated or exceptional returns/refunds.

The original sale remains intact. A return is a separate linked event.

Refund recording must represent a successful settlement/payment event,
not an unsuccessful attempt.

------------------------------------------------------------------------

# 15. Cash & Reconciliation

### Staff

May:

-   handle permitted cash;
-   record permitted cash movement;
-   end their shift;
-   count their cash;
-   review expected versus counted cash;
-   provide explanations for discrepancies.

### Manager

May:

-   review staff reconciliation;
-   investigate discrepancies;
-   approve corrective cash actions;
-   manage business-day closure;
-   perform management reconciliation.

### Owner

May:

-   review all cash activity;
-   resolve escalated discrepancies;
-   authorize major cash corrections;
-   reopen/resolve closed-day issues where permitted;
-   record or authorize Owner withdrawals.

A discrepancy is an investigation signal, not an automatic accusation.

------------------------------------------------------------------------

# 16. Incentive Permissions

The incentive system is based on actual salesperson attribution and
business value.

### Staff

May view their own applicable incentive information where the business
chooses to expose it.

### Manager

May review incentive calculations and manage permitted incentive
operations.

### Owner

May configure and approve incentive policy.

Corrections that affect incentives must follow the correction rules and
preserve the underlying transaction history.

------------------------------------------------------------------------

# 17. Correction & Exception Permissions

This is the most sensitive permission category.

## 17.1 Staff

Staff may:

-   identify/report a mistake;
-   request a correction;
-   perform permitted minor corrections where explicitly configured and
    outside the material categories.

Staff may not independently correct their own material completed sale.

## 17.2 Manager

Managers may perform or approve authorized corrections.

However, the Manager cannot bypass:

-   audit history;
-   mandatory reason;
-   self-approval restrictions;
-   integrity controls;
-   domain-specific approval requirements.

## 17.3 Owner

Owner has the highest correction authority but must preserve all
history.

Owner authority means:

> **maximum authority to resolve the business issue, not permission to
> erase evidence.**

------------------------------------------------------------------------

# 18. Self-Approval Rules

The recommended default is:

> **A user should not approve their own material corrective action.**

This is especially important for corrections involving:

-   money;
-   payment;
-   inventory;
-   debt;
-   supplier liability;
-   incentives;
-   attribution;
-   customer identity;
-   high-integrity exceptions.

Where the Owner is the only practical authority, the system may permit
an Owner action under an explicit Owner-authorized exception, but the
action remains fully auditable.

Manager self-correction rules are intentionally delegated to the final
Roles & Permissions configuration because the Owner should define
Manager authority.

------------------------------------------------------------------------

# 19. High-Integrity Actions

The following should receive elevated treatment:

-   changing customer identity;
-   changing completed-sale SKU;
-   changing salesperson attribution;
-   material payment corrections;
-   corrections affecting reconciled records;
-   inventory corrections after subsequent stock movement;
-   closed-business-day corrections;
-   suspicious duplicate handling;
-   suspected tampering;
-   integrity conflicts.

The system should not make these actions look like ordinary editing.

They should produce clear warnings, require the appropriate authority,
and preserve history.

------------------------------------------------------------------------

# 20. Integrity and Audit Permissions

## Staff

Staff should have enough visibility to understand operational errors but
should not have unrestricted access to audit or integrity controls.

## Manager

Manager may:

-   review audit history relevant to operations;
-   investigate integrity alerts;
-   review correction history;
-   resolve ordinary operational integrity issues within authority.

## Owner

Owner may:

-   view complete audit history;
-   investigate escalated integrity alerts;
-   resolve high-level integrity exceptions;
-   perform permitted overrides.

No role may delete or silently rewrite audit history.

Technical audit and hash-chain implementation belongs to D10/D11.

------------------------------------------------------------------------

# 21. Offline Permissions

Permissions do not disappear merely because the device is offline.

However, offline operation must follow the same business authority
rules.

Examples:

-   Staff may make normal offline sales.
-   Authorized management may perform permitted offline approvals.
-   Material offline corrections may be subject to later management
    review.
-   Offline conflicts never automatically overwrite accepted records.

After synchronization, unresolved authority/conflict conditions must be
surfaced for management resolution.

------------------------------------------------------------------------

# 22. Multi-Business Security Boundary

A user may belong to multiple businesses.

Permissions are evaluated **within the active business context**.

A user must never gain access to another business's:

-   sales;
-   inventory;
-   customers;
-   suppliers;
-   debt;
-   cash;
-   staff;
-   reports;
-   audit history

merely because the same user account belongs to multiple businesses.

Business membership is therefore a mandatory authorization boundary.

Branches are not supported in V1, although the model should not prevent
future branch support. fileciteturn22file7L1047-L1073

------------------------------------------------------------------------

# 23. Permission Escalation

When a user attempts an action beyond their authority, the system should
provide an appropriate path rather than simply failing silently.

Recommended flow:

**Staff attempts sensitive action**\
↓\
System explains that management approval is required\
↓\
Staff submits/request action\
↓\
Manager/Owner reviews\
↓\
Approved → action proceeds\
Rejected → original business state remains unchanged\
↓\
Audit trail records the request/decision where required

------------------------------------------------------------------------

# 24. Denied Actions

A denied action must not alter the business record.

Where the denied action itself is security-sensitive, the system may
record the attempted action for security/audit purposes.

A denial should not create a fake sale, payment, stock movement, debt
change, or other business event.

------------------------------------------------------------------------

# 25. Role Changes

Changing a user's role is itself a sensitive administrative action.

Recommended rules:

-   Owner may grant/revoke Owner and Manager capabilities.
-   Manager may manage Staff accounts only where the Owner has granted
    that administrative permission.
-   Staff cannot modify permissions.
-   Permission changes take effect prospectively.
-   Historical transactions retain the user identity and permissions
    relevant to the time of the event.

Changing a user's current role must never rewrite their historical
actions.

------------------------------------------------------------------------

# 26. Disabled / Removed Users

Removing a user's access does not delete their historical activity.

The system must preserve:

-   their user identity/reference;
-   historical sales;
-   approvals;
-   corrections;
-   repayments;
-   inventory actions;
-   cash activity;
-   audit records.

Historical attribution must remain understandable even after a user is
no longer active.

------------------------------------------------------------------------

# 27. Permission Evaluation Order

For security and implementation consistency, recommended evaluation
order is:

1.  Is the user authenticated?
2.  Is the user a member of the active business?
3.  Is the user active?
4.  Does the user's role include the required permission?
5.  Is the action valid for the current transaction state?
6.  Does the action require additional approval?
7.  Is the user prohibited from approving their own action?
8.  Is the business day/state compatible with the action?
9.  Are there integrity/conflict blocks?
10. If all conditions pass, allow and record the action appropriately.

This gives the developer a predictable authorization pipeline.

------------------------------------------------------------------------

# 28. Separation-of-Duty Rules

At minimum:

### Rule 1 --- Self-correction

A staff member cannot independently correct their own material completed
sale.

### Rule 2 --- Self-approval

A user should not approve their own material corrective action where
independent approval is practical.

### Rule 3 --- Credit authorization

A salesperson cannot independently authorize their own customer credit
exception.

### Rule 4 --- Return approval

A salesperson cannot independently approve a return that requires
management approval.

### Rule 5 --- Payment correction

A salesperson cannot independently alter a completed material payment
record.

### Rule 6 --- Inventory correction

A salesperson cannot independently correct an inventory discrepancy.

### Rule 7 --- Closed day

A salesperson cannot reopen or alter a closed business day.

### Rule 8 --- Integrity override

A staff account cannot override an integrity/security block.

### Rule 9 --- Historical evidence

No role can delete historical evidence merely because the role has high
authority.

------------------------------------------------------------------------

# 29. Management Escalation Levels

Recommended escalation model:

### Level 1 --- Routine

Normal operational activity.

Examples:

-   normal sale;
-   normal repayment;
-   normal shift activity.

May be handled by Staff.

### Level 2 --- Managed

Requires management involvement.

Examples:

-   credit approval;
-   return approval;
-   normal material correction;
-   inventory discrepancy;
-   payment correction.

Manager normally handles.

### Level 3 --- Elevated

Requires Owner involvement or elevated management authority.

Examples:

-   major financial correction;
-   serious customer-identity issue;
-   high-value inventory discrepancy;
-   closed-day major correction;
-   significant debt write-off;
-   serious integrity concern.

### Level 4 --- Integrity/Security

Potential unauthorized manipulation or system-integrity failure.

The action is blocked where possible and escalated above the acting
account. Owner resolution is available where Owner authority permits.

------------------------------------------------------------------------

# 30. What Staff Should See

The permission model should be mostly invisible during normal work.

Staff should see:

-   products they can sell;
-   current selling prices;
-   relevant stock availability;
-   their sales;
-   permitted payment workflows;
-   required approval prompts;
-   clear explanations when an action requires management.

Staff should not normally see:

-   acquisition cost;
-   unrestricted gross margin;
-   sensitive management reports;
-   unrestricted audit history;
-   supplier liabilities;
-   management-only configuration;
-   unrestricted correction controls.

------------------------------------------------------------------------

# 31. What Management Should See

Managers should have operational visibility into:

-   all sales;
-   inventory;
-   supplier activity;
-   customer debt;
-   repayments;
-   returns;
-   cash reconciliation;
-   staff activity;
-   corrections;
-   discrepancies;
-   relevant audit history;
-   incentives.

The Owner additionally has full business visibility and escalated
authority.

------------------------------------------------------------------------

# 32. Business Rules Versus Permissions

B09 does not replace the domain rules.

Examples:

-   B03 determines that credit requires management authorization.
-   B04 determines return approval and settlement behavior.
-   B06 determines inventory costing and discrepancy treatment.
-   B08 determines correction philosophy and audit preservation.
-   B09 determines **which role can perform/authorize those actions**.

This separation prevents permission changes from accidentally changing
the underlying business rule.

------------------------------------------------------------------------

# 33. Reconciliation Against Existing Deliverables

## B01

B01 already establishes:

-   Role → Permission → User;
-   Owner;
-   Manager;
-   Staff/Salesperson;
-   multiple Managers;
-   Owner + Manager capability;
-   multiple businesses per user;
-   Staff restrictions on sensitive cost/profit information.
    fileciteturn22file7L1047-L1138

B09 formalizes these principles rather than replacing them.

## B02

B02 establishes that purchasing and supplier relationships belong to
management.

B09 therefore prevents Staff from independently authorizing purchases.

## B03

B03 requires management authorization for credit and supports management
debt controls. fileciteturn22file6L902-L922

B09 translates this into Staff/Manager/Owner permissions.

## B04

Return approval, settlement, and return-specific permissions remain
governed by B04.

## B05

Cash reconciliation and business-day management remain governed by B05.

## B06

Inventory movement, discrepancy investigation, and weighted-average
costing remain governed by B06. Physical counts do not overwrite the
ledger. fileciteturn22file9L1376-L1417

## B07

Transaction lifecycle permissions must respect B07's rule that lifecycle
history is preserved.

## B08

B08 is the primary authority for correction/exception philosophy.

B09 supplies the authority matrix needed to execute B08.

## D10 / D11

D10/D11 remain authoritative for technical audit and integrity
implementation.

B09 establishes the business authorization requirements those technical
systems must enforce.

------------------------------------------------------------------------

# 34. Important Design Decisions

The following are recommended as B09 decisions rather than open
questions:

1.  Three primary business roles are sufficient for V1: Owner, Manager,
    Staff/Salesperson.
2.  Owner and Manager capabilities may coexist on one user.
3.  Permissions are explicit rather than implied by screen access.
4.  Staff receives least privilege necessary for fast selling.
5.  Management controls sensitive business operations.
6.  Material corrections are management-controlled.
7.  Staff cannot independently correct their own material completed
    sale.
8.  Self-approval is prohibited for material actions where separation of
    duties is practical.
9.  Owner authority never permits destruction of audit history.
10. Business membership is an authorization boundary.
11. Offline mode does not bypass permissions.
12. Role changes do not rewrite historical attribution.
13. Disabled users remain represented in historical records.
14. High-integrity actions receive elevated controls.
15. Denied actions do not create business events.

------------------------------------------------------------------------

# 35. Deferred Decisions

B09 deliberately leaves the following for later or for final
implementation configuration:

-   Manager self-correction follows the severity/type policy and consequential actions are flagged to Owner;
-   exact Manager self-approval rules where Owner is unavailable;
-   exact discount thresholds;
-   exact incentive-policy administration;
-   exact high-value monetary thresholds;
-   exact permission UI;
-   exact authentication factors/PIN policy;
-   exact device-sharing behavior;
-   exact technical authorization schema;
-   exact API authorization responses;
-   exact offline conflict implementation.

These should be resolved in the appropriate later deliverables without
reopening the established role philosophy.

------------------------------------------------------------------------

# 36. Acceptance Criteria

B09 is ready for lock when:

-   Owner, Manager, and Staff responsibilities are unambiguous;
-   Role → Permission → User is preserved;
-   permissions are explicit rather than inferred from screens;
-   least privilege is applied to Staff;
-   sensitive business actions are management-controlled;
-   self-approval restrictions are defined;
-   business membership is a hard authorization boundary;
-   offline mode cannot bypass authorization;
-   high-integrity actions receive elevated control;
-   role changes cannot rewrite historical attribution;
-   disabled users remain historically traceable;
-   rejected actions do not change business state;
-   Owner authority cannot destroy audit history;
-   domain-specific rules remain owned by their authoritative
    deliverables;
-   the permission matrix can be translated directly into UX and
    technical authorization requirements.

------------------------------------------------------------------------

# 37. Final Recommendation

Sabi Shop should **not** become a complicated enterprise RBAC system
with dozens of job titles.

The recommended V1 model is intentionally simple:

> **Owner → ultimate business authority**\
> **Manager → operational management authority**\
> **Staff/Salesperson → normal business execution**

The sophistication belongs underneath the simple role names:

> **Role → Permission → Context → Approval → Audit**

That gives Sabi Shop a simple experience for a small shop while
protecting the areas that matter most: money, inventory, debt, customer
identity, staff accountability, and historical integrity.

**The guiding rule is:**

> **Give each person enough authority to do their job quickly --- but
> not enough authority to quietly rewrite the business.**

---

# FINAL RECONCILIATION — AUTHORITY OVERRIDES

Manager self-correction follows the correction severity/type policy. Consequential Manager actions are consistently flagged to Owner. Separate approval requirements cannot be satisfied by self-approval.

Authorized Staff may confirm transfers after external verification; the confirmation is attributable and reviewable.

Both shared cash-drawer and individual-salesperson custody modes are supported as configurable business settings.
