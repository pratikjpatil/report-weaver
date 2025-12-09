import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import { FormulaBuilder } from "./FormulaBuilder";
import { DynamicRowConfig } from "./DynamicRowConfig";
import { FilterBuilder } from "./FilterBuilder";
import { useConfig } from "@/contexts/ConfigContext";

interface RightPanelProps {
  template: any;
  onTemplateChange: (template: any) => void;
  selectedCell: { rowIndex: number; cellIndex: number } | null;
  formulaMode: boolean;
  onFormulaModeChange: (mode: boolean) => void;
}

export const RightPanel = ({
  template,
  onTemplateChange,
  selectedCell,
  formulaMode,
  onFormulaModeChange,
}: RightPanelProps) => {
  const { tableConfigs, getSelectableColumns, getAllowedAggFuncs } = useConfig();

  const updateCell = (field: string, value: any) => {
    if (!selectedCell) return;

    const newTemplate = { ...template };
    const row = newTemplate.reportData.rows[selectedCell.rowIndex];
    const cell = row.cells[selectedCell.cellIndex];

    if (field.includes(".")) {
      const parts = field.split(".");
      let current = cell;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      cell[field] = value;
    }

    onTemplateChange(newTemplate);
  };

  if (!selectedCell) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: 350,
          bgcolor: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2" gutterBottom>
            No cell selected
          </Typography>
          <Typography variant="caption">
            Click on a cell in the canvas to edit its properties
          </Typography>
        </Box>
      </Paper>
    );
  }

  const row = template.reportData.rows[selectedCell.rowIndex];
  const cell = row?.cells?.[selectedCell.cellIndex];
  const templateColumns = template.reportData.columns.map((col: any) => ({
    id: col.id,
    name: col.name,
  }));

  // Handle dynamic row configuration
  if (row?.rowType === "DYNAMIC" || (row?.rowType === "DYNAMIC" && selectedCell.cellIndex === -1)) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: 350,
          overflow: "auto",
          bgcolor: "#fafafa",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: "text.secondary" }}>
              DYNAMIC ROW
            </Typography>
            <Chip label={`Row ${selectedCell.rowIndex + 1}`} size="small" sx={{ fontSize: "0.7rem" }} />
          </Box>

          <DynamicRowConfig
            dynamicConfig={row.dynamicConfig || {}}
            templateColumns={templateColumns}
            onConfigChange={(config) => {
              const newTemplate = { ...template };
              newTemplate.reportData.rows[selectedCell.rowIndex].dynamicConfig = config;
              onTemplateChange(newTemplate);
            }}
          />
        </Box>
      </Paper>
    );
  }

  if (!cell) return null;

  const selectedTable = cell.source?.table || "";
  const selectableColumns = selectedTable ? getSelectableColumns(selectedTable) : [];

  // Get allowed cell types based on selected column's aggFuncs
  const getCellTypeOptions = () => {
    const baseTypes = [
      { value: "TEXT", label: "Text" },
      { value: "DB_VALUE", label: "DB Value" },
      { value: "FORMULA", label: "Formula" },
    ];

    if (!selectedTable || !cell.source?.column) {
      return [
        ...baseTypes,
        { value: "DB_COUNT", label: "DB Count" },
        { value: "DB_SUM", label: "DB Sum" },
        { value: "DB_AVG", label: "DB Average" },
        { value: "DB_MIN", label: "DB Min" },
        { value: "DB_MAX", label: "DB Max" },
      ];
    }

    const allowedAggFuncs = getAllowedAggFuncs(selectedTable, cell.source.column);
    const aggTypes = [];

    if (allowedAggFuncs.includes("COUNT")) aggTypes.push({ value: "DB_COUNT", label: "DB Count" });
    if (allowedAggFuncs.includes("SUM")) aggTypes.push({ value: "DB_SUM", label: "DB Sum" });
    if (allowedAggFuncs.includes("AVG")) aggTypes.push({ value: "DB_AVG", label: "DB Average" });
    if (allowedAggFuncs.includes("MIN")) aggTypes.push({ value: "DB_MIN", label: "DB Min" });
    if (allowedAggFuncs.includes("MAX")) aggTypes.push({ value: "DB_MAX", label: "DB Max" });

    return [...baseTypes, ...aggTypes];
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 350,
        overflow: "auto",
        bgcolor: "#fafafa",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: "text.secondary" }}>
            CELL PROPERTIES
          </Typography>
          <Chip
            label={`Row ${selectedCell.rowIndex + 1}, Cell ${selectedCell.cellIndex + 1}`}
            size="small"
            sx={{ fontSize: "0.7rem" }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Cell Type</InputLabel>
            <Select
              value={cell.type || "TEXT"}
              onChange={(e) => updateCell("type", e.target.value)}
              label="Cell Type"
            >
              {getCellTypeOptions().map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {cell.type === "TEXT" && (
            <TextField
              label="Text Value"
              size="small"
              multiline
              rows={3}
              value={cell.value || ""}
              onChange={(e) => updateCell("value", e.target.value)}
              fullWidth
            />
          )}

          {cell.type === "FORMULA" && (
            <FormulaBuilder
              expression={cell.expression || ""}
              variables={cell.variables || {}}
              template={template}
              onExpressionChange={(expr) => updateCell("expression", expr)}
              onVariablesChange={(vars) => updateCell("variables", vars)}
              formulaMode={formulaMode}
              onFormulaModeChange={onFormulaModeChange}
            />
          )}

          {cell.type?.startsWith("DB_") && (
            <>
              <Autocomplete
                size="small"
                options={tableConfigs.map((t) => t.tableName)}
                value={selectedTable || null}
                onChange={(_, newValue) => {
                  updateCell("source.table", newValue || "");
                  updateCell("source.column", "");
                }}
                getOptionLabel={(option) => {
                  const table = tableConfigs.find((t) => t.tableName === option);
                  return table ? `${table.tableName} (${table.label})` : option;
                }}
                renderInput={(params) => <TextField {...params} label="Table" placeholder="Select table..." />}
                fullWidth
              />

              <Autocomplete
                size="small"
                options={selectableColumns}
                value={cell.source?.column || null}
                onChange={(_, newValue) => updateCell("source.column", newValue || "")}
                disabled={!selectedTable}
                renderInput={(params) => (
                  <TextField {...params} label="Column" placeholder={selectedTable ? "Select column..." : "Select table first"} />
                )}
                fullWidth
              />

              <FilterBuilder
                filters={cell.source?.filters || {}}
                onFiltersChange={(filters) => updateCell("source.filters", filters)}
                tableName={selectedTable}
              />
            </>
          )}

          <Divider />

          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            FORMATTING
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={cell.render?.bold || false}
                onChange={(e) => updateCell("render.bold", e.target.checked)}
                size="small"
              />
            }
            label="Bold"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Text Align</InputLabel>
            <Select
              value={cell.render?.align || "left"}
              onChange={(e) => updateCell("render.align", e.target.value)}
              label="Text Align"
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Colspan"
            type="number"
            size="small"
            value={cell.render?.colspan || 1}
            onChange={(e) => updateCell("render.colspan", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1, max: template.reportData.columns.length } }}
            fullWidth
          />

          <TextField
            label="Rowspan"
            type="number"
            size="small"
            value={cell.render?.rowspan || 1}
            onChange={(e) => updateCell("render.rowspan", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1, max: 10 } }}
            fullWidth
          />

          <Divider />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Click another cell to edit its properties, or use the JSON export to see the complete
            template structure.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
