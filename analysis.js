const RULES = [
  { key: "fee", category: "Fee", title: "Fee or charge detected", severity: "Important",
    regex: /\b(processing|origination|administrative|application|service|account|insurance|tuition|documentation)\s+(?:fee|charge|cost)s?\b|\bfees?\b|\bcharges?\b|\bcommission\b/i,
    explanation: "This document refers to a fee or charge connected to the loan. Check the amount, when it is charged, and whether it is included in the amount you receive.",
    why: "Fees can increase the upfront or total cost of borrowing even when the headline loan amount stays the same.",
    question: "What is the exact fee amount, when is it charged, and is it refundable if the loan is cancelled?" },
  { key: "interest", category: "Interest", title: "Interest or rate detected", severity: "Important",
    regex: /\b(interest|apr|annual percentage|fixed rate|variable rate|reference rate|base rate)\b/i,
    explanation: "This document refers to interest or an interest rate. Confirm the starting rate, how it is calculated, and whether the lender can change it later.",
    why: "A rate change can affect future payments and the total amount repaid.",
    question: "Is the rate fixed or variable, and is there a cap on how much it can change?" },
  { key: "repayment", category: "Repayment", title: "Repayment terms detected", severity: "Attention",
    regex: /\b(repayment|repay|installments?|instalments?|monthly payment|due date|maturity|loan term|grace period|moratorium|deferment)\b/i,
    explanation: "This document contains repayment timing or schedule language. Check when payments begin, how often they are due, and how long the term lasts.",
    why: "The repayment schedule determines when the loan starts affecting your budget and cash flow.",
    question: "When exactly do payments begin, and how long is the repayment term?" },
  { key: "penalty", category: "Penalty", title: "Late payment or default detected", severity: "Important",
    regex: /\b(late payment|late fee|penalt(?:y|ies)|default|missed payment|overdue|arrears|cure period)\b/i,
    explanation: "This document describes a late-payment, default, or penalty condition. Check the trigger, amount, notice period, and what happens after a missed payment.",
    why: "A missed payment can add costs and may trigger additional consequences beyond the payment itself.",
    question: "What triggers the penalty, and what notice or cure period applies before it takes effect?" },
  { key: "earlyrepay", category: "Condition", title: "Early repayment condition detected", severity: "Attention",
    regex: /\b(prepayment|pre-payment|early repayment|early payoff|pay off|foreclosure|settle early)\b/i,
    explanation: "This document refers to paying the loan early. Check whether a fee applies, how the payoff amount is calculated, and how to request a payoff statement.",
    why: "An early-repayment condition can change the cost of refinancing or clearing the loan ahead of schedule.",
    question: "What exact fee, if any, would apply if I repay the loan early?" },
  { key: "guarantor", category: "Obligation", title: "Guarantor or co-signer detected", severity: "Important",
    regex: /\b(guarantor|co[- ]?signer|cosigner|surety|collateral|security interest|secured by)\b/i,
    explanation: "This document refers to another person or asset supporting the loan. Check who is responsible after a missed payment and when that responsibility ends.",
    why: "A guarantor or co-signer may remain financially responsible if the borrower cannot pay.",
    question: "What steps would release the guarantor or co-signer, and will that release be provided in writing?" },
  { key: "currency", category: "Condition", title: "Currency or exchange terms detected", severity: "Information",
    regex: /\b(currency|exchange rate|foreign exchange|indian rupees?|rupees?|dollars?|euros?|pounds?)\b|[₹\$€£]/i,
    explanation: "This document specifies or discusses a currency. Confirm the currency of disbursement, repayment, exchange-rate method, and any conversion fees.",
    why: "Currency conversion can change the amount you need to repay when your income and loan are in different currencies.",
    question: "Which exchange rate and fees would apply if I repay from another currency?" },
];

export function cleanText(text){ if(!text) return ""; return text.replace(/\0/g," ").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim(); }

function makeSnippet(text, match){ const idx=match.index; const start=Math.max(0,idx-100); const end=Math.min(text.length,idx+match[0].length+180); let snippet=text.slice(start,end).replace(/\s+/g," ").trim(); if(start>0) snippet="…"+snippet; if(end<text.length) snippet=snippet+"…"; return snippet; }

export function analyzeText(text){ const findings=[]; if(!text||!text.trim()) return findings; let order=0; for(const rule of RULES){ const match=rule.regex.exec(text); if(match){ const snippet=makeSnippet(text,match); findings.push({ id:`upload-${rule.key}-${order}`, category:rule.category, title:rule.title, severity:rule.severity, clause:snippet, explanation:rule.explanation, impact:"See document for details", why:rule.why, question:rule.question, location:"Extracted document text", highlight:match[0].trim(), page:null }); order++; } } return findings; }

const EXPECTED_ITEMS = [
  { key:"principal", label:"Principal amount", regex:/(?:principal|loan amount|sanctioned amount|borrowed amount|₹\s*[\d,]+|\$[\d,]+|€[\d,]+|£[\d,]+)/i, category:"Fees" },
  { key:"rate", label:"Interest rate", regex:/\b(?:interest rate|annual interest|apr|[\d.]+%\s*(?:per annum|annually|p\.a))\b/i, category:"Interest" },
  { key:"rateType", label:"Whether the rate is fixed or variable", regex:/\b(fixed rate|variable rate|floating rate|fixed or variable)\b/i, category:"Interest" },
  { key:"refRate", label:"Reference rate or rate-change method", regex:/\b(reference rate|base rate|benchmark|margin|spread|adjusted every|may be adjusted)\b/i, category:"Interest" },
  { key:"procFee", label:"Processing or origination fee amount", regex:/\b(?:processing fee|origination fee|administrative fee|application fee)\b[^.]{0,40}?(\d+(?:\.\d+)?%|₹\s*[\d,]+|\$[\d,]+)/i, category:"Fee" },
  { key:"recurFee", label:"Other recurring account charges", regex:/\b(?:annual|recurring|monthly|quarterly)\s+(?:account|administration|service)\s+(?:fee|charge)\b/i, category:"Fee" },
  { key:"repayStart", label:"Repayment start date", regex:/\b(?:repayment begins|repayment starts|first payment|payments? (?:begin|start|are due)|due date)\b/i, category:"Repayment" },
  { key:"grace", label:"Grace period or deferment terms", regex:/\b(?:grace period|moratorium|deferment|forbearance)\b/i, category:"Repayment" },
  { key:"freq", label:"Repayment frequency", regex:/\b(?:monthly|quarterly|weekly|installments?|instalments?|every month|each month)\b/i, category:"Repayment" },
  { key:"term", label:"Loan term", regex:/\b(?:loan term|term of|over (?:a )?(\d+)\s*months|(\d+)\s*monthly payments|repayment period|maturity)\b/i, category:"Repayment" },
  { key:"lateFee", label:"Late-payment fee and trigger", regex:/\b(?:late payment fee|late fee|penalt(?:y|ies))\b/i, category:"Penalty" },
  { key:"default", label:"Default notice/cure period", regex:/\b(?:default|cure period|notice period|missed payment|overdue)\b/i, category:"Penalty" },
  { key:"earlyFee", label:"Early-repayment fee", regex:/\b(?:early repayment|prepayment|pre-payment|early payoff|foreclosure)\b/i, category:"Condition" },
  { key:"guarRelease", label:"Guarantor release condition", regex:/\b(?:guarantor|co[- ]?signer|cosigner|surety)\b/i, category:"Obligation" },
  { key:"currency", label:"Currency of disbursement and repayment", regex:/\b(?:currency|indian rupees?|rupees?|dollars?|euros?|pounds?)\b|[₹\$€£]/i, category:"Condition" }
];
