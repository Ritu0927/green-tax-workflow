export const clientSurveySections = [
  {
    id: "personal-household",
    title: "Personal and household",
    description: "Tell us about household changes that may affect this return.",
    questions: [
      { id: "addressChanged", label: "Did your home address change during the tax year?", type: "yes-no" },
      { id: "maritalStatusChanged", label: "Did your marital status change?", type: "yes-no" },
      { id: "hasDependents", label: "Do you have any dependents?", type: "yes-no" },
      {
        id: "dependentCount",
        label: "How many dependents do you have?",
        type: "single-select",
        options: ["1", "2", "3+"],
        showWhen: (answers) => answers.hasDependents === "yes"
      },
      { id: "paidDependentCare", label: "Did you pay for child or dependent care?", type: "yes-no" },
      {
        id: "dependentAddedRemoved",
        label: "Did you add or remove a dependent this year?",
        type: "yes-no",
        showWhen: (answers) => answers.hasDependents === "yes"
      },
      {
        id: "hasCareProviderTaxId",
        label: "Do you have the care provider's name and tax ID?",
        type: "yes-no",
        showWhen: (answers) => answers.paidDependentCare === "yes"
      }
    ]
  },
  {
    id: "employment-income",
    title: "Employment and income",
    description: "A short intake for jobs, contractor work, and other income sources.",
    questions: [
      { id: "workedForEmployers", label: "Did you work for one or more employers?", type: "yes-no" },
      {
        id: "employerCount",
        label: "How many employers did you have?",
        type: "single-select",
        options: ["1", "2", "3+"],
        showWhen: (answers) => answers.workedForEmployers === "yes"
      },
      { id: "contractorIncome", label: "Did you receive freelance or contractor income?", type: "yes-no" },
      { id: "unemploymentIncome", label: "Did you receive unemployment compensation?", type: "yes-no" },
      { id: "retirementIncome", label: "Did you receive retirement or pension income?", type: "yes-no" }
    ]
  },
  {
    id: "investments-banking",
    title: "Investments and banking",
    description: "Let us know about interest, dividends, and investment activity.",
    questions: [
      { id: "bankInterest", label: "Did you earn bank interest?", type: "yes-no" },
      {
        id: "interestAccountCount",
        label: "How many banks or interest-bearing accounts did you have?",
        type: "single-select",
        options: ["1", "2", "3+"],
        showWhen: (answers) => answers.bankInterest === "yes"
      },
      { id: "dividends", label: "Did you receive dividends?", type: "yes-no" },
      { id: "soldInvestments", label: "Did you sell stocks, funds, cryptocurrency, or other investments?", type: "yes-no" },
      { id: "foreignAccounts", label: "Did you hold any foreign financial accounts?", type: "yes-no" }
    ]
  },
  {
    id: "housing-education-deductions",
    title: "Housing, education, and deductions",
    description: "Answer only the items that changed or apply this year.",
    questions: [
      { id: "ownedHome", label: "Did you own a home?", type: "yes-no" },
      {
        id: "mortgageInterest",
        label: "Did you pay mortgage interest?",
        type: "yes-no",
        showWhen: (answers) => answers.ownedHome === "yes"
      },
      { id: "educationExpenses", label: "Did you pay tuition or education expenses?", type: "yes-no" },
      { id: "charitableDonations", label: "Did you make charitable donations?", type: "yes-no" },
      { id: "medicalExpenses", label: "Did you have significant medical expenses?", type: "yes-no" }
    ]
  },
  {
    id: "business-other",
    title: "Business and other situations",
    description: "A narrow check for business activity, 1099 income, and rental work.",
    questions: [
      { id: "operatedBusiness", label: "Did you operate a business?", type: "yes-no" },
      {
        id: "received1099Nec",
        label: "Did you receive 1099-NEC income?",
        type: "yes-no",
        showWhen: (answers) => answers.contractorIncome === "yes" || answers.operatedBusiness === "yes"
      },
      {
        id: "businessExpenses",
        label: "Did you have business expenses?",
        type: "yes-no",
        showWhen: (answers) => answers.contractorIncome === "yes" || answers.operatedBusiness === "yes"
      },
      {
        id: "businessVehicle",
        label: "Did you use a vehicle for business?",
        type: "yes-no",
        showWhen: (answers) => answers.operatedBusiness === "yes"
      },
      { id: "rentalIncome", label: "Did you receive rental income?", type: "yes-no" },
      {
        id: "businessRecordsReady",
        label: "Are income and expense records available?",
        type: "yes-no",
        showWhen: (answers) => answers.operatedBusiness === "yes" || answers.contractorIncome === "yes"
      }
    ]
  }
];

export function getVisibleQuestions(section, answers) {
  return section.questions.filter((question) => (question.showWhen ? question.showWhen(answers) : true));
}

export function countCompletedSurveySections(answers) {
  return clientSurveySections.filter((section) => {
    const visibleQuestions = getVisibleQuestions(section, answers);
    return visibleQuestions.length > 0 && visibleQuestions.every((question) => {
      const value = answers[question.id];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });
  }).length;
}

export function getSurveyQuestionLabel(questionId) {
  for (const section of clientSurveySections) {
    const question = section.questions.find((item) => item.id === questionId);
    if (question) {
      return question.label;
    }
  }

  return questionId;
}
