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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Menu from "@mui/material/Menu";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TuneIcon from "@mui/icons-material/Tune";
import FilterListIcon from "@mui/icons-material/FilterList";
import { AddRowDialog } from "./AddRowDialog";

// Variant interfaces
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

interface LeftPanelProps {
  template: any;
  onTemplateChange: (template: any) => void;
}

const OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "IS NULL", "IS NOT NULL"];
const PARAM_TYPES = ["STRING", "DATE", "NUMBER", "BOOLEAN"];
const UI_HINTS = ["text", "date", "number", "select", "multiselect", "checkbox"];
const SCOPE_TYPES = ["ALL_DB", "TABLE", "DYNAMIC_TABLE"];

export const LeftPanel = ({ template, onTemplateChange }: LeftPanelProps) => {
  const [expanded, setExpanded] = useState<string>("metadata");
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "row" | "column";
    index: number;
    references: string[];
    colId: string;
    rowId: string;
  } | null>(null);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [insertMenuAnchor, setInsertMenuAnchor] = useState<null | HTMLElement>(null);
  const [insertAtIndex, setInsertAtIndex] = useState<number>(0);
  const [addRowDialog, setAddRowDialog] = useState<{ open: boolean; rowType: string; insertAt?: number }>({ open: false, rowType: "" });
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  // Variants helpers
  const variants: Variant[] = template.variants || [];

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

  const getDynamicRowIds = () => {
    return template.reportData?.rows
      ?.filter((row: any) => row.rowType === "DYNAMIC")
      .map((row: any) => row.id) || [];
  };

  const updateVariants = (newVariants: Variant[]) => {
    onTemplateChange({ ...template, variants: newVariants });
  };

  const addVariant = () => {
    const newVariant: Variant = {
      variantCode: `VARIANT_${Date.now()}`,
      variantName: "New Variant",
      description: "",
      params: [],
      filterRules: [],
    };
    updateVariants([...variants, newVariant]);
    setExpandedVariant(newVariant.variantCode);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    updateVariants(updated);
  };

  const removeVariant = (index: number) => {
    updateVariants(variants.filter((_, i) => i !== index));
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
    updateVariants(updated);
  };

  const updateParam = (variantIndex: number, paramIndex: number, field: keyof Param, value: any) => {
    const updated = [...variants];
    updated[variantIndex].params[paramIndex] = {
      ...updated[variantIndex].params[paramIndex],
      [field]: value,
    };
    updateVariants(updated);
  };

  const removeParam = (variantIndex: number, paramIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].params = updated[variantIndex].params.filter((_, i) => i !== paramIndex);
    updateVariants(updated);
  };

  const addFilterRule = (variantIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].filterRules.push({
      scopeType: "ALL_DB",
      paramName: "",
      dbColumn: "",
      operator: "=",
    });
    updateVariants(updated);
  };

  const updateFilterRule = (variantIndex: number, ruleIndex: number, field: keyof FilterRule, value: any) => {
    const updated = [...variants];
    updated[variantIndex].filterRules[ruleIndex] = {
      ...updated[variantIndex].filterRules[ruleIndex],
      [field]: value,
    };
    updateVariants(updated);
  };

  const removeFilterRule = (variantIndex: number, ruleIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].filterRules = updated[variantIndex].filterRules.filter((_, i) => i !== ruleIndex);
    updateVariants(updated);
  };

  const tables = getTableNames();
  const dynamicRowIds = getDynamicRowIds();

  // Template metadata helpers
  const updateMetadata = (field: string, value: any) => {
    const newTemplate = { ...template };
    if (field.startsWith("reportMeta.")) {
      const metaField = field.split(".")[1];
      newTemplate.reportMeta[metaField] = value;
    } else if (field.startsWith("templateMeta.")) {
      const metaField = field.split(".")[1];
      newTemplate.templateMeta[metaField] = value;
    } else {
      newTemplate[field] = value;
    }
    onTemplateChange(newTemplate);
  };

  const addColumn = () => {
    const newColumn = {
      id: `C_${template.reportData.columns.length + 1}`,
      name: `Column ${template.reportData.columns.length + 1}`,
      width: 150,
    };

    const updatedRows = template.reportData.rows.map((row: any) => {
      if (row.rowType === "DYNAMIC") {
        return row;
      }
      return {
        ...row,
        cells: [...(row.cells || []), { type: "TEXT", value: "" }],
      };
    });

    onTemplateChange({
      ...template,
      reportData: {
        columns: [...template.reportData.columns, newColumn],
        rows: updatedRows,
      },
    });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...template.reportData.columns];
    if (field.includes(".")) {
      const parts = field.split(".");
      if (!newColumns[index].format) newColumns[index].format = {};
      newColumns[index].format[parts[1]] = value;
    } else {
      newColumns[index][field] = value;
    }
    onTemplateChange({
      ...template,
      reportData: {
        rows: template.reportData.rows,
        columns: newColumns,
      },
    });
  };

  const findColumnReferences = (colId: string) => {
    const references: string[] = [];
    template.reportData.rows.forEach((row: any, rowIndex: number) => {
      row.cells?.forEach((cell: any, cellIndex: number) => {
        if (cell.type === "FORMULA" && cell.expression) {
          const pattern = new RegExp(`cell_R_.*?_${colId}\\b`, "g");
          if (pattern.test(cell.expression)) {
            references.push(`Row ${rowIndex + 1}, Cell ${cellIndex + 1}`);
          }
        }
      });
    });
    return references;
  };

  const removeColumn = (colId: string, index: number) => {
    const references = findColumnReferences(colId);
    if (references.length > 0) {
      setDeleteDialog({ type: "column", index, references, colId, rowId: "" });
    } else {
      confirmRemoveColumn(colId, index);
    }
  };

  const confirmRemoveColumn = (colId: string, index: number) => {
    const updatedRows = template.reportData.rows.map((row: any) => {
      if (row.rowType === "DYNAMIC") return row;
      return {
        ...row,
        cells: (row.cells || []).filter(
          (_: any, i: number) => template.reportData.columns[i].id !== colId
        ),
      };
    });

    const colPattern = new RegExp(`cell_R_.*?_${colId}\\b`, "g");

    updatedRows.forEach((row: any) => {
      row.cells?.forEach((cell: any) => {
        if (cell.type === "FORMULA" && cell.expression) {
          cell.expression = cell.expression
            .replace(colPattern, "")
            .replace(/\s+/g, " ")
            .trim();
        }
      });
    });

    onTemplateChange({
      ...template,
      reportData: {
        columns: template.reportData.columns.filter(
          (c: any, i: number) => c.id !== colId
        ),
        rows: updatedRows,
      },
    });
    setDeleteDialog(null);
  };

  const openAddRowDialog = (type: string, insertAt?: number) => {
    setAddRowDialog({ open: true, rowType: type, insertAt });
    setInsertMenuAnchor(null);
  };

  const addRow = (rowId: string) => {
    const { rowType, insertAt } = addRowDialog;
    
    const newRow: any = {
      rowType,
      id: rowId,
      cells: template.reportData.columns.map(() => ({
        type: "TEXT",
        value: "",
      })),
    };

    if (rowType === "DYNAMIC") {
      newRow.dynamicConfig = {
        type: "DB_LIST",
        table: "",
        select: [],
        filters: {},
      };
      newRow.cells = [];
    }

    const newRows = [...template.reportData.rows];
    if (insertAt !== undefined) {
      newRows.splice(insertAt, 0, newRow);
    } else {
      newRows.push(newRow);
    }
    onTemplateChange({
      ...template,
      reportData: { ...template.reportData, rows: newRows },
    });
    setAddRowDialog({ open: false, rowType: "" });
  };

  const existingRowIds = template.reportData.rows.map((r: any) => r.id);

  const handleDragStart = (index: number) => {
    setDraggedRowIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedRowIndex !== null && dropTargetIndex !== null && draggedRowIndex !== dropTargetIndex) {
      const newRows = [...template.reportData.rows];
      const [draggedRow] = newRows.splice(draggedRowIndex, 1);
      newRows.splice(dropTargetIndex, 0, draggedRow);
      onTemplateChange({
        ...template,
        reportData: { ...template.reportData, rows: newRows },
      });
    }
    setDraggedRowIndex(null);
    setDropTargetIndex(null);
  };

  const handleInsertClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setInsertMenuAnchor(event.currentTarget);
    setInsertAtIndex(index);
  };

  const findRowReferences = (rowId: string) => {
    const references: string[] = [];
    template.reportData.rows.forEach((row: any, rIndex: number) => {
      row.cells?.forEach((cell: any, cellIndex: number) => {
        if (cell.type === "FORMULA" && cell.expression) {
          const pattern = new RegExp(`cell_${rowId}_C_.*?\\b`, "g");
          if (pattern.test(cell.expression)) {
            references.push(`Row ${rIndex + 1}, Cell ${cellIndex + 1}`);
          }
        }
      });
    });
    return references;
  };

  const removeRow = (rowId: string, index: number) => {
    const references = findRowReferences(rowId);
    if (references.length > 0) {
      setDeleteDialog({ type: "row", index, references, colId: "", rowId });
    } else {
      confirmRemoveRow(rowId, index);
    }
  };

  const confirmRemoveRow = (rowId: string, index: number) => {
    const rowPattern = new RegExp(`cell_${rowId}_C_.*?\\b`, "g");

    const updatedRows = template.reportData.rows
      .filter((r: any, i: number) => r.id !== rowId)
      .map((row: any) => {
        if (row.cells) {
          row.cells.forEach((cell: any) => {
            if (cell.type === "FORMULA" && cell.expression) {
              cell.expression = cell.expression
                .replace(rowPattern, "")
                .replace(/\s+/g, " ")
                .trim();
            }
          });
        }
        return row;
      });
    const updatedRowsReportData = {
      ...template.reportData,
      rows: updatedRows,
    };
    onTemplateChange({
      ...template,
      reportData: updatedRowsReportData,
    });
    setDeleteDialog(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 340,
        borderRight: "1px solid #e0e0e0",
        overflow: "auto",
        bgcolor: "#fafafa",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          gutterBottom
          sx={{ color: "text.secondary" }}
        >
          REPORT STRUCTURE
        </Typography>

        {/* Metadata Accordion */}
        <Accordion
          expanded={expanded === "metadata"}
          onChange={() =>
            setExpanded(expanded === "metadata" ? "" : "metadata")
          }
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={500}>
              Metadata
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Report Name"
                size="small"
                value={template.reportMeta.reportName}
                onChange={(e) =>
                  updateMetadata("reportMeta.reportName", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="Template ID"
                size="small"
                value={template.templateMeta.templateId}
                onChange={(e) =>
                  updateMetadata("templateMeta.templateId", e.target.value)
                }
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={template.templateMeta.pageSize}
                  onChange={(e) =>
                    updateMetadata("templateMeta.pageSize", e.target.value)
                  }
                  label="Page Size"
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="LETTER">Letter</MenuItem>
                  <MenuItem value="LEGAL">Legal</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={template.templateMeta.pageOrientation}
                  onChange={(e) =>
                    updateMetadata(
                      "templateMeta.pageOrientation",
                      e.target.value
                    )
                  }
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Columns Accordion */}
        <Accordion
          expanded={expanded === "columns"}
          onChange={() => setExpanded(expanded === "columns" ? "" : "columns")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ViewColumnIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>
              Columns ({template.reportData.columns.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addColumn}
                fullWidth
              >
                Add Column
              </Button>
              <List dense sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                {template.reportData.columns.map((col: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1,
                      p: 1,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="primary"
                      >
                        {col.id}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setEditingColumn(
                              editingColumn === index ? null : index
                            )
                          }
                        >
                          <ExpandMoreIcon
                            fontSize="small"
                            sx={{
                              transform:
                                editingColumn === index
                                  ? "rotate(180deg)"
                                  : "none",
                            }}
                          />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => removeColumn(col.id, index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {editingColumn === index && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <TextField
                          label="Column Name"
                          size="small"
                          value={col.name || ""}
                          onChange={(e) =>
                            updateColumn(index, "name", e.target.value)
                          }
                          fullWidth
                        />
                        <FormControl size="small" fullWidth>
                          <InputLabel>Format Type</InputLabel>
                          <Select
                            value={col.format?.type || "none"}
                            onChange={(e) =>
                              updateColumn(index, "format.type", e.target.value)
                            }
                            label="Format Type"
                          >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="currency">Currency</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                          </Select>
                        </FormControl>

                        {col.format?.type === "currency" && (
                          <>
                            <TextField
                              label="Currency Symbol"
                              size="small"
                              value={col.format?.currencySymbol || ""}
                              onChange={(e) =>
                                updateColumn(
                                  index,
                                  "format.currencySymbol",
                                  e.target.value
                                )
                              }
                              placeholder="$"
                              fullWidth
                            />
                            <TextField
                              label="Decimals"
                              type="number"
                              size="small"
                              value={col.format?.decimals || 2}
                              onChange={(e) =>
                                updateColumn(
                                  index,
                                  "format.decimals",
                                  parseInt(e.target.value)
                                )
                              }
                              fullWidth
                            />
                          </>
                        )}

                        {col.format?.type === "number" && (
                          <>
                            <TextField
                              label="Decimals"
                              type="number"
                              size="small"
                              value={col.format?.decimals || 0}
                              onChange={(e) =>
                                updateColumn(
                                  index,
                                  "format.decimals",
                                  parseInt(e.target.value)
                                )
                              }
                              fullWidth
                            />
                            <FormControl size="small" fullWidth>
                              <InputLabel>Thousand Separator</InputLabel>
                              <Select
                                value={col.format?.thousandSeparator || false}
                                onChange={(e) =>
                                  updateColumn(
                                    index,
                                    "format.thousandSeparator",
                                    e.target.value === "true"
                                  )
                                }
                                label="Thousand Separator"
                              >
                                <MenuItem value="true">Yes</MenuItem>
                                <MenuItem value="false">No</MenuItem>
                              </Select>
                            </FormControl>
                          </>
                        )}

                        {col.format?.type === "date" && (
                          <TextField
                            label="Date Format"
                            size="small"
                            value={col.format?.outputFormat || ""}
                            onChange={(e) =>
                              updateColumn(
                                index,
                                "format.outputFormat",
                                e.target.value
                              )
                            }
                            placeholder="dd-MMM-yyyy"
                            fullWidth
                          />
                        )}

                        <TextField
                          label="Width (px)"
                          type="number"
                          size="small"
                          value={col.width || 150}
                          onChange={(e) =>
                            updateColumn(
                              index,
                              "width",
                              parseInt(e.target.value) || 150
                            )
                          }
                          fullWidth
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Rows Accordion */}
        <Accordion
          expanded={expanded === "rows"}
          onChange={() => setExpanded(expanded === "rows" ? "" : "rows")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ViewAgendaIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>
              Rows ({template.reportData.rows.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0.5,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openAddRowDialog("HEADER")}
                >
                  Header
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openAddRowDialog("DATA")}
                >
                  Data
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openAddRowDialog("SEPARATOR")}
                >
                  Separator
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openAddRowDialog("DYNAMIC")}
                >
                  Dynamic
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openAddRowDialog("FOOTER")}
                  sx={{ gridColumn: "span 2" }}
                >
                  Footer
                </Button>
              </Box>
              <List
                dense
                sx={{ bgcolor: "background.paper", borderRadius: 1, mt: 1 }}
              >
                {template.reportData.rows.map((row: any, index: number) => (
                  <Box key={row.id || index}>
                    <Box
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={handleDragEnd}
                      sx={{
                        height: dropTargetIndex === index && draggedRowIndex !== index ? 24 : 4,
                        bgcolor: dropTargetIndex === index && draggedRowIndex !== index ? "primary.light" : "transparent",
                        borderRadius: 1,
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {dropTargetIndex === index && draggedRowIndex !== index && (
                        <Typography variant="caption" color="primary.contrastText">
                          Drop here
                        </Typography>
                      )}
                    </Box>
                    <ListItem
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        cursor: "grab",
                        bgcolor: draggedRowIndex === index ? "action.selected" : "transparent",
                        borderRadius: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      secondaryAction={
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleInsertClick(e, index + 1)}
                            title="Insert row after"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => removeRow(row.id, index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <DragIndicatorIcon
                        sx={{ mr: 1, color: "text.disabled", cursor: "grab" }}
                        fontSize="small"
                      />
                      <ListItemText
                        primary={row.id}
                        secondary={row.rowType}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          color: "primary",
                        }}
                      />
                    </ListItem>
                  </Box>
                ))}
                <Box
                  onDragOver={(e) => handleDragOver(e, template.reportData.rows.length)}
                  onDrop={handleDragEnd}
                  sx={{
                    height: dropTargetIndex === template.reportData.rows.length ? 24 : 4,
                    bgcolor: dropTargetIndex === template.reportData.rows.length ? "primary.light" : "transparent",
                    borderRadius: 1,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {dropTargetIndex === template.reportData.rows.length && (
                    <Typography variant="caption" color="primary.contrastText">
                      Drop here
                    </Typography>
                  )}
                </Box>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Variants Accordion */}
        <Accordion
          expanded={expanded === "variants"}
          onChange={() => setExpanded(expanded === "variants" ? "" : "variants")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TuneIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>
              Variants ({variants.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addVariant}
                fullWidth
              >
                Add Variant
              </Button>

              {variants.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 2, color: "text.secondary" }}>
                  <Typography variant="caption">
                    No variants defined. Add variants for different report configurations.
                  </Typography>
                </Box>
              ) : (
                variants.map((variant, vIndex) => (
                  <Accordion
                    key={variant.variantCode}
                    expanded={expandedVariant === variant.variantCode}
                    onChange={() => setExpandedVariant(expandedVariant === variant.variantCode ? null : variant.variantCode)}
                    sx={{ bgcolor: "background.paper" }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", pr: 1 }}>
                        <Typography variant="caption" fontWeight={500} sx={{ flex: 1 }} noWrap>
                          {variant.variantName}
                        </Typography>
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
                    <AccordionDetails sx={{ p: 1.5 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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

                        {/* Parameters */}
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="caption" fontWeight={600}>
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
                                p: 1,
                                mb: 1,
                                bgcolor: "#f5f5f5",
                                borderRadius: 1,
                                border: "1px solid #e0e0e0",
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Chip label={param.paramName} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                                <IconButton size="small" onClick={() => removeParam(vIndex, pIndex)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>

                              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
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

                              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={param.required}
                                      onChange={(e) => updateParam(vIndex, pIndex, "required", e.target.checked)}
                                      size="small"
                                    />
                                  }
                                  label={<Typography variant="caption">Required</Typography>}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={param.multiValued}
                                      onChange={(e) => updateParam(vIndex, pIndex, "multiValued", e.target.checked)}
                                      size="small"
                                    />
                                  }
                                  label={<Typography variant="caption">Multi</Typography>}
                                />
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        <Divider />

                        {/* Filter Rules */}
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <FilterListIcon fontSize="small" />
                              <Typography variant="caption" fontWeight={600}>
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
                                p: 1,
                                mb: 1,
                                bgcolor: "#f5f5f5",
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
                                  sx={{ fontSize: "0.6rem" }}
                                />
                                <IconButton size="small" onClick={() => removeFilterRule(vIndex, rIndex)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>

                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                                      <MenuItem key={p.paramName} value={p.paramName}>{p.paramName}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>

                                <TextField
                                  label="DB Column"
                                  size="small"
                                  value={rule.dbColumn}
                                  onChange={(e) => updateFilterRule(vIndex, rIndex, "dbColumn", e.target.value)}
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
          </AccordionDetails>
        </Accordion>

        {/* Insert Row Menu */}
        <Menu
          anchorEl={insertMenuAnchor}
          open={Boolean(insertMenuAnchor)}
          onClose={() => setInsertMenuAnchor(null)}
        >
          <MenuItem onClick={() => openAddRowDialog("HEADER", insertAtIndex)}>Header</MenuItem>
          <MenuItem onClick={() => openAddRowDialog("DATA", insertAtIndex)}>Data</MenuItem>
          <MenuItem onClick={() => openAddRowDialog("SEPARATOR", insertAtIndex)}>Separator</MenuItem>
          <MenuItem onClick={() => openAddRowDialog("DYNAMIC", insertAtIndex)}>Dynamic</MenuItem>
          <MenuItem onClick={() => openAddRowDialog("FOOTER", insertAtIndex)}>Footer</MenuItem>
        </Menu>

        <AddRowDialog
          open={addRowDialog.open}
          rowType={addRowDialog.rowType}
          existingRowIds={existingRowIds}
          onClose={() => setAddRowDialog({ open: false, rowType: "" })}
          onConfirm={addRow}
        />
      </Box>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Warning: References Found</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This {deleteDialog?.type} is referenced in the following formulas:
          </DialogContentText>
          <List dense>
            {deleteDialog?.references.map((ref, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={ref} />
              </ListItem>
            ))}
          </List>
          <DialogContentText sx={{ mt: 2 }}>
            Deleting will remove these references from the formulas. Do you want
            to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteDialog?.type === "column") {
                confirmRemoveColumn(deleteDialog.colId, deleteDialog.index);
              } else {
                confirmRemoveRow(deleteDialog.rowId, deleteDialog.index);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
