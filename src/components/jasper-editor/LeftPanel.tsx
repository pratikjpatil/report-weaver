import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useState } from "react";

interface LeftPanelProps {
  template: any;
  onTemplateChange: (template: any) => void;
}

export const LeftPanel = ({ template, onTemplateChange }: LeftPanelProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("metadata");
  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'row' | 'column', index: number, dependencies: string[] } | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const updateMetadata = (field: string, value: string) => {
    const newTemplate = { ...template };
    if (field.startsWith('templateMeta.')) {
      const key = field.replace('templateMeta.', '');
      newTemplate.templateMeta[key] = value;
    } else if (field.startsWith('reportMeta.')) {
      const key = field.replace('reportMeta.', '');
      newTemplate.reportMeta[key] = value;
    }
    onTemplateChange(newTemplate);
  };

  const addColumn = () => {
    const newTemplate = { ...template };
    const colIndex = newTemplate.reportData.columns.length + 1;
    const newColumn = { 
      id: `col_${colIndex}`,
      name: `Column ${colIndex}`, 
      format: { type: "TEXT" } 
    };
    newTemplate.reportData.columns.push(newColumn);
    
    newTemplate.reportData.rows.forEach((row: any) => {
      if (row.rowType !== "DYNAMIC") {
        if (!row.cells) row.cells = [];
        row.cells.push({
          id: `R:${row.id}~C:${newColumn.id}`,
          type: "TEXT",
          value: "",
          render: {}
        });
      }
    });
    
    onTemplateChange(newTemplate);
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newTemplate = { ...template };
    const column = newTemplate.reportData.columns[index];
    const oldId = column.id;
    
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = column;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      column[field] = value;
    }
    
    if (field === 'id' && oldId !== value) {
      newTemplate.reportData.rows.forEach((row: any) => {
        row.cells?.forEach((cell: any) => {
          if (cell.id && cell.id.includes(`C:${oldId}`)) {
            cell.id = `R:${row.id}~C:${value}`;
          }
        });
      });
    }
    
    onTemplateChange(newTemplate);
  };

  const findColumnReferences = (columnId: string) => {
    const dependencies: string[] = [];
    template.reportData.rows.forEach((row: any, rowIndex: number) => {
      row.cells?.forEach((cell: any, cellIndex: number) => {
        if (cell.type === "FORMULA" && cell.expression && cell.expression.includes(`C:${columnId}`)) {
          dependencies.push(`Row ${rowIndex + 1}, Cell ${cellIndex + 1}`);
        }
      });
    });
    return dependencies;
  };

  const removeColumnReferences = (columnId: string) => {
    const newTemplate = { ...template };
    newTemplate.reportData.rows.forEach((row: any) => {
      row.cells?.forEach((cell: any) => {
        if (cell.type === "FORMULA" && cell.expression) {
          cell.expression = cell.expression.replace(new RegExp(`R:[^~]+~C:${columnId}`, 'g'), '').replace(/\s+/g, ' ').trim();
        }
      });
    });
    onTemplateChange(newTemplate);
  };

  const deleteColumn = (index: number) => {
    const columnId = template.reportData.columns[index].id;
    const dependencies = findColumnReferences(columnId);
    
    if (dependencies.length > 0) {
      setDeleteDialog({ type: 'column', index, dependencies });
      return;
    }
    
    performColumnDelete(index);
  };

  const performColumnDelete = (index: number) => {
    const columnId = template.reportData.columns[index].id;
    removeColumnReferences(columnId);
    
    const newTemplate = { ...template };
    newTemplate.reportData.columns.splice(index, 1);
    newTemplate.reportData.rows.forEach((row: any) => {
      if (row.cells && row.cells.length > index) {
        row.cells.splice(index, 1);
      }
    });
    
    onTemplateChange(newTemplate);
    setDeleteDialog(null);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.reportData.columns.length) return;

    const newTemplate = { ...template };
    [newTemplate.reportData.columns[index], newTemplate.reportData.columns[newIndex]] = 
      [newTemplate.reportData.columns[newIndex], newTemplate.reportData.columns[index]];

    newTemplate.reportData.rows.forEach((row: any) => {
      if (row.cells && row.cells.length > Math.max(index, newIndex)) {
        [row.cells[index], row.cells[newIndex]] = [row.cells[newIndex], row.cells[index]];
      }
    });

    onTemplateChange(newTemplate);
  };

  const addRow = (rowType: string, insertAtIndex?: number) => {
    const newTemplate = { ...template };
    const rowId = `row_${Date.now()}`;
    const newRow: any = { id: rowId, rowType, cells: [] };
    
    if (rowType === "DYNAMIC") {
      newRow.dynamicConfig = { type: "DB_LIST", table: "", select: [], filters: {}, orderby: "", limit: 100 };
    } else {
      newTemplate.reportData.columns.forEach((col: any) => {
        newRow.cells.push({ id: `R:${rowId}~C:${col.id}`, type: "TEXT", value: "", render: {} });
      });
    }
    
    if (insertAtIndex !== undefined) {
      newTemplate.reportData.rows.splice(insertAtIndex + 1, 0, newRow);
    } else {
      newTemplate.reportData.rows.push(newRow);
    }
    
    onTemplateChange(newTemplate);
  };

  const findRowReferences = (rowId: string) => {
    const dependencies: string[] = [];
    template.reportData.rows.forEach((row: any, rowIndex: number) => {
      row.cells?.forEach((cell: any, cellIndex: number) => {
        if (cell.type === "FORMULA" && cell.expression && cell.expression.includes(`R:${rowId}~`)) {
          dependencies.push(`Row ${rowIndex + 1}, Cell ${cellIndex + 1}`);
        }
      });
    });
    return dependencies;
  };

  const removeRowReferences = (rowId: string) => {
    const newTemplate = { ...template };
    newTemplate.reportData.rows.forEach((row: any) => {
      row.cells?.forEach((cell: any) => {
        if (cell.type === "FORMULA" && cell.expression) {
          cell.expression = cell.expression.replace(new RegExp(`R:${rowId}~C:[^\\s]+`, 'g'), '').replace(/\s+/g, ' ').trim();
        }
      });
    });
    onTemplateChange(newTemplate);
  };

  const deleteRow = (index: number) => {
    const rowId = template.reportData.rows[index].id;
    const dependencies = findRowReferences(rowId);
    
    if (dependencies.length > 0) {
      setDeleteDialog({ type: 'row', index, dependencies });
      return;
    }
    
    performRowDelete(index);
  };

  const performRowDelete = (index: number) => {
    const rowId = template.reportData.rows[index].id;
    removeRowReferences(rowId);
    
    const newTemplate = { ...template };
    newTemplate.reportData.rows.splice(index, 1);
    onTemplateChange(newTemplate);
    setDeleteDialog(null);
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.reportData.rows.length) return;

    const newTemplate = { ...template };
    [newTemplate.reportData.rows[index], newTemplate.reportData.rows[newIndex]] = 
      [newTemplate.reportData.rows[newIndex], newTemplate.reportData.rows[index]];
    onTemplateChange(newTemplate);
  };

  return (
    <>
      <Paper elevation={0} sx={{ width: 300, borderRight: "1px solid #e0e0e0", overflow: "auto", bgcolor: "#fafafa" }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Button fullWidth onClick={() => toggleSection("metadata")} endIcon={expandedSection === "metadata" ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ justifyContent: "space-between", textTransform: "none", fontWeight: 600 }}>Report Metadata</Button>
            <Collapse in={expandedSection === "metadata"}>
              <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, mt: 1 }}>
                <TextField label="Report Name" size="small" fullWidth value={template.reportMeta.reportName} onChange={(e) => updateMetadata("reportMeta.reportName", e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Report ID" size="small" fullWidth value={template.reportMeta.reportId} onChange={(e) => updateMetadata("reportMeta.reportId", e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Template ID" size="small" fullWidth value={template.templateMeta.templateId} onChange={(e) => updateMetadata("templateMeta.templateId", e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Page Size" size="small" fullWidth value={template.templateMeta.pageSize} onChange={(e) => updateMetadata("templateMeta.pageSize", e.target.value)} sx={{ mb: 2 }} />
                <TextField label="Orientation" size="small" fullWidth value={template.templateMeta.pageOrientation} onChange={(e) => updateMetadata("templateMeta.pageOrientation", e.target.value)} />
              </Box>
            </Collapse>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Button fullWidth onClick={() => toggleSection("columns")} endIcon={expandedSection === "columns" ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ justifyContent: "space-between", textTransform: "none", fontWeight: 600 }}>Columns ({template.reportData.columns.length})</Button>
            <Collapse in={expandedSection === "columns"}>
              <Box sx={{ mt: 1 }}>
                <Button startIcon={<AddIcon />} onClick={addColumn} size="small" fullWidth variant="outlined" sx={{ mb: 1 }}>Add Column</Button>
                <List dense>
                  {template.reportData.columns.map((col: any, index: number) => (
                    <Box key={index}>
                      <ListItem sx={{ bgcolor: "background.paper", borderRadius: 1, mb: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                          <Box sx={{ display: "flex", flexDirection: "column", mr: 1 }}>
                            <IconButton size="small" onClick={() => moveColumn(index, 'up')} disabled={index === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => moveColumn(index, 'down')} disabled={index === template.reportData.columns.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                          </Box>
                          <ListItemText primary={col.name} secondary={`ID: ${col.id}`} sx={{ flex: 1 }} />
                          <IconButton size="small" onClick={() => setExpandedColumn(expandedColumn === index ? null : index)}>{expandedColumn === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                          <IconButton size="small" onClick={() => deleteColumn(index)}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                        <Collapse in={expandedColumn === index}>
                          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                            <TextField label="Column Name" size="small" fullWidth value={col.name} onChange={(e) => updateColumn(index, "name", e.target.value)} />
                            <TextField label="Column ID" size="small" fullWidth value={col.id} onChange={(e) => updateColumn(index, "id", e.target.value)} />
                            <TextField label="Format Type" size="small" fullWidth value={col.format?.type || "TEXT"} onChange={(e) => updateColumn(index, "format.type", e.target.value)} />
                          </Box>
                        </Collapse>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Box>
            </Collapse>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Button fullWidth onClick={() => toggleSection("rows")} endIcon={expandedSection === "rows" ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ justifyContent: "space-between", textTransform: "none", fontWeight: 600 }}>Rows ({template.reportData.rows.length})</Button>
            <Collapse in={expandedSection === "rows"}>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
                  <Button onClick={() => addRow("HEADER")} size="small" variant="outlined">Header</Button>
                  <Button onClick={() => addRow("DATA")} size="small" variant="outlined">Data</Button>
                  <Button onClick={() => addRow("SEPARATOR")} size="small" variant="outlined">Separator</Button>
                  <Button onClick={() => addRow("DYNAMIC")} size="small" variant="outlined">Dynamic</Button>
                  <Button onClick={() => addRow("FOOTER")} size="small" variant="outlined">Footer</Button>
                </Box>
                <List dense>
                  {template.reportData.rows.map((row: any, index: number) => (
                    <Box key={index}>
                      <ListItem sx={{ bgcolor: "background.paper", borderRadius: 1, mb: 1, p: 1 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", mr: 1 }}>
                          <IconButton size="small" onClick={() => moveRow(index, 'up')} disabled={index === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => moveRow(index, 'down')} disabled={index === template.reportData.rows.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                        </Box>
                        <ListItemText primary={`${row.rowType} (${row.id})`} secondary={row.rowType === "DYNAMIC" ? `Table: ${row.dynamicConfig?.table || "..."}` : `${row.cells?.length || 0} cells`} />
                        <Button size="small" onClick={() => addRow("DATA", index)} sx={{ mr: 1 }}><AddIcon fontSize="small" /></Button>
                        <IconButton size="small" onClick={() => deleteRow(index)}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Paper>
      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Warning: Dependencies Found</DialogTitle>
        <DialogContent>
          <DialogContentText>This {deleteDialog?.type} is referenced in formula cells:</DialogContentText>
          <List dense>{deleteDialog?.dependencies.map((dep, idx) => (<ListItem key={idx}><ListItemText primary={dep} /></ListItem>))}</List>
          <DialogContentText sx={{ mt: 2 }}>If you proceed, these references will be removed from the formulas. Do you want to continue?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button onClick={() => { if (deleteDialog?.type === 'column') { performColumnDelete(deleteDialog.index); } else { performRowDelete(deleteDialog.index); } }} color="error">Delete Anyway</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
