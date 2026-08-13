/**
 * MockAssistantProvider — rule-based, keyword-matched canned responses.
 *
 * IMPORTANT (academic integrity / honesty): this is NOT a real language
 * model. It does not call any AI API. It matches keywords in the user's
 * message against a set of intents and returns one of several pre-written
 * responses for that intent, with light templating (name, numbers from
 * mock data). This exists so the Assistant screen is demoable without a
 * real backend, the same way payments use a SandboxPaymentProvider instead
 * of a real payment gateway.
 *
 * Documented honestly in docs/PROJECT_AUDIT.md and code comments — do not
 * present this as "real AI" in project documentation. If/when a real LLM
 * integration is added, it should implement the same `AssistantProvider`
 * interface below so the chat UI doesn't need to change.
 */

export interface AssistantContext {
  name?: string;
}

export interface AssistantProvider {
  getReply(message: string, context: AssistantContext): string;
}

interface Intent {
  id: string;
  keywords: string[];
  responses: (ctx: AssistantContext) => string[];
}

function firstName(ctx: AssistantContext): string {
  return ctx.name?.split(" ")[0] || "there";
}

const INTENTS: Intent[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "yo", "sup"],
    responses: (ctx) => [
      `Hey ${firstName(ctx)}! What would you like to know about your GhanaPay account today?`,
      `Hello! I can help with budgeting, spending summaries, bills, and more — what's on your mind?`,
      `Hi there 👋 Ask me about your balance, recent spending, or savings goals to get started.`,
    ],
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "appreciate", "thx"],
    responses: () => [
      "You're welcome! Let me know if there's anything else you'd like to check.",
      "Happy to help — feel free to ask me anything else about your account.",
      "Anytime! I'm here whenever you need a hand with your finances.",
    ],
  },
  {
    id: "balance",
    keywords: ["balance", "how much do i have", "wallet balance", "current balance"],
    responses: () => [
      "Your current wallet balance is ₵4,250.00 across your GhanaPay wallet. You also have ₵1,200.00 on MTN Mobile Money and ₵8,500.00 linked from Ecobank.",
      "Looking at your wallet: ₵4,250.00 available. Want a breakdown by linked account, or your recent transaction history instead?",
    ],
  },
  {
    id: "budget",
    keywords: ["budget", "budget plan", "spending plan", "how should i spend", "monthly plan"],
    responses: (ctx) => [
      `Based on your recent spending, here's a simple 50/30/20 starting point, ${firstName(ctx)}: about 50% toward essentials (rent, utilities, transport), 30% toward lifestyle (food, shopping), and 20% into savings. Your biggest category right now is Food & Dining at 34% of spend — that's a good place to look for easy wins if you want to save more.`,
      "A reasonable budget plan: cap discretionary categories (Shopping, Dining) at around 25–30% combined, keep Utilities and Transport steady since they're less flexible, and aim to move at least 15–20% of income into savings each month before you spend the rest.",
    ],
  },
  {
    id: "spending_summary",
    keywords: ["spending", "expenses", "summarize", "summary", "how much did i spend", "spent this month"],
    responses: () => [
      "This month your spending broke down roughly as: Food & Dining 34% (₵680), Utilities 22% (₵440), Transport 18% (₵360), Shopping 16% (₵320), and Other 10% (₵200). Total spend for the period was around ₵2,000.",
      "Your top 3 spending categories this period were Food & Dining, Utilities, and Transport — together that's about 74% of your total spend. Want tips on trimming any one of these?",
    ],
  },
  {
    id: "savings",
    keywords: ["savings", "saving goal", "save money", "how am i doing on savings"],
    responses: (ctx) => [
      `Your spending this week (₵680) was actually lower than last week (₵720), ${firstName(ctx)} — that's a good trend. Keep discretionary spending under control and you're on track.`,
      "You're making steady progress — weekly spend has trended down over the last few weeks. To save faster, consider setting aside a fixed amount right after any Salary Credit lands, before it mixes into everyday spending.",
    ],
  },
  {
    id: "utilities",
    keywords: ["utility", "utilities", "ecg", "electricity", "water bill", "gwcl", "cut bills", "reduce bills"],
    responses: () => [
      "A few practical ways to cut utility costs: switch to LED bulbs, unplug idle chargers/appliances, and check for prepaid ECG token usage patterns — buying tokens in smaller, more frequent amounts can help you track and reduce waste. Water usage is also worth checking for leaks if your GWCL bill has crept up.",
      "Utilities are 22% of your spend this month. Common wins: prepaid metering to avoid estimated-bill overcharges, and shifting heavy appliance use (like ironing or water heating) to off-peak times where tariffs are lower.",
    ],
  },
  {
    id: "transfer",
    keywords: ["send money", "transfer", "pay someone", "send to"],
    responses: () => [
      "To send money, head to Send Money from the sidebar, enter the recipient's phone number or GhanaPay tag, the amount, and confirm. Transfers to other GhanaPay wallets are typically instant.",
      "You can transfer funds via the Send Money page. Double-check the recipient details before confirming — transaction references are generated automatically for your records.",
    ],
  },
  {
    id: "airtime",
    keywords: ["airtime", "top up", "buy credit", "recharge"],
    responses: () => [
      "You can buy airtime from the Airtime page — select the network (MTN, Telecel, AirtelTigo), enter the phone number and amount, and confirm. It'll show up in your transaction history right after.",
    ],
  },
  {
    id: "bills",
    keywords: ["bill payment", "pay bill", "dstv", "electricity bill", "pay my bill"],
    responses: () => [
      "Bill payments are on the Bill Payments page — choose the biller (electricity, water, TV, etc.), enter your account/meter number, and confirm the amount. You'll get a reference number for the payment.",
    ],
  },
  {
    id: "kyc",
    keywords: ["kyc", "verify", "verification", "ghana card", "identity"],
    responses: () => [
      "Your KYC status shows Tier 2, verified. Ghana Card and Selfie steps are marked complete; Address verification is still pending. Head to the KYC page to finish that step and unlock higher transaction limits.",
    ],
  },
  {
    id: "fees_limits",
    keywords: ["fee", "fees", "limit", "limits", "daily limit", "how much can i send"],
    responses: () => [
      "Your current wallet limits are: ₵5,000 daily, ₵20,000 weekly, ₵80,000 monthly. Fees vary by transaction type — GhanaPay-to-GhanaPay transfers are typically free, while bank transfers carry a small fee shown before you confirm.",
    ],
  },
  {
    id: "scheduled",
    keywords: ["scheduled payment", "recurring", "automatic payment", "schedule a payment"],
    responses: () => [
      "You can set up recurring payments from the Scheduled Payments page — pick the recipient or biller, amount, and frequency. These run automatically in the background, so you don't need to keep the app open.",
    ],
  },
  {
    id: "help",
    keywords: ["what can you do", "help", "commands", "how do you work"],
    responses: () => [
      "I can help with: your wallet balance, spending summaries, budgeting suggestions, savings progress, how to send money or buy airtime, bill payments, KYC status, and your account limits. Just ask in plain language!",
    ],
  },
];

const FALLBACK_RESPONSES = (ctx: AssistantContext) => [
  `I'm not sure I caught that, ${firstName(ctx)} — I can help with things like your balance, spending summary, budgeting tips, or how to send money and pay bills. Could you rephrase, or try one of the suggested prompts?`,
  "I don't have an answer for that one yet. Try asking about your balance, recent spending, savings goals, or how to make a payment.",
];

function scoreIntent(message: string, intent: Intent): number {
  const lower = message.toLowerCase();
  return intent.keywords.reduce((score, kw) => (lower.includes(kw) ? score + kw.length : score), 0);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MockAssistantProvider implements AssistantProvider {
  getReply(message: string, context: AssistantContext): string {
    let best: { intent: Intent; score: number } | null = null;
    for (const intent of INTENTS) {
      const score = scoreIntent(message, intent);
      if (score > 0 && (!best || score > best.score)) {
        best = { intent, score };
      }
    }
    if (best) {
      return pick(best.intent.responses(context));
    }
    return pick(FALLBACK_RESPONSES(context));
  }
}

export const assistantProvider: AssistantProvider = new MockAssistantProvider();
