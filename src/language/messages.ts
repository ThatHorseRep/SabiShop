export type Language = 'en' | 'pcm'

export type TranslationParams = Record<string, string | number>

const englishMessages = {
  'common.language': 'Language',
  'common.english': 'English',
  'common.pidgin': 'Pidgin',
  'common.cancel': 'Cancel',
  'common.cancelled': 'Cancelled',
  'common.completed': 'Completed',
  'common.confirm': 'Confirm',
  'common.continue': 'Continue',
  'common.retry': 'Retry',
  'common.close': 'Close',
  'common.closeDialog': 'Close dialog',
  'common.closePanel': 'Close panel',
  'common.dismiss': 'Dismiss',
  'common.dismissNotification': 'Dismiss notification',
  'common.reload': 'Reload app',
  'common.nextStep': 'Next step',
  'common.nothingSaved': 'Nothing was saved',
  'common.savedOnDevice': 'Saved on this device',
  'common.cancelledDescription':
    'This action was cancelled. Nothing was committed.',
  'loading.generic': 'Loading',
  'loading.slow': 'Still loading. Keep this page open.',
  'loading.saving': 'Saving your work',
  'loading.report': 'Preparing your report',
  'empty.generic.title': 'Nothing here yet',
  'empty.generic.description': 'There is nothing to show here yet.',
  'empty.search.title': 'No results',
  'empty.search.description': 'No record matches this search yet.',
  'empty.products.title': 'No products yet',
  'empty.products.description': 'Products will show here after you add them.',
  'empty.customers.title': 'No customers yet',
  'empty.customers.description': 'Customers will show here after you add them.',
  'empty.sales.title': 'No sales yet',
  'empty.sales.description': 'Completed sales will appear here.',
  'empty.repayments.title': 'No repayments yet',
  'empty.repayments.description': 'Confirmed repayments will appear here.',
  'empty.inventory.title': 'No stock movements yet',
  'empty.inventory.description': 'Stock movements will show here.',
  'empty.reviewQueue.title': 'Nothing needs review',
  'empty.reviewQueue.description': 'Nothing is waiting for a decision.',
  'empty.report.title': 'No report data',
  'empty.report.description': 'No records match this reporting period.',
  'confirmation.sale.title': 'Sale completed',
  'confirmation.sale.description':
    'The confirmed payment, stock change, and receipt are recorded. Nothing is deleted.',
  'confirmation.payment.title': 'Payment recorded',
  'confirmation.payment.description':
    'The successful payment is linked to this record. Pending or failed attempts are not counted as successful.',
  'confirmation.repayment.title': 'Repayment recorded',
  'confirmation.repayment.description':
    'The confirmed repayment is linked to the customer debt and reduces what is still owed.',
  'confirmation.return.title': 'Return applied',
  'confirmation.return.description':
    'The return is linked to the original sale. The original sale remains in history.',
  'confirmation.correction.title': 'Correction applied',
  'confirmation.correction.description':
    'The corrected state is now current, and the original record remains in history.',
  'confirmation.receipt.title': 'Receipt recorded',
  'confirmation.receipt.description':
    'The receipt is recorded with the stock, quantities, actual prices, and payment methods used.',
  'confirmation.stockCount.title': 'Stock count recorded',
  'confirmation.stockCount.description':
    'The physical count is recorded as evidence. Any difference stays visible for investigation.',
  'confirmation.cashCount.title': 'Cash count recorded',
  'confirmation.cashCount.description':
    'The cash you counted is recorded. Any difference stays visible for investigation.',
  'confirmation.businessDay.title': 'Business day closed',
  'confirmation.businessDay.description':
    'The reconciliation record is closed with its evidence. It can be reopened only with approval and a reason.',
  'confirmation.supplierReturn.title': 'Supplier return applied',
  'confirmation.supplierReturn.description':
    'The unpaid payable or supplier credit is updated according to the purchase settlement state.',
  'confirmation.customer.title': 'Customer created',
  'confirmation.customer.description':
    'The customer record is created. Creating a customer does not authorize credit.',
  'error.generic.title': 'Something went wrong',
  'error.generic.description':
    'We could not finish the action. Nothing was saved. Check the information and try again.',
  'error.network.title': 'Connection problem',
  'error.network.description':
    'The action did not reach the service. Nothing was saved. Reconnect and try again; do not create a second record if this one may still be waiting.',
  'error.storage.title': 'Local storage problem',
  'error.storage.description':
    'This device cannot save the operation securely. Nothing was saved. Move to a working device or contact support before recording more work.',
  'error.permission.title': 'Permission denied',
  'error.permission.description':
    'You do not have permission for this action. Nothing was saved. Ask the right manager or owner to approve or do it.',
  'error.authorization.title': 'Approval needed',
  'error.authorization.description':
    'This action needs approval first. Nothing was saved. Get the required approval, then continue.',
  'error.sync.title': 'Synchronization failed',
  'error.sync.description':
    'The record is still on this device and has not uploaded. Do not submit a new record. Retry the same record, or ask for support if it keeps failing.',
  'error.conflict.title': 'Two versions need review',
  'error.conflict.description':
    'Two versions of this record changed. Nothing was overwritten. An authorized person must review both versions before the accepted state is chosen.',
  'error.integrity.title': 'Data problem',
  'error.integrity.description':
    'The record may be incomplete or tampered with. Do not edit it. Keep the evidence and report it to the owner or authorized support.',
  'error.validation.title': 'Check the information',
  'error.validation.description':
    'The information is not complete or valid. Nothing was saved. Correct the highlighted fields and try again.',
  'error.notFound.title': 'Record not found',
  'error.notFound.description':
    'We could not find that record in this business. Nothing was saved. Search again or ask for the correct reference.',
  'error.crossBusiness.title': 'Wrong business',
  'error.crossBusiness.description':
    'That record belongs to another business. Nothing was saved. Switch to the correct business or ask the owner for access.',
  'error.unhandled.title': 'The app stopped unexpectedly',
  'error.unhandled.description':
    'Reload the app and try again. Your data should not be treated as saved until the operation confirms.',
  'permission.operationBlocked': 'You cannot do this action',
  'permission.offlineNoChange': 'Offline does not change your permission',
  'permission.selfApproval': 'You cannot approve your own request',
  'permission.approverUnavailable': 'No separate approver available',
  'permission.crossBusiness': 'This record belongs to another business',
  'authorization.required.title': 'Approval needed',
  'authorization.required.description':
    'This action needs a separate approval before it can continue.',
  'authorization.signInBusiness':
    'Sign in and choose a business before continuing.',
  'authorization.pending.title': 'Approval pending',
  'authorization.pending.description':
    'The request is saved and waiting for the required approver.',
  'authorization.approved.title': 'Approved',
  'authorization.approved.description':
    'The required approval is recorded with the approver and reason.',
  'authorization.rejected.title': 'Rejected',
  'authorization.rejected.description':
    'The request was rejected. No corresponding business effect was applied.',
  'authorization.expired.title': 'Approval expired',
  'authorization.expired.description':
    'The approval is no longer valid. Get a new approval before continuing.',
  'authorization.separateApprover.title': 'Separate approval required',
  'authorization.separateApprover.description':
    'The person who requested this action cannot approve it.',
  'offline.title': 'Offline',
  'offline.description':
    'This device is offline. Supported work continues locally and will synchronize when the connection returns.',
  'offline.recorded': 'Recorded on this device',
  'offline.requiresConnection': 'This action needs a connection',
  'sync.pending.title': 'Waiting to sync',
  'sync.pending.description':
    'Saved on this device and waiting to synchronize.',
  'sync.pendingCount': 'Waiting to sync · {count}',
  'sync.complete.title': 'Synchronized',
  'sync.complete.description': 'This record is synchronized.',
  'sync.failed.title': 'Sync failed',
  'sync.failed.description':
    'Still saved on this device. Retry the same record; do not create a duplicate.',
  'sync.conflict.title': 'Two versions need review',
  'sync.conflict.description':
    'Two versions changed. Nothing was overwritten. An authorized person must review both versions.',
  'sync.conflictCount': 'Two versions · {count}',
  'sync.storageUnavailable': 'Sync storage unavailable',
  'sync.reconnecting': 'Reconnecting',
  'correction.required.title': 'Correction needed',
  'correction.required.description':
    'This record needs a correction before it can be treated as correct.',
  'correction.window.title': 'Time left to correct',
  'correction.window.open': 'You can still correct this',
  'correction.window.closed': 'You can no longer correct this',
  'correction.applied.title': 'Correction applied',
  'correction.applied.description':
    'The corrected state is now current. The original record remains in history.',
  'correction.rejected.title': 'Correction rejected',
  'correction.rejected.description':
    'The correction was not applied. The original record remains current.',
  'correction.originalPreserved': 'The original record is preserved',
  'correction.reasonRequired': 'A reason is required',
  'correction.reasonLabel': 'Reason',
  'correction.reasonHint':
    'The reason is recorded with the correction history.',
  'correction.highIntegrity': 'Serious correction',
  'payment.notConfirmed.title': 'Payment not confirmed',
  'payment.notConfirmed.description':
    'This payment has not been confirmed. Do not release stock or record the sale as paid.',
  'payment.confirmed.title': 'Payment confirmed',
  'payment.confirmed.description':
    'The successful payment is recorded and linked to this sale.',
  'payment.pending.title': 'Payment pending',
  'payment.pending.description':
    'The payment is still pending. Do not treat it as successful.',
  'payment.failed.title': 'Payment failed',
  'payment.failed.description':
    'The payment attempt failed. Nothing was recorded as successful. Retry only after checking the payment method.',
  'payment.split.title': 'Split payment',
  'payment.split.description':
    'Each payment part is recorded separately and linked to the same sale.',
  'payment.remaining': 'Remaining',
  'payment.settled': 'Settled',
  'payment.creditApproved.title': 'Credit approved',
  'payment.creditApproved.description':
    'The approved credit amount is recorded as customer debt.',
  'payment.creditRejected.title': 'Credit rejected',
  'payment.creditRejected.description':
    'The credit request was rejected. No debt was created.',
  'payment.refundDue.title': 'Refund due',
  'payment.refundDue.description':
    'The refund is due, but Sabi Shop does not execute the money movement.',
  'payment.refundSettled.title': 'Refund settled',
  'payment.refundSettled.description':
    'The successful settlement is recorded. The external money movement is not executed or independently verified by Sabi Shop.',
  'payment.external.title': 'External settlement',
  'payment.external.description':
    'Sabi Shop records the settlement; it does not move the money.',
  'debt.outstanding.title': 'What the customer still owes',
  'debt.outstanding.description':
    'This is money the customer owes the business. It is not cash in hand and not revenue.',
  'debt.partiallyRepaid.title': 'Partially repaid',
  'debt.partiallyRepaid.description':
    'Some of the debt has been repaid. The remaining amount is still owed.',
  'debt.settled.title': 'Debt settled',
  'debt.settled.description':
    'The debt is settled. The repayment history is preserved.',
  'debt.disputed.title': 'Disputed debt',
  'debt.disputed.description':
    'This debt is disputed. Keep it visible and investigate before collection.',
  'debt.writeOff.title': 'Debt written off',
  'debt.writeOff.description':
    'The debt is written off with authorization and a reason. The history is preserved.',
  'debt.creditLimit': 'Credit limit',
  'debt.availableCredit': 'Available credit',
  'debt.increase': 'What the customer owes will increase',
  'debt.reduce': 'What the customer owes will reduce',
  'inventory.inStock': 'In stock',
  'inventory.outOfStock': 'Out of stock',
  'inventory.negativeStock.title': 'Stock is below zero',
  'inventory.negativeStock.description':
    'Sellable stock is below zero. The sale can continue only with approval, and the exception stays visible for management review.',
  'inventory.countVariance.title': 'Stock count difference',
  'inventory.countVariance.description':
    'The physical count does not match the system stock. Investigate first; do not overwrite the ledger.',
  'inventory.receipt.title': 'Receipt recorded',
  'inventory.receipt.description':
    'Stock and supplier obligation are recorded from this receipt.',
  'inventory.heldStock': 'Held stock',
  'inventory.weightedAverage': 'Average cost',
  'inventory.historicalCost': 'The original cost is preserved',
  'cash.inHand': 'Cash in Hand',
  'cash.expected': 'Cash you should have',
  'cash.actual': 'Cash you counted',
  'cash.variance.title': 'Cash difference',
  'cash.variance.description':
    'The cash you counted does not match the cash you should have. Investigate the difference; do not change source records to force them to agree.',
  'cash.in': 'Cash in',
  'cash.out': 'Cash out',
  'cash.refundPaid': 'Cash refund paid',
  'cash.notProfit': 'Cash in Hand is not profit',
  'cash.expectedDerivation':
    'Cash you should have comes from confirmed cash events',
  'cash.actualCountOnly': 'Cash you counted is entered during reconciliation',
  'cash.sessionClosed': 'Cash session closed',
  'cash.discrepancy': 'Cash discrepancy',
  'reporting.title': 'Reporting',
  'reporting.netRecognizedSellingValue': 'Total sales after discount',
  'reporting.tax': 'Tax (VAT)',
  'reporting.cogs': 'Cost of stock sold',
  'reporting.grossProfit': 'Profit before expenses',
  'reporting.formula':
    'Profit before expenses = Total sales after discount − Cost of stock sold',
  'reporting.eventTime': 'Event time',
  'reporting.sourceTraces': 'Source records',
  'reporting.stale.title': 'Report data may be old',
  'reporting.stale.description':
    'This report may not include the latest synchronized records. Check the last update before using it.',
  'reporting.noData.title': 'No report data',
  'reporting.noData.description':
    'No records match this period. Change the period or check the source records.',
  'reporting.cashAndProfitDistinct': 'Cash and profit are different',
  'nav.home': 'Home',
  'nav.homeDescription':
    'Today’s overview, what needs attention, and system status.',
  'nav.sell': 'Sell',
  'nav.sellDescription': 'Record sales and confirmed payments.',
  'nav.productsInventory': 'Products & Stock',
  'nav.productsInventoryDescription': 'Products, stock, and movements.',
  'nav.customersCredit': 'Customers & Credit',
  'nav.customersCreditDescription': 'Customers, credit, and repayments.',
  'nav.suppliersPurchasing': 'Suppliers & Purchasing',
  'nav.suppliersPurchasingDescription': 'Suppliers, purchases, and receiving.',
  'nav.money': 'Money',
  'nav.moneyDescription': 'Cash, counting, and what needs review.',
  'nav.activity': 'Activity',
  'nav.activityDescription': 'Business activity in order.',
  'nav.management': 'Management',
  'nav.managementDescription': 'Performance, review, and records.',
  'nav.settings': 'Settings',
  'nav.settingsDescription': 'Business settings.',
  'nav.groupWork': 'Work',
  'nav.groupMoney': 'Money',
  'nav.groupActivity': 'Activity',
  'nav.groupManagement': 'Management',
  'nav.groupSystem': 'System',
  'system.online': 'Online',
  'system.offline': 'Offline',
  'system.storageUnavailable': 'Sync storage unavailable',
  'system.state': 'System state',
  'system.connected': 'Connected.',
  'system.allSynchronized':
    'Everything recorded on this device is synchronized.',
  'system.conflictDescription':
    'One or more records changed in more than one place. A manager or owner must review both versions before choosing the accepted one.',
  'system.pendingDescription':
    'These actions are saved on this device and will upload when sync is available.',
  'attention.aria': 'Attention: {count} item(s) requiring review',
  'shell.skipToContent': 'Skip to main content',
  'shell.primary': 'Primary',
  'shell.primaryMobile': 'Primary mobile',
  'shell.more': 'More',
  'shell.collapseNavigation': 'Collapse navigation',
  'shell.notSignedIn': 'Not signed in',
  'shell.account': 'Account',
  'shell.signOut': 'Sign out',
  'shell.language': 'Language',
  'home.title': 'Home',
  'home.description': 'Today’s overview, attention, and system state.',
  'home.openManagement': 'Open Management',
  'home.startSelling': 'Start selling',
  'home.foundationStatus': 'Sabi Shop status',
  'home.foundationDescription':
    'The app shell, design system, and selling workspace are ready. More modules will arrive behind clear business and permission boundaries.',
  'home.shellReady': 'App ready',
  'home.shellReadyDescription':
    'Automatic checks and error recovery are active.',
  'home.syncPendingCount': 'Waiting to sync · {count}',
  'home.nothingWaiting': 'Nothing waiting to sync',
  'home.recordedOnDevice': 'Recorded on this device.',
  'home.noLocalOperations': 'No local operations are waiting.',
  'home.identityAndAccess': 'Identity and access',
  'home.referenceSession':
    'Selling currently runs on a temporary sign-in setup. The real sign-in provider will take over without changing the POS workflow.',
  'home.authorizationBoundary':
    'The system checks your user, device, business, role, permission, action, and approval requirement before allowing an action.',
  'home.updateAvailable': 'Update available',
  'home.updateNow': 'Update now',
  'home.updateDescription':
    'A new version of Sabi Shop has been downloaded and is ready to use.',
  'home.storageUnavailable': 'Sync storage unavailable',
  'home.storageUnavailableDescription':
    'This browser is not saving local sync data. Work recorded here may not be recoverable after the app closes.',
  'home.arrivesLaterTitle': 'Coming in a later module',
  'home.arrivesLaterDescription':
    'This area is planned, but its screen is built in a later module. Selling is available now from Sell.',
  'pos.abandon.title': 'Leave the unfinished sale?',
  'pos.abandon.notRecordedTitle': 'An unfinished sale is not recorded',
  'pos.abandon.description':
    'This sale has {count} item(s) totalling {total} and has not been completed.',
  'pos.abandon.notRecorded':
    'Discarding the basket applies no business effect. Nothing will be recorded as sold, paid, or owed.',
  'pos.abandon.continue': 'Continue sale',
  'pos.abandon.discard': 'Clear basket',
}

export type MessageKey = keyof typeof englishMessages

const pidginMessages: Record<MessageKey, string> = {
  'common.language': 'Language',
  'common.english': 'English',
  'common.pidgin': 'Pidgin',
  'common.cancel': 'Cancel am',
  'common.cancelled': 'E don cancel',
  'common.completed': 'E don complete',
  'common.confirm': 'Confirm am',
  'common.continue': 'Continue',
  'common.retry': 'Try again',
  'common.close': 'Close am',
  'common.closeDialog': 'Close dialog',
  'common.closePanel': 'Close panel',
  'common.dismiss': 'Dismiss am',
  'common.dismissNotification': 'Dismiss the notification',
  'common.reload': 'Reload the app',
  'common.nextStep': 'Next thing to do',
  'common.nothingSaved': 'Nothing don save',
  'common.savedOnDevice': 'E don save for this device',
  'common.cancelledDescription': 'Dis action cancel. Nothing happen.',
  'loading.generic': 'E dey load',
  'loading.slow': 'E still dey load. Never close this page.',
  'loading.saving': 'We dey save your work',
  'loading.report': 'We dey prepare di report',
  'empty.generic.title': 'Nothing dey show yet',
  'empty.generic.description': 'Nothing dey show for this place now.',
  'empty.search.title': 'No result',
  'empty.search.description': 'You never record anything for this search yet.',
  'empty.products.title': 'You never add any product yet',
  'empty.products.description': 'Your goods go show here after you add them.',
  'empty.customers.title': 'You never add any customer yet',
  'empty.customers.description':
    'Your customers go show here after you add them.',
  'empty.sales.title': 'You never sell anything yet',
  'empty.sales.description': 'All your sales wey don complete go show here.',
  'empty.repayments.title': 'Nobody don pay gbese yet',
  'empty.repayments.description': 'Any gbese wey dem pay go show here.',
  'empty.inventory.title': 'Nothing don comot from your goods yet',
  'empty.inventory.description': 'Any goods wey enter or comot go show here.',
  'empty.reviewQueue.title': 'Nothing dey to check',
  'empty.reviewQueue.description': 'Nothing dey wait make you attend to am.',
  'empty.report.title': 'Nothing dey to report',
  'empty.report.description': 'Nothing to report inside this period.',
  'confirmation.sale.title': 'Sale don complete',
  'confirmation.sale.description':
    'Payment, goods change, and receipt don record. Nothing delete.',
  'confirmation.payment.title': 'Payment don record',
  'confirmation.payment.description':
    'Di successful payment don link to this record. We no dey count any one wey dey pend or fail.',
  'confirmation.repayment.title': 'The gbese wey dem pay don record',
  'confirmation.repayment.description':
    'The confirmed repayment don enter the customer gbese and e reduce wetin still remain.',
  'confirmation.return.title': 'The goods don return',
  'confirmation.return.description':
    'The goods wey dem return don link to the original sale. The original sale still dey history.',
  'confirmation.correction.title': 'The correction don happen',
  'confirmation.correction.description':
    'The correct one dey show now, and the original record still dey history.',
  'confirmation.receipt.title': 'Di receipt don record',
  'confirmation.receipt.description':
    'The receipt don record with the goods, quantities, actual prices, and payment methods used.',
  'confirmation.stockCount.title': 'Goods count don record',
  'confirmation.stockCount.description':
    'The physical count don record as evidence. Any difference go stay visible for checking.',
  'confirmation.cashCount.title': 'Di money wey dey your hand don record',
  'confirmation.cashCount.description':
    'The money wey you count don record. Any difference go stay visible for checking.',
  'confirmation.businessDay.title': 'Shop don close today',
  'confirmation.businessDay.description':
    'The reconciliation record don close with the evidence. E fit reopen only with approval and reason.',
  'confirmation.supplierReturn.title': 'Supplier return don apply',
  'confirmation.supplierReturn.description':
    'Di money you never pay your supplier don update as we remove the one you don pay.',
  'confirmation.customer.title': 'Di customer don create',
  'confirmation.customer.description':
    'The customer record don create. Creating customer no mean say dem go give am credit.',
  'error.generic.title': 'Problem happen',
  'error.generic.description':
    'We no fit finish the work. Nothing don save. Check wetin happen then try again.',
  'error.network.title': 'Network problem',
  'error.network.description':
    'Di work no reach di where e suppose go. Nothing don save. Check your data make you fit browse then try again. If dis one fit still dey wait, no open another record.',
  'error.storage.title': 'Your storage get problem',
  'error.storage.description':
    'Dis your device no fit save di operation well. Nothing don save. Try use another device or contact support before you record more work.',
  'error.permission.title': 'Them no allow you do this one',
  'error.permission.description':
    'You no get permission for this thing. Nothing don save. Ask the right manager or owner to approve or do am.',
  'error.authorization.title': 'Approval needed',
  'error.authorization.description':
    'This thing need approval first. Nothing don save. Get the approval wey e need, then continue.',
  'error.sync.title': 'The Upload no work',
  'error.sync.description':
    'The record still dey this device and e never upload. No submit new record. Retry the same record, or ask for support if e keep failing.',
  'error.conflict.title': 'Two versions dey',
  'error.conflict.description':
    'Two versions of this record don change. Nothing overwrite. Person wey get authority must review the two versions before dem choose the correct one.',
  'error.integrity.title': 'Data problem',
  'error.integrity.description':
    'The record fit incomplete or somebody tamper with am. No edit am. Keep the evidence and report am to the owner or authorized support.',
  'error.validation.title': 'Check di information again',
  'error.validation.description':
    'Di information no complete or e no correct. Nothing don save. Correct di places wey get problem then try again.',
  'error.notFound.title': 'Di Record no dey',
  'error.notFound.description':
    'We no see that record inside this business. Nothing don save. Search again or ask for di correct reference.',
  'error.crossBusiness.title': 'Wrong business',
  'error.crossBusiness.description':
    'Dat record no be this business own. Nothing don save. Switch to di correct business or ask di owner.',
  'error.unhandled.title': 'Di app stop without warning',
  'error.unhandled.description':
    'Reload di app then try again. No feel say e don saved until e confirm am.',
  'permission.operationBlocked': 'You no fit do this thing',
  'permission.offlineNoChange': 'Offline no change your permission',
  'permission.selfApproval': 'You no fit approve your own request',
  'permission.approverUnavailable': 'No separate approver dey',
  'permission.crossBusiness': 'Dis record na another business own',
  'authorization.required.title': 'Approval needed',
  'authorization.required.description':
    'This thing need separate approval before e go continue.',
  'authorization.signInBusiness':
    'Sign in and choose your business before you continue.',
  'authorization.pending.title': 'Approval dey wait',
  'authorization.pending.description':
    'Di request don save and e dey wait for di approver wey e need.',
  'authorization.approved.title': 'Approved',
  'authorization.approved.description':
    'Di approval don record with di person wey do am and why.',
  'authorization.rejected.title': 'Rejected',
  'authorization.rejected.description':
    'Dem reject di request. No do the transaction wey follow that request o.',
  'authorization.expired.title': 'Approval don expire',
  'authorization.expired.description':
    'The approval no valid again. Ask for new approval before you continue.',
  'authorization.separateApprover.title': 'Separate approval needed',
  'authorization.separateApprover.description':
    'Person wey request dis action no fit approve am.',
  'offline.title': 'Offline',
  'offline.description':
    'Dis device dey offline. Work wey you fit do offline go continue here, and e go sync when network come back.',
  'offline.recorded': 'We record am for this device',
  'offline.requiresConnection': 'Dis action need network',
  'sync.pending.title': 'Sync dey wait',
  'sync.pending.description':
    'We save am for this device and e dey wait to sync.',
  'sync.pendingCount': 'Sync dey wait · {count}',
  'sync.complete.title': 'E don sync',
  'sync.complete.description': 'Dis record don sync.',
  'sync.failed.title': 'E never sync',
  'sync.failed.description':
    'E still save for this device. Retry di same record; no create another one.',
  'sync.conflict.title': 'Two versions dey',
  'sync.conflict.description':
    'Two versions don change. Nothing overwrite. Manager or Owner must review the two versions before dem choose the correct one.',
  'sync.conflictCount': 'Two versions dey · {count}',
  'sync.storageUnavailable': 'Sync storage no dey',
  'sync.reconnecting': 'We dey connect back',
  'correction.required.title': 'You need make correction',
  'correction.required.description':
    'Dis record need correction before anybody go gree say e correct.',
  'correction.window.title': 'Correction window',
  'correction.window.open': 'You still fit make correction',
  'correction.window.closed': 'You no fit make correction again',
  'correction.applied.title': 'You don correct am',
  'correction.applied.description':
    'Di corrected state na di current one now. Di original record still dey history.',
  'correction.rejected.title': 'The correction reject',
  'correction.rejected.description':
    'The correction no work o. The original record still remain current.',
  'correction.originalPreserved': 'Di original record still dey',
  'correction.reasonRequired': 'Reason must dey',
  'correction.reasonLabel': 'Reason',
  'correction.reasonHint': 'Di reason go enter di correction history.',
  'correction.highIntegrity': 'This correction fit spoil things',
  'payment.notConfirmed.title': 'Payment never confirm',
  'payment.notConfirmed.description':
    'This payment never confirm. No release goods and no record the sale as paid.',
  'payment.confirmed.title': 'Payment don confirm',
  'payment.confirmed.description':
    'As the payment don enter, e don record and e link to this sale.',
  'payment.pending.title': 'Payment dey wait',
  'payment.pending.description':
    'Di payment still dey wait. No treat am as success.',
  'payment.failed.title': 'Payment fail',
  'payment.failed.description':
    'The payment fail o. Nothing don record as success. Try again after you check how dem take pay.',
  'payment.split.title': 'Dem use more than one way pay',
  'payment.split.description':
    'All the ways dem use pay dey record separate but all na for the same sale.',
  'payment.remaining': 'Wetin remain',
  'payment.settled': 'E don settle',
  'payment.creditApproved.title': 'Dem approve the credit',
  'payment.creditApproved.description':
    'The gbese wey dem gree make you give don record as customer gbese.',
  'payment.creditRejected.title': 'Dem reject the credit',
  'payment.creditRejected.description':
    'Dem reject the credit wey you wan give o. No gbese create.',
  'payment.refundDue.title': 'Refund dey due',
  'payment.refundDue.description':
    'Dem suppose don refund, but Sabi Shop no dey move di money.',
  'payment.refundSettled.title': 'Refund don settle',
  'payment.refundSettled.description':
    'The successful settlement don record. Sabi Shop no check whether the money come or not.',
  'payment.external.title': 'External settlement',
  'payment.external.description':
    'Sabi Shop dey record di settlement; e no dey move di money.',
  'debt.outstanding.title': 'Gbese wey remain',
  'debt.outstanding.description':
    'This na money wey customer owe the business. E no be money for hand.',
  'debt.partiallyRepaid.title': 'Part payment don enter',
  'debt.partiallyRepaid.description':
    'Part of di gbese don pay. Di remaining amount still dey owed.',
  'debt.settled.title': 'Gbese don settle',
  'debt.settled.description': 'The gbese don settle. How e pay dey history.',
  'debt.disputed.title': 'This gbese get wahala',
  'debt.disputed.description':
    'Customer say the gbese no correct. Make e dey show then check am before anything.',
  'debt.writeOff.title': 'Dem don fashi the gbese',
  'debt.writeOff.description':
    'The person wey clear the gbese and why dey history.',
  'debt.creditLimit': 'Gbese limit',
  'debt.availableCredit': 'Credit wey you fit still give',
  'debt.increase': 'Gbese wey remain go increase',
  'debt.reduce': 'Gbese wey remain go reduce',
  'inventory.inStock': 'Goods still dey',
  'inventory.outOfStock': 'Goods don finish',
  'inventory.negativeStock.title': 'Goods don enter minus',
  'inventory.negativeStock.description':
    'The goods wey dem record don finish. If you see another one, you fit still sell sha, but Manager or Owner go approve am.',
  'inventory.countVariance.title': 'Goods no complete',
  'inventory.countVariance.description':
    'The goods wey dey shop no match wetin you record here. Check wetin happen first. No change the record just to make dem agree.',
  'inventory.receipt.title': 'Receipt don record',
  'inventory.receipt.description':
    'Goods and supplier obligation don enter record from this receipt.',
  'inventory.heldStock': 'Goods wey dey on hold',
  'inventory.weightedAverage': 'Wetin e suppose cost now',
  'inventory.historicalCost': 'Wetin you been buy am still dey',
  'cash.inHand': 'Money for hand',
  'cash.expected': 'Money wey suppose dey',
  'cash.actual': 'Money wey you count',
  'cash.variance.title': 'Money difference',
  'cash.variance.description':
    'Money wey you count no match money wey suppose dey. Check the difference. No change anything because say them must agree.',
  'cash.in': 'Money enter',
  'cash.out': 'Money comot',
  'cash.refundPaid': 'Cash refund don pay',
  'cash.notProfit': 'Money for hand no be profit',
  'cash.expectedDerivation':
    'Money wey suppose dey come from confirmed cash events',
  'cash.actualCountOnly':
    'Money wey you count na during reconciliation dem dey count am',
  'cash.sessionClosed': 'Cash session don close',
  'cash.discrepancy': 'Cash discrepancy',
  'reporting.title': 'Report',
  'reporting.netRecognizedSellingValue': 'Total sales after discount',
  'reporting.tax': 'Tax',
  'reporting.cogs': 'Cost of goods sold',
  'reporting.grossProfit': 'Profit before expenses',
  'reporting.formula':
    'Profit before expenses = Total sales after discount − Cost of goods sold',
  'reporting.eventTime': 'When e happen',
  'reporting.sourceTraces': 'Records wey explain am',
  'reporting.stale.title': 'Report data fit don old',
  'reporting.stale.description':
    'Dis report fit no get di latest records wey don sync. Check di last update before you use am.',
  'reporting.noData.title': 'No report dey',
  'reporting.noData.description':
    'No record dey for this period. Change di period or check di records.',
  'reporting.cashAndProfitDistinct': 'Money and profit no be the same',
  'nav.home': 'Home',
  'nav.homeDescription':
    'Wetin happen today, wetin you need check, and system state.',
  'nav.sell': 'Sell',
  'nav.sellDescription': 'Record sales and payments wey don confirm.',
  'nav.productsInventory': 'Products & Goods',
  'nav.productsInventoryDescription': 'Products, goods, and movement.',
  'nav.customersCredit': 'Customers & Credit',
  'nav.customersCreditDescription': 'Customers, gbese, and how dem dey pay.',
  'nav.suppliersPurchasing': 'Suppliers & Purchasing',
  'nav.suppliersPurchasingDescription':
    'Suppliers, wetin we buy, and how e take enter shop.',
  'nav.money': 'Money',
  'nav.moneyDescription': 'Money, counting, and wetin you need check.',
  'nav.activity': 'Activity',
  'nav.activityDescription': 'Business activity as e happen.',
  'nav.management': 'Management',
  'nav.managementDescription': 'Performance, review, and audit.',
  'nav.settings': 'Settings',
  'nav.settingsDescription': 'Business configuration.',
  'nav.groupWork': 'Work',
  'nav.groupMoney': 'Money',
  'nav.groupActivity': 'Activity',
  'nav.groupManagement': 'Management',
  'nav.groupSystem': 'System',
  'system.online': 'Online',
  'system.offline': 'Offline',
  'system.storageUnavailable': 'Sync storage no dey',
  'system.state': 'System state',
  'system.connected': 'Connected.',
  'system.allSynchronized':
    'Everything wey don record for this device don sync.',
  'system.conflictDescription':
    'One or more records don change for plenty place. Manager or Owner must check the two versions before dem choose the correct one.',
  'system.pendingDescription':
    'The operation don record for this device and dem go upload when synchronization dey available.',
  'attention.aria': 'Attention: {count} item(s) wey need checking',
  'shell.skipToContent': 'Go to main content',
  'shell.primary': 'Primary',
  'shell.primaryMobile': 'Primary mobile',
  'shell.more': 'More',
  'shell.collapseNavigation': 'Collapse navigation',
  'shell.notSignedIn': 'You never sign in',
  'shell.account': 'Account',
  'shell.signOut': 'Sign out',
  'shell.language': 'Language',
  'home.title': 'Home',
  'home.description':
    'Wetin happen today, wetin need attention, and system state.',
  'home.openManagement': 'Open Management',
  'home.startSelling': 'Start selling',
  'home.foundationStatus': 'Sabi Shop status',
  'home.foundationDescription':
    'Application shell, design system, and POS selling workspace don ready. Other modules go come behind clear business and authorization boundaries.',
  'home.shellReady': 'App ready',
  'home.shellReadyDescription':
    'Strict TypeScript checks and error recovery dey active.',
  'home.syncPendingCount': 'Sync dey wait · {count}',
  'home.nothingWaiting': 'Nothing dey wait to sync',
  'home.recordedOnDevice': 'We record am for this device.',
  'home.noLocalOperations': 'No local operation dey wait.',
  'home.identityAndAccess': 'Identity and access',
  'home.referenceSession':
    'Selling still dey run on the temporary sign-in setup. The real sign-in go take over without changing how you sell.',
  'home.authorizationBoundary':
    'Actions dey get permission from active user, device, business membership, role, permission, operation state, and approval requirements.',
  'home.updateAvailable': 'Update dey available',
  'home.updateNow': 'Update now',
  'home.updateDescription':
    'New version of Sabi Shop don download and e ready to use.',
  'home.storageUnavailable': 'Sync storage no dey',
  'home.storageUnavailableDescription':
    'Dis browser no dey save local sync data. Work wey you record here fit no recover after app close.',
  'home.arrivesLaterTitle': 'E go come for later module',
  'home.arrivesLaterDescription':
    'This area dey inside the plan, but the screen go build for later module. Selling dey available now from Sell.',
  'pos.abandon.title': 'Leave di sale wey never finish?',
  'pos.abandon.notRecordedTitle': 'Sale wey never finish no dey record',
  'pos.abandon.description':
    'Dis sale get {count} item(s), total {total}, and e never complete.',
  'pos.abandon.notRecorded':
    'If you clear the basket, e no go affect anything. Nothing go record as sale, payment, or gbese.',
  'pos.abandon.continue': 'Continue sale',
  'pos.abandon.discard': 'Clear basket',
}

export const messageCatalog: Record<
  Language,
  Readonly<Record<MessageKey, string>>
> = {
  en: englishMessages,
  pcm: pidginMessages,
}

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'pcm'
}

export function formatMessage(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : match,
  )
}
