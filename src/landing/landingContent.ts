import {
  BellRinging,
  ChartLine,
  Clock,
  CurrencyNgn,
  Fingerprint,
  HandCoins,
  NotePencil,
  Package,
  Receipt,
  ShieldCheck,
  Storefront,
  Truck,
  Users,
  Wallet,
  WifiSlash,
  type Icon,
} from '@phosphor-icons/react'

export type LandingLanguage = 'en' | 'pcm'

export type Feature = { icon: Icon; title: string; detail: string; metricBadge?: string }

export type FaqItem = { question: string; answer: string }

export interface LandingCopy {
  nav: {
    howItWorks: string
    whatItCovers: string
    faq: string
    signIn: string
    getStarted: string
  }
  hero: {
    eyebrow: string
    titleLine1: string
    titleLine2: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    proof: string
  }
  simulator: {
    title: string
    offlineBadge: string
    onlineBadge: string
    customer: string
    toggleNetwork: string
    addItem: string
    completeSale: string
    saleCompleted: string
    reset: string
    total: string
    caption: string
  }
  problem: {
    title: string
    lead: string
    lines: string[]
    transition: string
  }
  outcomesTitle: string
  outcomesLead: string
  outcomes: Feature[]
  tagline: {
    statement: string
    words: string[]
  }
  howItWorks: {
    title: string
    lead: string
    steps: { number: string; title: string; detail: string }[]
  }
  productAreas: {
    title: string
    lead: string
    items: Feature[]
  }
  trust: {
    title: string
    lead: string
    items: Feature[]
  }
  audience: {
    title: string
    lead: string
    examples: string[]
    closing: string
  }
  faq: {
    title: string
    lead: string
    items: FaqItem[]
  }
  finalCta: {
    title: string
    lead: string
    button: string
  }
  footer: {
    tagline: string
    builtFor: string
  }
}

export const landingContent: Record<LandingLanguage, LandingCopy> = {
  en: {
    nav: {
      howItWorks: 'How it works',
      whatItCovers: 'What it covers',
      faq: 'FAQ',
      signIn: 'Sign in',
      getStarted: 'Get Started',
    },
    hero: {
      eyebrow: 'Shop operations for small retail businesses',
      titleLine1: 'Know what is happening',
      titleLine2: 'in your shop.',
      subtitle:
        'Sabi Shop records daily sales, stock, money, and customer credit in one connected picture, so you can see what happened, what you still have, and what needs attention.',
      ctaPrimary: 'Get Started',
      ctaSecondary: 'See how it works',
      proof:
        'Built for real shop conditions: multiple staff, cash and transfers, customer credit, negotiated prices, and unreliable connectivity.',
    },
    simulator: {
      title: 'New sale',
      offlineBadge: 'Offline · saved on device',
      onlineBadge: 'Online · cloud synced',
      customer: 'Customer · Ada Obi · credit allowed',
      toggleNetwork: 'Simulate offline',
      addItem: 'Add item',
      completeSale: 'Complete sale',
      saleCompleted: 'Sale completed · Receipt printed',
      reset: 'Reset demo',
      total: 'Total',
      caption: 'Representative view of the Sabi Shop sale workspace with example data.',
    },
    problem: {
      title: 'The shop does not pause for paperwork.',
      lead: 'A small retail business generates records all day, whether or not anyone is writing them down.',
      lines: [
        'Sales happen all day, at the counter and on the phone.',
        'Stock moves with every sale, delivery, and return.',
        'Customers buy on credit and repay on their own schedule.',
        'Money arrives as cash, transfers, and card payments, and leaves for expenses and restocking.',
        'Staff keep the shop moving while the owner is away.',
      ],
      transition:
        'At the end of the day, you still need to know what happened. Sabi Shop turns that daily activity into a clear business record as it happens, so you are not reconstructing the week from memory.',
    },
    outcomesTitle: 'Know your shop.',
    outcomesLead: 'Five things a shop owner needs to know clearly, kept connected in one place.',
    outcomes: [
      {
        icon: Receipt,
        title: 'Know your sales',
        detail:
          'What sold, when, at what price, and who recorded it. Every sale stays explainable.',
        metricBadge: '₦45,000 Transfer verified',
      },
      {
        icon: Package,
        title: 'Know your stock',
        detail: 'What you have, what came in, what moved out, and what needs restocking.',
        metricBadge: '3 Spark Plugs low stock',
      },
      {
        icon: CurrencyNgn,
        title: 'Know your money',
        detail:
          'Cash, transfers, and card payments kept distinct, with expenses, owner funding, and withdrawals traceable.',
        metricBadge: 'Zero variance today',
      },
      {
        icon: HandCoins,
        title: 'Know who owes you',
        detail: 'Credit sales, repayments, and outstanding obligations, so debt never becomes a guess.',
        metricBadge: '₦18,000 Debt due Friday',
      },
      {
        icon: BellRinging,
        title: 'Know what needs attention',
        detail:
          'Discrepancies, approvals, returns, and stock exceptions surface for review instead of staying hidden.',
        metricBadge: '1 Approval pending',
      },
    ],
    tagline: {
      statement: 'Run the shop. See the business.',
      words: ['Run', 'the', 'shop.', 'See', 'the', 'business.'],
    },
    howItWorks: {
      title: 'How Sabi Shop works',
      lead: 'Three connected steps: record what happens, keep the pieces linked, and see what needs your decision.',
      steps: [
        {
          number: '1',
          title: 'Record the work',
          detail:
            'Sales, receipts, customer debt repayments, and money movements recorded as they happen, online or offline.',
        },
        {
          number: '2',
          title: 'Keep the picture connected',
          detail:
            'A sale updates stock, payment records, and debt together. Records link back to who did them, when, and why.',
        },
        {
          number: '3',
          title: 'See what needs attention',
          detail:
            'Spot low stock, outstanding customer balances, cash differences, and things waiting for manager approval.',
        },
      ],
    },
    productAreas: {
      title: 'One system for the whole shop',
      lead: 'Different views for what each person does, connected to the same business truth.',
      items: [
        {
          icon: Storefront,
          title: 'Sell',
          detail: 'Record sales quickly, with discounts and split payments handled clearly.',
        },
        {
          icon: Package,
          title: 'Products & Stock',
          detail: 'Track what came in, what moved, and what remains.',
        },
        {
          icon: Users,
          title: 'Customers & Credit',
          detail: 'Follow who owes you and what has been repaid.',
        },
        {
          icon: Truck,
          title: 'Suppliers & Purchasing',
          detail: 'Keep purchases, supplier obligations, and received stock connected.',
        },
        {
          icon: Wallet,
          title: 'Money',
          detail: 'See cash, transfers, expenses, and reconciliation in one place.',
        },
        {
          icon: Clock,
          title: 'Activity',
          detail: 'Every important action leaves a traceable record.',
        },
        {
          icon: ChartLine,
          title: 'Management',
          detail: 'Review performance, exceptions, and what needs decisions.',
        },
      ],
    },
    trust: {
      title: 'Trustworthy where it matters',
      lead: 'Built for confidence, not just speed: clear authority, honest corrections, and reliable records.',
      items: [
        {
          icon: Fingerprint,
          title: 'Traceable activity',
          detail:
            'Important actions record who did what and when, so questions have answers.',
        },
        {
          icon: NotePencil,
          title: 'Controlled corrections',
          detail:
            'Mistakes can be corrected without pretending they never happened. Corrections keep their reasons and their history.',
        },
        {
          icon: ShieldCheck,
          title: 'Clear authority',
          detail:
            'Price overrides, credit, and consequential corrections follow the permissions you set.',
        },
        {
          icon: WifiSlash,
          title: 'Offline support',
          detail:
            'Keep working when connectivity is unreliable. Supported workflows continue locally and synchronize when connectivity returns.',
        },
      ],
    },
    audience: {
      title: 'Built for small shops',
      lead: 'Designed for independent retail businesses where the owner needs visibility without micromanaging every transaction.',
      examples: [
        'Retail shops',
        'Parts shops',
        'Equipment shops',
        'Hardware and tool shops',
        'Similar physical goods businesses',
      ],
      closing:
        'If you sell physical goods from a counter, buy from suppliers, take cash and transfers, and sometimes let trusted customers take items on credit, Sabi Shop was designed for your workflow.',
    },
    faq: {
      title: 'Questions shop owners ask',
      lead: 'Straightforward answers about how Sabi Shop works in your daily operations.',
      items: [
        {
          question: 'What is Sabi Shop?',
          answer:
            'Sabi Shop is a lightweight shop operations app for small retail businesses. It records sales, stock, money, customer credit, and staff activity, and turns them into a clear picture of the business.',
        },
        {
          question: 'Who is Sabi Shop for?',
          answer:
            'Small physical goods retail businesses, including shops selling parts, equipment, tools, and similar products, where the owner needs to know what is happening without personally doing every transaction.',
        },
        {
          question: 'Does it work offline?',
          answer:
            'Yes, for supported workflows. Sales and other daily work can continue locally when connectivity drops, and records synchronize when connectivity returns. Conflicts are surfaced for review rather than silently overwritten.',
        },
        {
          question: 'Can my staff use it?',
          answer:
            'Yes. The selling interface is designed for fast everyday shop work, and each staff member sees what their role allows. Staff record sales, repayments, and cash movements, while approval and review controls stay with management.',
        },
        {
          question: 'Can I track customer credit?',
          answer:
            'Yes. Credit sales, repayments, and outstanding debt are tracked per customer, with credit limits and approval rules you control.',
        },
        {
          question: 'Can I track stock?',
          answer:
            'Yes. Stock received, sold, returned, and adjusted is tracked per product, and low stock and out of stock items are surfaced for attention.',
        },
        {
          question: 'Can I record different payment methods?',
          answer:
            'Yes. Cash, transfer, POS or card payments, and credit are supported, including split payments across methods.',
        },
        {
          question: 'What happens when a sale needs correction?',
          answer:
            'Corrections are controlled and traceable. The original record is preserved, the correction carries a reason, and consequential changes follow your approval rules. Mistakes are corrected without pretending they never happened.',
        },
        {
          question: 'Can Sabi Shop work for more than one business?',
          answer:
            "Each business keeps its own separate records. Sabi Shop is built so one business's data is never mixed with another's.",
        },
        {
          question: 'How do I get started?',
          answer:
            'Choose Get Started to open the working product. Account setup and onboarding are being finalized, so today the button opens the product workspace directly.',
        },
      ],
    },
    finalCta: {
      title: 'Ready to see your shop clearly?',
      lead: 'Start recording your shop activity in one connected picture.',
      button: 'Get Started',
    },
    footer: {
      tagline:
        'Sabi Shop helps small shops know what happened, what they have, and where the money went.',
      builtFor: 'Built for small retail shops in Nigeria and emerging retail markets.',
    },
  },
  pcm: {
    nav: {
      howItWorks: 'How e dey work',
      whatItCovers: 'Wetin e cover',
      faq: 'FAQ',
      signIn: 'Sign in',
      getStarted: 'Get Started',
    },
    hero: {
      eyebrow: 'How shop dey run for small retail business dem',
      titleLine1: 'Know wetin dey happen',
      titleLine2: 'inside your shop.',
      subtitle:
        'Sabi Shop dey record sales, goods, money, and customer gbese together, so you go fit see wetin happen, wetin remain, and wetin need your eye.',
      ctaPrimary: 'Get Started',
      ctaSecondary: 'See how e dey work',
      proof:
        'Dem build am for real market condition: different boys/staff, cash and transfer, gbese, price negotiation, and network wey dey cut.',
    },
    simulator: {
      title: 'New sale',
      offlineBadge: 'Offline · saved on device',
      onlineBadge: 'Online · e don sync',
      customer: 'Customer · Ada Obi · credit allowed',
      toggleNetwork: 'Simulate offline',
      addItem: 'Add item',
      completeSale: 'Complete sale',
      saleCompleted: 'Sale don complete · Receipt don ready',
      reset: 'Reset demo',
      total: 'Total',
      caption: 'Representative view of the Sabi Shop sale workspace with example data.',
    },
    problem: {
      title: 'The shop does not pause for paperwork.',
      lead: 'Small retail shop dey run all day, whether person write am down for book or not.',
      lines: [
        'Sales dey happen morning till night, for counter and for phone call.',
        'Goods dey comot any time customer buy, delivery enter, or person return market.',
        'Customer dey take goods on gbese and pay back when dem hand clean.',
        'Money dey enter as cash, transfer, and POS, and e dey comot for market expense and restocking.',
        'Boys dey hold the shop dey sell market even when oga no dey shop.',
      ],
      transition:
        'When market close for evening, you still need to know wetin happen. Sabi Shop dey pack everything enter clear record as e dey happen, so you no go dey rack brain remember wetin happen last week.',
    },
    outcomesTitle: 'Know your shop.',
    outcomesLead: 'Five things wey shop owner must know clearly, wey join together for one place.',
    outcomes: [
      {
        icon: Receipt,
        title: 'Know your sales',
        detail:
          'Wetin sell, when e sell, na how much, and who write am down. Every sale get proof.',
        metricBadge: '₦45,000 Transfer confirmed',
      },
      {
        icon: Package,
        title: 'Know your stock',
        detail: 'Wetin you get for shop, wetin enter, wetin comot, and wetin go finish soon.',
        metricBadge: '3 Spark Plugs remain',
      },
      {
        icon: CurrencyNgn,
        title: 'Know your money',
        detail:
          'Cash, transfer, and POS card separate, with shop expenses and withdrawals well recorded.',
        metricBadge: 'Cash tally complete',
      },
      {
        icon: HandCoins,
        title: 'Know who owes you',
        detail: 'Customer gbese and payments recorded well, so debt no go be guess work.',
        metricBadge: '₦18,000 Gbese due Friday',
      },
      {
        icon: BellRinging,
        title: 'Know what needs attention',
        detail:
          'Cash differences, approvals, returns, and low stock dey show make you check am immediately.',
        metricBadge: '1 Approval pending',
      },
    ],
    tagline: {
      statement: 'Run the shop. See the business.',
      words: ['Run', 'the', 'shop.', 'See', 'the', 'business.'],
    },
    howItWorks: {
      title: 'How Sabi Shop works',
      lead: 'Three simple steps: record wetin happen, keep the pieces linked, and see wetin need your eye.',
      steps: [
        {
          number: '1',
          title: 'Record the work',
          detail:
            'Sales, receipts, customer debt repayments, and cash movements recorded as they happen, online or offline.',
        },
        {
          number: '2',
          title: 'Keep the picture connected',
          detail:
            'One sale dey touch stock, money, and gbese at once. Everything get person wey do am and time.',
        },
        {
          number: '3',
          title: 'See what needs attention',
          detail:
            'Notice goods wey dey finish, customer gbese, cash variance, and wetin need oga approval.',
        },
      ],
    },
    productAreas: {
      title: 'One system for the whole shop',
      lead: 'Different screen for wetin each person dey do, but na the same truth dem all dey see.',
      items: [
        {
          icon: Storefront,
          title: 'Sell',
          detail: 'Sell market sharp sharp, with discount and split payment well handled.',
        },
        {
          icon: Package,
          title: 'Products & Stock',
          detail: 'Follow up wetin enter, wetin comot, and wetin remain inside store.',
        },
        {
          icon: Users,
          title: 'Customers & Credit',
          detail: 'Know who owe you gbese and wetin customer don pay back.',
        },
        {
          icon: Truck,
          title: 'Suppliers & Purchasing',
          detail: 'Keep supplier purchase, payment, and incoming goods linked together.',
        },
        {
          icon: Wallet,
          title: 'Money',
          detail: 'See cash, transfer, expenses, and cash reconciliation for one place.',
        },
        {
          icon: Clock,
          title: 'Activity',
          detail: 'Every action wey happen for shop dey leave clear footprint.',
        },
        {
          icon: ChartLine,
          title: 'Management',
          detail: 'Check shop performance, exceptions, and wetin need oga decision.',
        },
      ],
    },
    trust: {
      title: 'Trustworthy where it matters',
      lead: 'Dem build am make you get rest of mind: clear authority, honest corrections, and strong record.',
      items: [
        {
          icon: Fingerprint,
          title: 'Traceable activity',
          detail: 'Important actions dey record who do am and when, so questions go get answer.',
        },
        {
          icon: NotePencil,
          title: 'Controlled corrections',
          detail:
            'Mistake fit correct without pretending say nothing happen. Corrections keep reason and history.',
        },
        {
          icon: ShieldCheck,
          title: 'Clear authority',
          detail:
            'Price override, credit, and big corrections must follow the permission wey you set.',
        },
        {
          icon: WifiSlash,
          title: 'Offline support',
          detail:
            'Continue selling even when network cut. Work dey save for phone and sync when network come back.',
        },
      ],
    },
    audience: {
      title: 'Built for small shops',
      lead: 'Dem build am for small shop owners wey want to see everything without standing for counter all day.',
      examples: [
        'Retail shops',
        'Motor & motorcycle parts shops',
        'Equipment & machine shops',
        'Hardware, electrical & tool shops',
        'Physical goods retail shops',
      ],
      closing:
        'If you dey sell market for counter, buy from suppliers, take cash and transfer, and give trusted customers credit, Sabi Shop na for you.',
    },
    faq: {
      title: 'Questions shop owners ask',
      lead: 'Clear answer to how Sabi Shop dey work for your daily market.',
      items: [
        {
          question: 'What is Sabi Shop?',
          answer:
            'Sabi Shop na lightweight app for retail shop owners. E dey record sales, goods, money, customer gbese, and boys activity, and e dey show you clear picture of your business.',
        },
        {
          question: 'Who is Sabi Shop for?',
          answer:
            'Small physical goods retail shops (spare parts, tools, electricals, provisions, building materials) where oga need to know wetin dey happen even when e travel.',
        },
        {
          question: 'Does it work offline?',
          answer:
            'Yes. Supported sales and daily work dey continue when network cut. When network come back, everything dey sync. We no dey wipe work silently.',
        },
        {
          question: 'Can my staff use it?',
          answer:
            'Yes. The selling screen fast for sales boys. Each person dey see only wetin e get right to see. Boys dey sell and collect money, while oga dey approve special matters.',
        },
        {
          question: 'Can I track customer credit?',
          answer:
            'Yes. Credit sales, repayments, and outstanding gbese get proper record per customer, with credit limit wey you set.',
        },
        {
          question: 'Can I track stock?',
          answer:
            'Yes. Goods wey enter, sell, return, or adjust get proper tracking per item, and low stock dey show for screen sharp sharp.',
        },
        {
          question: 'Can I record different payment methods?',
          answer:
            'Yes. Cash, transfer, POS card, and credit dey work, even split payment (e.g. half cash, half transfer).',
        },
        {
          question: 'What happens when a sale needs correction?',
          answer:
            'Correction get control and clear trail. The original record dey safe, correction get reason, and nothing dey delete by magic.',
        },
        {
          question: 'Can Sabi Shop work for more than one business?',
          answer:
            'Each business get separate records. Sabi Shop no dey mix one shop data with another shop data at all.',
        },
        {
          question: 'How do I get started?',
          answer:
            'Click Get Started make you open the product workspace directly make you test am now.',
        },
      ],
    },
    finalCta: {
      title: 'Ready to see your shop clearly?',
      lead: 'Start recording your shop activity in one connected picture.',
      button: 'Get Started',
    },
    footer: {
      tagline:
        'Sabi Shop dey help small shops know wetin happen, wetin dem get, and where money enter.',
      builtFor: 'Built for small retail shops in Nigeria and emerging retail markets.',
    },
  },
}
