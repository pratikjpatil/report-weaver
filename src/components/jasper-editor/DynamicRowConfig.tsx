import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { FilterBuilder } from "./FilterBuilder";
import { useConfig } from "@/contexts/ConfigContext";

interface ColumnMapping {
  templateColumnId: string;
  dbColumn: string;
}

interface DynamicRowConfigProps {
  dynamicConfig: any;
  templateColumns: { id: string; name: string }[];
  onConfigChange: (config: any) => void;
}

export const DynamicRowConfig = ({
  dynamicConfig,
  templateColumns,
  onConfigChange,
}: DynamicRowConfigProps) => {
  const { tableConfigs, getSelectableColumns, loading } = useConfig();

  // Local state for selected table to handle controlled Autocomplete
  const [selectedTableValue, setSelectedTableValue] = useState<string | null>(null);

  // Sync local state with dynamicConfig
  useEffect(() => {
    setSelectedTableValue(dynamicConfig.table || null);
  }, [dynamicConfig.table]);

  const updateConfig = (updates: Record<string, any>) => {
    onConfigChange({ ...dynamicConfig, ...updates });
  };

  const selectableColumns = selectedTableValue ? getSelectableColumns(selectedTableValue) : [];

  // Get current column mappings or initialize with empty mappings
  const getColumnMappings = (): ColumnMapping[] => {
    if (dynamicConfig.columnMappings && Array.isArray(dynamicConfig.columnMappings)) {
      // Ensure all template columns have mappings
      const existingMappings = dynamicConfig.columnMappings as ColumnMapping[];
      const existingIds = existingMappings.map(m => m.templateColumnId);
      
      const newMappings = [...existingMappings];
      templateColumns.forEach(col => {
        if (!existingIds.includes(col.id)) {
          newMappings.push({ templateColumnId: col.id, dbColumn: "" });
        }
      });
      
      return newMappings;
    }
    return templateColumns.map(col => ({ templateColumnId: col.id, dbColumn: "" }));
  };

  const columnMappings = getColumnMappings();

  const handleTableChange = (newTableName: string | null) => {
    setSelectedTableValue(newTableName);
    
    // Reset mappings when table changes
    const resetMappings = templateColumns.map(col => ({ 
      templateColumnId: col.id, 
      dbColumn: "" 
    }));
    
    updateConfig({
      table: newTableName || "",
      columnMappings: resetMappings,
      select: [],
    });
  };

  const handleColumnMappingChange = (templateColumnId: string, dbColumn: string | null) => {
    const newMappings = columnMappings.map(mapping =>
      mapping.templateColumnId === templateColumnId
        ? { ...mapping, dbColumn: dbColumn || "" }
        : mapping
    );

    // Update the select array for backwards compatibility
    const selectedDbColumns = newMappings
      .filter(m => m.dbColumn)
      .map(m => m.dbColumn);

    updateConfig({
      columnMappings: newMappings,
      select: selectedDbColumns,
    });
  };

  const getDbColumnForTemplate = (templateColumnId: string): string => {
    const mapping = columnMappings.find(m => m.templateColumnId === templateColumnId);
    return mapping?.dbColumn || "";
  };

  // Validation
  const mappedColumnsCount = columnMappings.filter(m => m.dbColumn).length;
  const hasValidationError = selectedTableValue && templateColumns.length > 0 && mappedColumnsCount === 0;

  // Get table options with labels
  const tableOptions = tableConfigs.map(t => ({
    value: t.tableName,
    label: `${t.tableName} (${t.label})`,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        DYNAMIC ROW CONFIGURATION
      </Typography>

      <FormControl size="small" fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          value={dynamicConfig.type || "DB_LIST"}
          onChange={(e) => updateConfig({ type: e.target.value })}
          label="Type"
        >
          <MenuItem value="DB_LIST">Database List</MenuItem>
        </Select>
      </FormControl>

      <Autocomplete
        size="small"
        options={tableOptions}
        value={tableOptions.find(opt => opt.value === selectedTableValue) || null}
        onChange={(_, newValue) => handleTableChange(newValue?.value || null)}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        loading={loading}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="Table" 
            placeholder="Select table..."
          />
        )}
        fullWidth
      />

      {selectedTableValue && (
        <>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
              COLUMN MAPPINGS
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
              Map each template column to a database column. Leave empty for columns that should not have data.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {templateColumns.map((templateCol) => {
                const currentDbColumn = getDbColumnForTemplate(templateCol.id);
                const columnOptions = [
                  { value: "", label: "(Empty - No data)" },
                  ...selectableColumns.map(col => ({ value: col, label: col }))
                ];
                const currentOption = columnOptions.find(opt => opt.value === currentDbColumn) || null;

                return (
                  <Box
                    key={templateCol.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 1,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 120 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {templateCol.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {templateCol.id}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                      →
                    </Typography>

                    <Autocomplete
                      size="small"
                      sx={{ flex: 1, minWidth: 150 }}
                      options={columnOptions}
                      value={currentOption}
                      onChange={(_, newValue) => handleColumnMappingChange(templateCol.id, newValue?.value || "")}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Select DB column or leave empty" />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.value}>
                          {option.value === "" ? (
                            <em style={{ color: "#999" }}>Empty - No data</em>
                          ) : (
                            option.label
                          )}
                        </li>
                      )}
                    />
                  </Box>
                );
              })}
            </Box>

            {hasValidationError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please map at least one column to fetch data.
              </Alert>
            )}

            <Box sx={{ mt: 2, p: 1, bgcolor: "#e3f2fd", borderRadius: 1 }}>
              <Typography variant="caption" color="primary.dark">
                <strong>Mapped:</strong> {mappedColumnsCount} of {templateColumns.length} columns
              </Typography>
            </Box>
          </Paper>

          <FilterBuilder
            filters={dynamicConfig.filters || {}}
            onFiltersChange={(filters) => updateConfig({ filters })}
            tableName={selectedTableValue}
          />

          <TextField
            label="Order By"
            size="small"
            value={dynamicConfig.orderby || ""}
            onChange={(e) => updateConfig({ orderby: e.target.value })}
            placeholder="e.g., BALANCE_DATE DESC"
            fullWidth
          />

          <TextField
            label="Limit"
            type="number"
            size="small"
            value={dynamicConfig.limit || ""}
            onChange={(e) => updateConfig({ limit: parseInt(e.target.value) || "" })}
            placeholder="e.g., 100"
            fullWidth
          />
        </>
      )}

      <Box sx={{ p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1 }}>
        <Typography variant="caption" color="primary.dark">
          <strong>Note:</strong> Dynamic rows will fetch data from the database and generate
          multiple rows based on the query results. Each row will populate cells based on the
          column mappings you define above.
        </Typography>
      </Box>
    </Box>
  );
};