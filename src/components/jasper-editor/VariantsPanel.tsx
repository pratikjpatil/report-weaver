import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import FilterListIcon from "@mui/icons-material/FilterList";

interface Param {
  paramName: string;
  label: string;
  paramType: "STRING" | "DATE" | "NUMBER" | "BOOLEAN";
  required: boolean;
  multiValued: boolean;
  uiHint: string;
}

interface FilterRule {
  scopeType: "ALL_DB" | "TABLE" | "DYNAMIC_TABLE";
  scopeValue?: string;
  paramName: string;
  dbColumn: string;
  operator: string;
}

interface Variant {
  variantCode: string;
  variantName: string;
  description: string;
  params: Param[];
  filterRules: FilterRule[];
}

interface VariantsPanelProps {
  variants: Variant[];
  template: any;
  onVariantsChange: (variants: Variant[]) => void;
}

const OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "IS NULL", "IS NOT NULL"];
const PARAM_TYPES = ["STRING", "DATE", "NUMBER", "BOOLEAN"];
const UI_HINTS = ["text", "date", "number", "select", "multiselect", "checkbox"];
const SCOPE_TYPES = ["ALL_DB", "TABLE", "DYNAMIC_TABLE"];

export const VariantsPanel = ({ variants = [], template, onVariantsChange }: VariantsPanelProps) => {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  // Get all table names from template for scope selection
  const getTableNames = () => {
    const tables = new Set<string>();
    template.reportData?.rows?.forEach((row: any) => {
      row.cells?.forEach((cell: any) => {
        if (cell.source?.table) {
          tables.add(cell.source.table);
        }
      });
      if (row.dynamicConfig?.table) {
        tables.add(row.dynamicConfig.table);
      }
    });
    return Array.from(tables);
  };

  // Get dynamic row IDs for DYNAMIC_TABLE scope
  const getDynamicRowIds = () => {
    return template.reportData?.rows
      ?.filter((row: any) => row.rowType === "DYNAMIC")
      .map((row: any) => row.id) || [];
  };

  const addVariant = () => {
    const newVariant: Variant = {
      variantCode: `VARIANT_${Date.now()}`,
      variantName: "New Variant",
      description: "",
      params: [],
      filterRules: [],
    };
    onVariantsChange([...variants, newVariant]);
    setExpandedVariant(newVariant.variantCode);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onVariantsChange(updated);
  };

  const removeVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index));
  };

  const addParam = (variantIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].params.push({
      paramName: `param_${Date.now()}`,
      label: "New Parameter",
      paramType: "STRING",
      required: true,
      multiValued: false,
      uiHint: "text",
    });
    onVariantsChange(updated);
  };

  const updateParam = (variantIndex: number, paramIndex: number, field: keyof Param, value: any) => {
    const updated = [...variants];
    updated[variantIndex].params[paramIndex] = {
      ...updated[variantIndex].params[paramIndex],
      [field]: value,
    };
    onVariantsChange(updated);
  };

  const removeParam = (variantIndex: number, paramIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].params = updated[variantIndex].params.filter((_, i) => i !== paramIndex);
    onVariantsChange(updated);
  };

  const addFilterRule = (variantIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].filterRules.push({
      scopeType: "ALL_DB",
      paramName: "",
      dbColumn: "",
      operator: "=",
    });
    onVariantsChange(updated);
  };

  const updateFilterRule = (variantIndex: number, ruleIndex: number, field: keyof FilterRule, value: any) => {
    const updated = [...variants];
    updated[variantIndex].filterRules[ruleIndex] = {
      ...updated[variantIndex].filterRules[ruleIndex],
      [field]: value,
    };
    onVariantsChange(updated);
  };

  const removeFilterRule = (variantIndex: number, ruleIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].filterRules = updated[variantIndex].filterRules.filter((_, i) => i !== ruleIndex);
    onVariantsChange(updated);
  };

  const tables = getTableNames();
  const dynamicRowIds = getDynamicRowIds();

  return (
    <Paper
      elevation={0}
      sx={{
        width: 400,
        overflow: "auto",
        bgcolor: "#fafafa",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: "text.secondary" }}>
            REPORT VARIANTS
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addVariant}
          >
            Add Variant
          </Button>
        </Box>

        {variants.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <TuneIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">No variants defined</Typography>
            <Typography variant="caption">
              Add variants to define different report configurations
            </Typography>
          </Box>
        ) : (
          variants.map((variant, vIndex) => (
            <Accordion
              key={variant.variantCode}
              expanded={expandedVariant === variant.variantCode}
              onChange={() => setExpandedVariant(expandedVariant === variant.variantCode ? null : variant.variantCode)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                    {variant.variantName}
                  </Typography>
                  <Chip label={variant.variantCode} size="small" sx={{ fontSize: "0.65rem" }} />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariant(vIndex);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Basic Info */}
                  <TextField
                    label="Variant Code"
                    size="small"
                    value={variant.variantCode}
                    onChange={(e) => updateVariant(vIndex, "variantCode", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                    fullWidth
                  />
                  <TextField
                    label="Variant Name"
                    size="small"
                    value={variant.variantName}
                    onChange={(e) => updateVariant(vIndex, "variantName", e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    size="small"
                    multiline
                    rows={2}
                    value={variant.description}
                    onChange={(e) => updateVariant(vIndex, "description", e.target.value)}
                    fullWidth
                  />

                  <Divider />

                  {/* Parameters Section */}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Parameters ({variant.params.length})
                      </Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={() => addParam(vIndex)}>
                        Add
                      </Button>
                    </Box>

                    {variant.params.map((param, pIndex) => (
                      <Box
                        key={pIndex}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Chip label={param.paramName} size="small" color="primary" variant="outlined" />
                          <IconButton size="small" onClick={() => removeParam(vIndex, pIndex)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                          <TextField
                            label="Param Name"
                            size="small"
                            value={param.paramName}
                            onChange={(e) => updateParam(vIndex, pIndex, "paramName", e.target.value.replace(/\s/g, ""))}
                            fullWidth
                          />
                          <TextField
                            label="Label"
                            size="small"
                            value={param.label}
                            onChange={(e) => updateParam(vIndex, pIndex, "label", e.target.value)}
                            fullWidth
                          />
                          <FormControl size="small" fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={param.paramType}
                              onChange={(e) => updateParam(vIndex, pIndex, "paramType", e.target.value)}
                              label="Type"
                            >
                              {PARAM_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" fullWidth>
                            <InputLabel>UI Hint</InputLabel>
                            <Select
                              value={param.uiHint}
                              onChange={(e) => updateParam(vIndex, pIndex, "uiHint", e.target.value)}
                              label="UI Hint"
                            >
                              {UI_HINTS.map((h) => (
                                <MenuItem key={h} value={h}>{h}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={param.required}
                                onChange={(e) => updateParam(vIndex, pIndex, "required", e.target.checked)}
                                size="small"
                              />
                            }
                            label="Required"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={param.multiValued}
                                onChange={(e) => updateParam(vIndex, pIndex, "multiValued", e.target.checked)}
                                size="small"
                              />
                            }
                            label="Multi-Valued"
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider />

                  {/* Filter Rules Section */}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FilterListIcon fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Filter Rules ({variant.filterRules.length})
                        </Typography>
                      </Box>
                      <Button size="small" startIcon={<AddIcon />} onClick={() => addFilterRule(vIndex)}>
                        Add
                      </Button>
                    </Box>

                    {variant.filterRules.map((rule, rIndex) => (
                      <Box
                        key={rIndex}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Chip
                            label={rule.scopeType}
                            size="small"
                            color={rule.scopeType === "ALL_DB" ? "success" : rule.scopeType === "TABLE" ? "primary" : "warning"}
                            variant="outlined"
                          />
                          <IconButton size="small" onClick={() => removeFilterRule(vIndex, rIndex)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControl size="small" fullWidth>
                            <InputLabel>Scope Type</InputLabel>
                            <Select
                              value={rule.scopeType}
                              onChange={(e) => updateFilterRule(vIndex, rIndex, "scopeType", e.target.value)}
                              label="Scope Type"
                            >
                              {SCOPE_TYPES.map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {rule.scopeType === "TABLE" && (
                            <FormControl size="small" fullWidth>
                              <InputLabel>Table</InputLabel>
                              <Select
                                value={rule.scopeValue || ""}
                                onChange={(e) => updateFilterRule(vIndex, rIndex, "scopeValue", e.target.value)}
                                label="Table"
                              >
                                {tables.map((t) => (
                                  <MenuItem key={t} value={t}>{t}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}

                          {rule.scopeType === "DYNAMIC_TABLE" && (
                            <FormControl size="small" fullWidth>
                              <InputLabel>Dynamic Row</InputLabel>
                              <Select
                                value={rule.scopeValue || ""}
                                onChange={(e) => updateFilterRule(vIndex, rIndex, "scopeValue", e.target.value)}
                                label="Dynamic Row"
                              >
                                {dynamicRowIds.map((id: string) => (
                                  <MenuItem key={id} value={id}>{id}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}

                          <FormControl size="small" fullWidth>
                            <InputLabel>Parameter</InputLabel>
                            <Select
                              value={rule.paramName}
                              onChange={(e) => updateFilterRule(vIndex, rIndex, "paramName", e.target.value)}
                              label="Parameter"
                            >
                              {variant.params.map((p) => (
                                <MenuItem key={p.paramName} value={p.paramName}>{p.label} ({p.paramName})</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <TextField
                            label="DB Column"
                            size="small"
                            value={rule.dbColumn}
                            onChange={(e) => updateFilterRule(vIndex, rIndex, "dbColumn", e.target.value)}
                            placeholder="e.g., REPORT_DATE"
                            fullWidth
                          />

                          <FormControl size="small" fullWidth>
                            <InputLabel>Operator</InputLabel>
                            <Select
                              value={rule.operator}
                              onChange={(e) => updateFilterRule(vIndex, rIndex, "operator", e.target.value)}
                              label="Operator"
                            >
                              {OPERATORS.map((op) => (
                                <MenuItem key={op} value={op}>{op}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Paper>
  );
};
