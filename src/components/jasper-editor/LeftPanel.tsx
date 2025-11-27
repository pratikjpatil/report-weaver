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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";

interface LeftPanelProps {
  template: any;
  onTemplateChange: (template: any) => void;
}

export const LeftPanel = ({ template, onTemplateChange }: LeftPanelProps) => {
  const [expanded, setExpanded] = useState<string>("metadata");
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'row' | 'column', index: number, references: string[] } | null>(null);

  const updateMetadata = (field: string, value: any) => {
    const newTemplate = { ...template };
    if (field.startsWith("meta.")) {
      const metaField = field.split(".")[1];
      newTemplate.meta[metaField] = value;
    } else {
      newTemplate[field] = value;
    }
    onTemplateChange(newTemplate);
  };

  const [editingColumn, setEditingColumn] = useState<number | null>(null);

  const addColumn = () => {
    const newColumn = {
      id: `C${template.columns.length + 1}`,
      name: `Column ${template.columns.length + 1}`,
      width: 150,
    };
    
    // Add a new empty cell to all existing rows
    const updatedRows = template.rows.map((row: any) => {
      if (row.rowType === "DYNAMIC") {
        return row; // Dynamic rows don't have cells
      }
      return {
        ...row,
        cells: [...(row.cells || []), { type: "TEXT", value: "" }],
      };
    });
    
    onTemplateChange({
      ...template,
      columns: [...template.columns, newColumn],
      rows: updatedRows,
    });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...template.columns];
    if (field.includes(".")) {
      const parts = field.split(".");
      if (!newColumns[index].format) newColumns[index].format = {};
      newColumns[index].format[parts[1]] = value;
    } else {
      newColumns[index][field] = value;
    }
    onTemplateChange({ ...template, columns: newColumns });
  };

  const findColumnReferences = (colIndex: number) => {
    const references: string[] = [];
    template.rows.forEach((row: any, rowIndex: number) => {
      row.cells?.forEach((cell: any, cellIndex: number) => {
        if (cell.type === "FORMULA" && cell.expression) {
          const pattern = new RegExp(`R\\d+C${colIndex + 1}\\b`, 'g');
          if (pattern.test(cell.expression)) {
            references.push(`Row ${rowIndex + 1}, Cell ${cellIndex + 1}`);
          }
        }
      });
    });
    return references;
  };

  const removeColumn = (index: number) => {
    const references = findColumnReferences(index);
    if (references.length > 0) {
      setDeleteDialog({ type: 'column', index, references });
    } else {
      confirmRemoveColumn(index);
    }
  };

  const confirmRemoveColumn = (index: number) => {
    // Remove cells at this column index from all rows
    const updatedRows = template.rows.map((row: any) => {
      if (row.rowType === "DYNAMIC") return row;
      return {
        ...row,
        cells: (row.cells || []).filter((_: any, i: number) => i !== index),
      };
    });

    // Update formula expressions to remove references to this column
    const colPattern = new RegExp(`R(\\d+)C${index + 1}\\b`, 'g');
    updatedRows.forEach((row: any) => {
      row.cells?.forEach((cell: any) => {
        if (cell.type === "FORMULA" && cell.expression) {
          cell.expression = cell.expression.replace(colPattern, '').replace(/\s+/g, ' ').trim();
        }
      });
    });

    onTemplateChange({
      ...template,
      columns: template.columns.filter((_: any, i: number) => i !== index),
      rows: updatedRows,
    });
    setDeleteDialog(null);
  };

  const addRow = (type: string) => {
    const newRow: any = {
      rowType: type,
      cells: template.columns.map(() => ({ type: "TEXT", value: "" })),
    };
    
    if (type === "DYNAMIC") {
      newRow.dynamicConfig = {
        type: "DB_LIST",
        table: "",
        select: [],
        filters: {},
      };
      newRow.cells = [];
    }
    
    const newRows = [...template.rows, newRow];
    onTemplateChange({ ...template, rows: newRows });
  };

  const findRowReferences = (rowIndex: number) => {
    const references: string[] = [];
    template.rows.forEach((row: any, rIndex: number) => {
      row.cells?.forEach((cell: any, cellIndex: number) => {
        if (cell.type === "FORMULA" && cell.expression) {
          const pattern = new RegExp(`R${rowIndex + 1}C\\d+\\b`, 'g');
          if (pattern.test(cell.expression)) {
            references.push(`Row ${rIndex + 1}, Cell ${cellIndex + 1}`);
          }
        }
      });
    });
    return references;
  };

  const removeRow = (index: number) => {
    const references = findRowReferences(index);
    if (references.length > 0) {
      setDeleteDialog({ type: 'row', index, references });
    } else {
      confirmRemoveRow(index);
    }
  };

  const confirmRemoveRow = (index: number) => {
    // Update formula expressions to remove references to this row
    const rowPattern = new RegExp(`R${index + 1}C(\\d+)\\b`, 'g');
    const updatedRows = template.rows
      .filter((_: any, i: number) => i !== index)
      .map((row: any) => {
        if (row.cells) {
          row.cells.forEach((cell: any) => {
            if (cell.type === "FORMULA" && cell.expression) {
              cell.expression = cell.expression.replace(rowPattern, '').replace(/\s+/g, ' ').trim();
            }
          });
        }
        return row;
      });

    onTemplateChange({
      ...template,
      rows: updatedRows,
    });
    setDeleteDialog(null);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: 320, 
        borderRight: "1px solid #e0e0e0",
        overflow: "auto",
        bgcolor: "#fafafa"
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: "text.secondary" }}>
          REPORT STRUCTURE
        </Typography>

        <Accordion expanded={expanded === "metadata"} onChange={() => setExpanded(expanded === "metadata" ? "" : "metadata")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={500}>Metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Report Name"
                size="small"
                value={template.meta.reportName}
                onChange={(e) => updateMetadata("meta.reportName", e.target.value)}
                fullWidth
              />
              <TextField
                label="Template ID"
                size="small"
                value={template.templateId}
                onChange={(e) => updateMetadata("templateId", e.target.value)}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={template.meta.pageSize}
                  onChange={(e) => updateMetadata("meta.pageSize", e.target.value)}
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
                  value={template.meta.pageOrientation}
                  onChange={(e) => updateMetadata("meta.pageOrientation", e.target.value)}
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === "columns"} onChange={() => setExpanded(expanded === "columns" ? "" : "columns")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ViewColumnIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>Columns ({template.columns.length})</Typography>
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
                {template.columns.map((col: any, index: number) => (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: "background.paper", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" fontWeight={600} color="primary">
                        {col.id}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => setEditingColumn(editingColumn === index ? null : index)}>
                          <ExpandMoreIcon fontSize="small" sx={{ transform: editingColumn === index ? "rotate(180deg)" : "none" }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => removeColumn(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {editingColumn === index && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <TextField
                          label="Column Name"
                          size="small"
                          value={col.name || ""}
                          onChange={(e) => updateColumn(index, "name", e.target.value)}
                          fullWidth
                        />
                        <FormControl size="small" fullWidth>
                          <InputLabel>Format Type</InputLabel>
                          <Select
                            value={col.format?.type || "none"}
                            onChange={(e) => updateColumn(index, "format.type", e.target.value)}
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
                              onChange={(e) => updateColumn(index, "format.currencySymbol", e.target.value)}
                              placeholder="$"
                              fullWidth
                            />
                            <TextField
                              label="Decimals"
                              type="number"
                              size="small"
                              value={col.format?.decimals || 2}
                              onChange={(e) => updateColumn(index, "format.decimals", parseInt(e.target.value))}
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
                              onChange={(e) => updateColumn(index, "format.decimals", parseInt(e.target.value))}
                              fullWidth
                            />
                            <FormControl size="small" fullWidth>
                              <InputLabel>Thousand Separator</InputLabel>
                              <Select
                                value={col.format?.thousandSeparator || false}
                                onChange={(e) => updateColumn(index, "format.thousandSeparator", e.target.value === "true")}
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
                            onChange={(e) => updateColumn(index, "format.outputFormat", e.target.value)}
                             placeholder="dd-MMM-yyyy"
                             fullWidth
                           />
                         )}
                         
                         <TextField
                           label="Width (px)"
                           type="number"
                           size="small"
                           value={col.width || 150}
                           onChange={(e) => updateColumn(index, "width", parseInt(e.target.value) || 150)}
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

        <Accordion expanded={expanded === "rows"} onChange={() => setExpanded(expanded === "rows" ? "" : "rows")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ViewAgendaIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>Rows ({template.rows.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                <Button variant="outlined" size="small" onClick={() => addRow("HEADER")}>Header</Button>
                <Button variant="outlined" size="small" onClick={() => addRow("DATA")}>Data</Button>
                <Button variant="outlined" size="small" onClick={() => addRow("SEPARATOR")}>Separator</Button>
                <Button variant="outlined" size="small" onClick={() => addRow("DYNAMIC")}>Dynamic</Button>
                <Button variant="outlined" size="small" onClick={() => addRow("FOOTER")} sx={{ gridColumn: "span 2" }}>Footer</Button>
              </Box>
              <List dense sx={{ bgcolor: "background.paper", borderRadius: 1, mt: 1 }}>
                {template.rows.map((row: any, index: number) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => removeRow(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={`Row ${index + 1}`}
                      secondary={row.rowType}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption", color: "primary" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>
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
            Deleting will remove these references from the formulas. Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (deleteDialog?.type === 'column') {
                confirmRemoveColumn(deleteDialog.index);
              } else {
                confirmRemoveRow(deleteDialog.index);
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
