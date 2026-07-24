import { getSurveyQuestionLabel } from "../data/clientSurveySchema";

function titleToKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function existingItemToRequirementKeys(item) {
  const haystack = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase();
  const keys = new Set();

  if (haystack.includes("1099-int")) {
    keys.add("income-1099-int");
  }
  if (haystack.includes("w-2")) {
    keys.add("income-w2");
  }
  if (haystack.includes("dependent care") && haystack.includes("provider")) {
    keys.add("dependent-care-provider-details");
  }
  if (haystack.includes("dependent care") && haystack.includes("amount")) {
    keys.add("dependent-care-total-paid");
  }
  if (haystack.includes("form 1098") || haystack.includes("mortgage interest")) {
    keys.add("housing-form-1098");
  }
  if (haystack.includes("donation") || haystack.includes("charitable")) {
    keys.add("deductions-donation-receipts");
  }
  if (haystack.includes("1099-nec")) {
    keys.add("business-1099-nec");
  }
  if (haystack.includes("business expenses")) {
    keys.add("business-expense-summary");
  }
  if (haystack.includes("dependent")) {
    keys.add("personal-dependent-information");
  }

  return keys;
}

export function buildExistingRequirementKeys(items) {
  const keys = new Set();
  items.forEach((item) => {
    existingItemToRequirementKeys(item).forEach((key) => keys.add(key));
  });
  return keys;
}

function buildChecklistItem({
  client,
  title,
  explanation,
  category,
  relatedReturnSection,
  relatedSurveyQuestion,
  actionType,
  actionLabel,
  required = true,
  requirementKey
}) {
  return {
    id: `survey-${client.id}-${requirementKey || titleToKey(title)}`,
    requirementKey: requirementKey || titleToKey(title),
    title,
    description: explanation,
    category,
    status: "Not Started",
    owner: client.name,
    dueDate: client.deadline,
    required,
    visibility: "Client",
    relatedSurveyQuestion,
    relatedReturnSection,
    actionType,
    actionLabel,
    source: "survey"
  };
}

function addItem(collection, existingKeys, item) {
  if (existingKeys.has(item.requirementKey)) {
    return;
  }

  existingKeys.add(item.requirementKey);
  collection.push(item);
}

export function generateChecklistFromSurvey({
  answers,
  client,
  existingRequirementKeys,
  manualItems = [],
  clarificationFlags = [],
  previousGeneratedItems = []
}) {
  const items = [];
  const keys = new Set(existingRequirementKeys);

  if (answers.workedForEmployers === "yes") {
    const employerCount = answers.employerCount === "3+" ? 3 : Number(answers.employerCount || 1);
    for (let index = 0; index < employerCount; index += 1) {
      addItem(
        items,
        keys,
        buildChecklistItem({
          client,
          title: employerCount === 1 ? "Upload W-2" : `Upload W-2 from Employer ${index + 1}`,
          explanation: "We need each W-2 to confirm wages and withholding before preparation can continue.",
          category: "Employment and income",
          relatedReturnSection: "Income",
          relatedSurveyQuestion: "workedForEmployers",
          actionType: "upload",
          actionLabel: "Upload document",
          requirementKey: employerCount === 1 ? "income-w2" : `income-w2-${index + 1}`
        })
      );
    }
  }

  if (answers.bankInterest === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Upload all 1099-INT forms",
        explanation: "Bank-interest documents help us confirm taxable interest reported for the year.",
        category: "Investments and banking",
        relatedReturnSection: "Income",
        relatedSurveyQuestion: "bankInterest",
        actionType: "upload",
        actionLabel: "Upload document",
        requirementKey: "income-1099-int"
      })
    );
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Confirm number of interest-bearing accounts",
        explanation: "We use the account count to make sure all 1099-INT forms are present.",
        category: "Investments and banking",
        relatedReturnSection: "Income",
        relatedSurveyQuestion: "interestAccountCount",
        actionType: "answer",
        actionLabel: "Review answers",
        requirementKey: "income-interest-account-count"
      })
    );
  }

  if (answers.hasDependents === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Confirm dependent information",
        explanation: "We need the names and counts for everyone you are claiming this year.",
        category: "Personal and household",
        relatedReturnSection: "Credits",
        relatedSurveyQuestion: "dependentCount",
        actionType: "answer",
        actionLabel: "Review answers",
        requirementKey: "personal-dependent-information"
      })
    );
  }

  if (answers.paidDependentCare === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Provide dependent-care provider details",
        explanation: "Include the provider name and tax ID so we can complete the care credit review.",
        category: "Personal and household",
        relatedReturnSection: "Credits",
        relatedSurveyQuestion: "hasCareProviderTaxId",
        actionType: "answer",
        actionLabel: "Review answers",
        requirementKey: "dependent-care-provider-details"
      })
    );
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Confirm total dependent-care amount paid",
        explanation: "We need the total amount paid during the year for child or dependent care.",
        category: "Personal and household",
        relatedReturnSection: "Credits",
        relatedSurveyQuestion: "paidDependentCare",
        actionType: "answer",
        actionLabel: "Review answers",
        requirementKey: "dependent-care-total-paid"
      })
    );
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Upload dependent-care statement if available",
        explanation: "A provider statement helps the firm verify your care expenses quickly.",
        category: "Personal and household",
        relatedReturnSection: "Credits",
        relatedSurveyQuestion: "paidDependentCare",
        actionType: "upload",
        actionLabel: "Upload document",
        required: false,
        requirementKey: "dependent-care-statement"
      })
    );
  }

  if (answers.mortgageInterest === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Upload Form 1098",
        explanation: "Mortgage-interest reporting is usually supported by Form 1098 from your lender.",
        category: "Housing, education, and deductions",
        relatedReturnSection: "Deductions",
        relatedSurveyQuestion: "mortgageInterest",
        actionType: "upload",
        actionLabel: "Upload document",
        requirementKey: "housing-form-1098"
      })
    );
  }

  if (answers.charitableDonations === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Upload donation receipts or contribution summary",
        explanation: "We need charitable support before claiming contribution deductions.",
        category: "Housing, education, and deductions",
        relatedReturnSection: "Deductions",
        relatedSurveyQuestion: "charitableDonations",
        actionType: "upload",
        actionLabel: "Upload document",
        requirementKey: "deductions-donation-receipts"
      })
    );
  }

  if (answers.received1099Nec === "yes" || answers.contractorIncome === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Upload all 1099-NEC forms",
        explanation: "Independent-work income should be supported before the return moves into review.",
        category: "Business and other situations",
        relatedReturnSection: "Income",
        relatedSurveyQuestion: "received1099Nec",
        actionType: "upload",
        actionLabel: "Upload document",
        requirementKey: "business-1099-nec"
      })
    );
  }

  if (answers.businessExpenses === "yes" || answers.operatedBusiness === "yes") {
    addItem(
      items,
      keys,
      buildChecklistItem({
        client,
        title: "Upload or summarize business expenses",
        explanation: "A simple expense summary is enough for the firm to start the expense review.",
        category: "Business and other situations",
        relatedReturnSection: "Deductions",
        relatedSurveyQuestion: "businessExpenses",
        actionType: "upload",
        actionLabel: "Upload document",
        requirementKey: "business-expense-summary"
      })
    );
  }

  const preservedItems = previousGeneratedItems
    .filter((item) => item.status === "Completed" && !keys.has(item.requirementKey))
    .map((item) => ({
      ...item,
      status: "Needs Review",
      description: `${item.description} Survey answers changed, so the firm should confirm whether this evidence is still required.`
    }));

  const clarificationItems = clarificationFlags.map((flag) => ({
    id: `survey-${client.id}-clarify-${flag.questionId}`,
    requirementKey: `clarify-${flag.questionId}`,
    title: `Clarify: ${flag.questionLabel}`,
    description: flag.note || "The preparer asked for a follow-up answer before continuing review.",
    category: "Review follow-up",
    status: "Needs Review",
    owner: client.name,
    dueDate: client.deadline,
    required: true,
    visibility: "Client",
    relatedSurveyQuestion: flag.questionId,
    relatedReturnSection: "Return overview",
    actionType: "answer",
    actionLabel: "Review answers",
    source: "survey"
  }));

  const manualChecklistItems = manualItems.map((item) => ({
    ...item,
    id: item.id || `manual-${client.id}-${titleToKey(item.title)}`,
    requirementKey: item.requirementKey || `manual-${titleToKey(item.title)}`,
    status: item.status || "Not Started",
    owner: item.owner || client.name,
    dueDate: item.dueDate || client.deadline,
    visibility: "Client",
    source: "manual"
  }));

  const generatedItems = [...items, ...preservedItems, ...clarificationItems, ...manualChecklistItems];

  const summary = [];
  if (answers.employerCount) {
    summary.push(`${answers.employerCount} employer${answers.employerCount === "1" ? "" : "s"}`);
  }
  if (answers.bankInterest === "yes") {
    summary.push("bank interest");
  }
  if (answers.dependentCount) {
    summary.push(`${answers.dependentCount} dependent${answers.dependentCount === "1" ? "" : "s"}`);
  }
  if (answers.paidDependentCare === "yes") {
    summary.push("dependent-care expenses");
  }
  if (answers.contractorIncome !== "yes" && answers.operatedBusiness !== "yes") {
    summary.push("no self-employment income");
  }

  const requirements = generatedItems
    .filter((item) => item.source !== "manual" && !item.requirementKey.startsWith("clarify-"))
    .map((item) => item.title);

  return {
    items: generatedItems,
    summary,
    requirements,
    answeredQuestions: Object.entries(answers)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
      .map(([questionId, value]) => ({
        questionId,
        questionLabel: getSurveyQuestionLabel(questionId),
        value
      }))
  };
}
