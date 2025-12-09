// API service for template builder

export interface TableColumn {
  columnId: number;
  columnName: string;
  label: string;
  dataType: string | null;
  selectable: "Y" | "N";
  filterable: "Y" | "N";
  aggFuncs: string;
}

export interface TableConfig {
  tableId: number;
  tableName: string;
  label: string;
  columns: TableColumn[];
}

export interface Variant {
  variantCode: string;
  variantName: string;
  description: string;
  params: {
    paramName: string;
    label: string;
    paramType: string;
    required: boolean;
    multiValued: boolean;
    uiHint: string;
  }[];
  filterRules: {
    scopeType: "ALL_DB" | "TABLE" | "DYNAMIC_TABLE";
    scopeValue?: string;
    paramName: string;
    dbColumn: string;
    operator: string;
  }[];
}

export interface Template {
  templateMeta: {
    templateId: string;
    version: string;
    description?: string;
    pageSize: string;
    pageOrientation: string;
    headerLayout?: string;
  };
  reportMeta: {
    reportName: string;
    reportId: string;
    extras: { name: string; value: string }[];
  };
  reportData: {
    columns: any[];
    rows: any[];
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Fetch table configurations
export const fetchTableConfigs = async (): Promise<TableConfig[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configs/tables`);
    if (!response.ok) throw new Error("Failed to fetch table configs");
    return await response.json();
  } catch (error) {
    console.error("Error fetching table configs:", error);
    // Return mock data for development
    return [
      {
        tableId: 1060,
        tableName: "GL_BALANCE",
        label: "GL Balance",
        columns: [
          { columnId: 1060, columnName: "BALANCE", label: "Balance", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "SUM,COUNT,AVG" },
          { columnId: 1061, columnName: "BRANCH_CODE", label: "Branch Code", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "COUNT" },
          { columnId: 1062, columnName: "GL_CODE", label: "GL Code", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "COUNT" },
          { columnId: 1063, columnName: "BALANCE_DATE", label: "Balance Date", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "" },
          { columnId: 1064, columnName: "CURRENCY", label: "Currency", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "COUNT" },
          { columnId: 1065, columnName: "ID", label: "ID", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "COUNT" },
          { columnId: 1066, columnName: "AMOUNT", label: "Amount", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "SUM,COUNT,AVG,MIN,MAX" },
        ],
      },
      {
        tableId: 1061,
        tableName: "GL_TRANSACTIONS",
        label: "GL Transactions",
        columns: [
          { columnId: 1062, columnName: "CGL", label: "CGL Code", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "COUNT" },
          { columnId: 1063, columnName: "TXN_DATE", label: "Transaction Date", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "" },
          { columnId: 1064, columnName: "AMOUNT", label: "Amount", dataType: null, selectable: "Y", filterable: "Y", aggFuncs: "SUM,COUNT,AVG,MIN,MAX" },
        ],
      },
      {
        tableId: 1063,
        tableName: "GL_TEST",
        label: "TEST",
        columns: [],
      },
    ];
  }
};

// Fetch existing template
export const fetchTemplate = async (templateId: string): Promise<{ template: Template; variants: Variant[] } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
    if (!response.ok) throw new Error("Failed to fetch template");
    return await response.json();
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
};

// Save template
export const saveTemplate = async (template: Template): Promise<{ success: boolean; templateId?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    });
    if (!response.ok) throw new Error("Failed to save template");
    const data = await response.json();
    return { success: true, templateId: data.templateId };
  } catch (error) {
    console.error("Error saving template:", error);
    return { success: false, error: (error as Error).message };
  }
};

// Save variants (requires template to be saved first)
export const saveVariants = async (templateId: string, variants: Variant[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variants }),
    });
    if (!response.ok) throw new Error("Failed to save variants");
    return { success: true };
  } catch (error) {
    console.error("Error saving variants:", error);
    return { success: false, error: (error as Error).message };
  }
};
