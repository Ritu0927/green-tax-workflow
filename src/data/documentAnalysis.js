const reviewStatusByConfidence = (confidence) => {
  if (confidence >= 0.9) {
    return "Verified";
  }
  if (confidence >= 0.8) {
    return "Needs Review";
  }
  return "Needs Review";
};

export const documentAnalysisDefinitions = {
  "doc-001": {
    documentType: "1099-INT",
    issuer: "First Harbor Bank",
    taxYear: 2025,
    summary: "First Harbor Bank 1099-INT was classified successfully. Four fields were extracted. One field requires verification, and the client may need to provide a final version of the document.",
    extractedFields: [
      { name: "interestIncome", label: "Interest income", value: "$1,284.12", sourceLocation: "Page 1 · Box 1", confidence: 0.82, reviewStatus: reviewStatusByConfidence(0.82), returnValue: "$1,284" },
      { name: "accountEnding", label: "Account ending", value: "••••2184", sourceLocation: "Page 1", confidence: 0.96, reviewStatus: reviewStatusByConfidence(0.96), returnValue: "—" },
      { name: "payerName", label: "Payer name", value: "First Harbor Bank", sourceLocation: "Page 1", confidence: 0.98, reviewStatus: reviewStatusByConfidence(0.98), returnValue: "—" },
      { name: "taxYear", label: "Tax year", value: "2025", sourceLocation: "Page 1", confidence: 0.99, reviewStatus: reviewStatusByConfidence(0.99), returnValue: "2025" }
    ],
    alerts: [
      {
        id: "alert-doc-001-1",
        title: "Interest income requires verification",
        reason: "The extracted amount is below the firm review-confidence threshold.",
        relatedField: "Interest income",
        supportingEvidence: "Return value currently rounds the extracted amount to the nearest dollar.",
        suggestedAction: "Compare Box 1 against the source document.",
        severity: "Medium",
        reviewStatus: "Open",
        owner: "Noah Patel"
      },
      {
        id: "alert-doc-001-2",
        title: "Possible missing final 1099-INT",
        reason: "The survey indicates bank-interest income, but the current upload may not be the final statement.",
        relatedField: "Interest income",
        supportingEvidence: "Survey answers show two interest-bearing accounts but only one 1099-INT is present.",
        suggestedAction: "Request the final 1099-INT from the client.",
        severity: "Medium",
        reviewStatus: "Open",
        owner: "Avery Stone"
      }
    ]
  },
  "doc-013": {
    documentType: "W-2",
    issuer: "Acme Technologies",
    taxYear: 2025,
    summary: "Acme Technologies W-2 was classified successfully. Six payroll fields were extracted and verified.",
    extractedFields: [
      { name: "employerName", label: "Employer name", value: "Acme Technologies", sourceLocation: "Page 1", confidence: 0.99, reviewStatus: "Verified", returnValue: "—" },
      { name: "ein", label: "EIN", value: "84-1129087", sourceLocation: "Page 1", confidence: 0.97, reviewStatus: "Verified", returnValue: "—" },
      { name: "wages", label: "Wages", value: "$89,400.00", sourceLocation: "Page 1 · Box 1", confidence: 0.98, reviewStatus: "Verified", returnValue: "$89,400" },
      { name: "federalWithholding", label: "Federal withholding", value: "$14,322.00", sourceLocation: "Page 1 · Box 2", confidence: 0.98, reviewStatus: "Verified", returnValue: "$14,322" },
      { name: "stateWages", label: "State wages", value: "$89,400.00", sourceLocation: "Page 1 · Box 16", confidence: 0.97, reviewStatus: "Verified", returnValue: "$89,400" },
      { name: "stateWithholding", label: "State withholding", value: "$4,028.00", sourceLocation: "Page 1 · Box 17", confidence: 0.97, reviewStatus: "Verified", returnValue: "$4,028" }
    ],
    alerts: []
  },
  "doc-014": {
    documentType: "W-2",
    issuer: "Northstar Consulting",
    taxYear: 2025,
    summary: "Northstar Consulting W-2 was classified successfully. Six payroll fields were extracted and verified.",
    extractedFields: [
      { name: "employerName", label: "Employer name", value: "Northstar Consulting", sourceLocation: "Page 1", confidence: 0.99, reviewStatus: "Verified", returnValue: "—" },
      { name: "ein", label: "EIN", value: "36-2290184", sourceLocation: "Page 1", confidence: 0.97, reviewStatus: "Verified", returnValue: "—" },
      { name: "wages", label: "Wages", value: "$35,200.00", sourceLocation: "Page 1 · Box 1", confidence: 0.98, reviewStatus: "Verified", returnValue: "$35,200" },
      { name: "federalWithholding", label: "Federal withholding", value: "$5,640.00", sourceLocation: "Page 1 · Box 2", confidence: 0.98, reviewStatus: "Verified", returnValue: "$5,640" },
      { name: "stateWages", label: "State wages", value: "$35,200.00", sourceLocation: "Page 1 · Box 16", confidence: 0.97, reviewStatus: "Verified", returnValue: "$35,200" },
      { name: "stateWithholding", label: "State withholding", value: "$1,583.00", sourceLocation: "Page 1 · Box 17", confidence: 0.97, reviewStatus: "Verified", returnValue: "$1,583" }
    ],
    alerts: []
  },
  "doc-015": {
    documentType: "1099-DIV",
    issuer: "Vanguard",
    taxYear: 2025,
    summary: "Vanguard 1099-DIV was classified successfully. Four dividend fields were extracted, and one item still requires review.",
    extractedFields: [
      { name: "ordinaryDividends", label: "Ordinary dividends", value: "$642.18", sourceLocation: "Page 1 · Box 1a", confidence: 0.91, reviewStatus: "Verified", returnValue: "$642" },
      { name: "qualifiedDividends", label: "Qualified dividends", value: "$611.73", sourceLocation: "Page 1 · Box 1b", confidence: 0.87, reviewStatus: "Needs Review", returnValue: "$612" },
      { name: "capitalGain", label: "Capital-gain distributions", value: "$120.00", sourceLocation: "Page 1 · Box 2a", confidence: 0.89, reviewStatus: "Needs Review", returnValue: "—" },
      { name: "foreignTax", label: "Foreign tax paid", value: "$41.25", sourceLocation: "Page 2 · Box 7", confidence: 0.84, reviewStatus: "Needs Review", returnValue: "—" }
    ],
    alerts: [
      {
        id: "alert-doc-015-1",
        title: "Foreign tax may require review",
        reason: "Foreign tax paid was extracted and may need reviewer confirmation before final mapping.",
        relatedField: "Foreign tax paid",
        supportingEvidence: "The extracted amount is present, but no return mapping is currently linked.",
        suggestedAction: "Confirm foreign tax treatment before final review.",
        severity: "Medium",
        reviewStatus: "Open",
        owner: "Maya Chen, CPA"
      }
    ]
  },
  "doc-016": {
    documentType: "1098",
    issuer: "Horizon Mortgage",
    taxYear: 2025,
    summary: "Horizon Mortgage Form 1098 can be processed. Mortgage-interest support is present, but return mapping still needs to be reviewed.",
    extractedFields: [
      { name: "mortgageInterest", label: "Mortgage interest", value: "$9,812.44", sourceLocation: "Page 1 · Box 1", confidence: 0.91, reviewStatus: "Verified", returnValue: "—" },
      { name: "principal", label: "Outstanding principal", value: "$284,900.00", sourceLocation: "Page 1 · Box 2", confidence: 0.88, reviewStatus: "Needs Review", returnValue: "—" },
      { name: "propertyAddress", label: "Property address", value: "24 Harbor Lane, Boston, MA", sourceLocation: "Page 1", confidence: 0.86, reviewStatus: "Needs Review", returnValue: "24 Harbor Lane, Boston, MA" },
      { name: "pointsPaid", label: "Points paid", value: "$0.00", sourceLocation: "Page 1 · Box 6", confidence: 0.95, reviewStatus: "Verified", returnValue: "$0" }
    ],
    alerts: [
      {
        id: "alert-doc-016-1",
        title: "Mortgage interest is not mapped",
        reason: "Mortgage interest was extracted, but no linked return value is currently traced to this document.",
        relatedField: "Mortgage interest",
        supportingEvidence: "Schedule A currently has no traced mortgage-interest value for this return.",
        suggestedAction: "Review Schedule A mapping for this document.",
        severity: "Medium",
        reviewStatus: "Open",
        owner: "Noah Patel"
      }
    ]
  },
  "doc-017": {
    documentType: "Dependent Care Statement",
    issuer: "Bright Steps Learning Center",
    taxYear: 2025,
    summary: "Bright Steps dependent-care support was classified successfully. Four fields were extracted, but provider information remains incomplete.",
    extractedFields: [
      { name: "providerName", label: "Provider name", value: "Bright Steps Learning Center", sourceLocation: "Page 1", confidence: 0.97, reviewStatus: "Verified", returnValue: "—" },
      { name: "providerTaxId", label: "Provider tax ID", value: "Missing", sourceLocation: "Page 1", confidence: 0.73, reviewStatus: "Needs Review", returnValue: "—" },
      { name: "amountPaid", label: "Amount paid", value: "$3,200.00", sourceLocation: "Page 1", confidence: 0.81, reviewStatus: "Needs Review", returnValue: "$3,200" },
      { name: "dependentName", label: "Dependent name", value: "Lila Stone", sourceLocation: "Page 1", confidence: 0.94, reviewStatus: "Verified", returnValue: "Lila Stone" }
    ],
    alerts: [
      {
        id: "alert-doc-017-1",
        title: "Provider tax ID is missing",
        reason: "The care-provider tax ID could not be confirmed from the uploaded statement.",
        relatedField: "Provider tax ID",
        supportingEvidence: "The client reported dependent-care expenses, but the provider tax ID field is blank.",
        suggestedAction: "Request provider tax ID from the client.",
        severity: "High",
        reviewStatus: "Open",
        owner: "Avery Stone"
      },
      {
        id: "alert-doc-017-2",
        title: "Amount requires confirmation",
        reason: "The dependent-care amount matches intake answers but still requires human review.",
        relatedField: "Amount paid",
        supportingEvidence: "The amount matches the intake survey, but supporting provider details remain incomplete.",
        suggestedAction: "Confirm the total amount paid before credit review.",
        severity: "Medium",
        reviewStatus: "In Review",
        owner: "Noah Patel"
      }
    ]
  },
  "doc-002": {
    documentType: "Identity Document",
    issuer: "Commonwealth of Massachusetts",
    taxYear: 2025,
    summary: "State identification was classified successfully. Identity fields were extracted and verified.",
    extractedFields: [
      { name: "fullName", label: "Full name", value: "Avery Stone", sourceLocation: "Page 1", confidence: 0.99, reviewStatus: "Verified", returnValue: "Avery Stone" },
      { name: "licenseNumber", label: "License number", value: "S••••4821", sourceLocation: "Page 1", confidence: 0.96, reviewStatus: "Verified", returnValue: "—" }
    ],
    alerts: []
  },
  "doc-018": {
    documentType: "Contribution Summary",
    issuer: "Avery Stone",
    taxYear: 2025,
    summary: "Contribution support is available for review. Donation totals were extracted, but receipt verification is still required.",
    extractedFields: [
      { name: "donationTotal", label: "Contribution total", value: "$2,145.00", sourceLocation: "Page 1", confidence: 0.88, reviewStatus: "Needs Review", returnValue: "—" },
      { name: "cashContributions", label: "Cash contributions", value: "$1,780.00", sourceLocation: "Page 2", confidence: 0.86, reviewStatus: "Needs Review", returnValue: "—" },
      { name: "nonCashContributions", label: "Non-cash contributions", value: "$365.00", sourceLocation: "Page 3", confidence: 0.84, reviewStatus: "Needs Review", returnValue: "—" }
    ],
    alerts: [
      {
        id: "alert-doc-018-1",
        title: "Contribution support requires verification",
        reason: "The uploaded summary is present, but supporting receipts still need to be verified.",
        relatedField: "Contribution total",
        supportingEvidence: "The summary is available, but no receipt bundle has been confirmed.",
        suggestedAction: "Review the contribution summary against supporting receipts.",
        severity: "Medium",
        reviewStatus: "Open",
        owner: "Maya Chen, CPA"
      }
    ]
  },
  "doc-019": {
    documentType: "1099-NEC",
    issuer: "Lakeside Freelance",
    taxYear: 2025,
    summary: "Lakeside Freelance 1099-NEC could not be processed cleanly. Manual review is required before income can be used.",
    extractedFields: [
      { name: "payerName", label: "Payer name", value: "Lakeside Freelance", sourceLocation: "Page 1", confidence: 0.79, reviewStatus: "Needs Review", returnValue: "—" },
      { name: "nonemployeeCompensation", label: "Nonemployee compensation", value: "$8,940.00", sourceLocation: "Page 1 · Box 1", confidence: 0.78, reviewStatus: "Needs Review", returnValue: "—" }
    ],
    alerts: [
      {
        id: "alert-doc-019-1",
        title: "Document processing failed",
        reason: "Key payer fields could not be extracted with sufficient confidence for direct use.",
        relatedField: "Nonemployee compensation",
        supportingEvidence: "The primary amount and payer details were partially extracted but not trusted.",
        suggestedAction: "Review the document manually and confirm self-employment income support.",
        severity: "High",
        reviewStatus: "Open",
        owner: "Noah Patel"
      }
    ]
  },
  "doc-020": {
    documentType: "1098-T",
    issuer: "Metro University",
    taxYear: 2025,
    summary: "Metro University 1098-T is ready for processing. Tuition and scholarship fields can be reviewed against the education-credit workflow.",
    extractedFields: [
      { name: "paymentsReceived", label: "Payments received", value: "$6,400.00", sourceLocation: "Page 1 · Box 1", confidence: 0.92, reviewStatus: "Verified", returnValue: "—" },
      { name: "scholarships", label: "Scholarships or grants", value: "$1,200.00", sourceLocation: "Page 1 · Box 5", confidence: 0.9, reviewStatus: "Verified", returnValue: "—" },
      { name: "studentName", label: "Student name", value: "Avery Stone", sourceLocation: "Page 1", confidence: 0.98, reviewStatus: "Verified", returnValue: "Avery Stone" }
    ],
    alerts: [
      {
        id: "alert-doc-020-1",
        title: "Education expenses are not mapped",
        reason: "Tuition support is available, but no education-credit mapping is linked to the active return yet.",
        relatedField: "Payments received",
        supportingEvidence: "The document is present, but the return currently has no traced education-credit support.",
        suggestedAction: "Review education-credit eligibility and map the document if appropriate.",
        severity: "Medium",
        reviewStatus: "Open",
        owner: "Noah Patel"
      }
    ]
  }
};

export function getDocumentAnalysisDefinition(documentId) {
  return documentAnalysisDefinitions[documentId] ?? null;
}

export function buildInitialDocumentAnalyses(documents) {
  return documents.reduce((accumulator, document) => {
    if (!["Analyzed", "Needs Review", "Verified"].includes(document.processingStatus)) {
      return accumulator;
    }

    const definition = getDocumentAnalysisDefinition(document.id);
    if (!definition) {
      return accumulator;
    }

    accumulator[document.id] = {
      documentId: document.id,
      documentType: definition.documentType,
      issuer: definition.issuer,
      taxYear: definition.taxYear,
      status: "analysis_complete",
      summary: definition.summary,
      extractedFields: definition.extractedFields,
      insights: definition.alerts,
      comparison: {
        documentId: document.id,
        returnId: document.returnId,
        comparisonStatus: "complete",
        reviewChecks: definition.alerts
      },
      analyzedAt: "2026-07-24 9:48 AM"
    };

    return accumulator;
  }, {});
}
