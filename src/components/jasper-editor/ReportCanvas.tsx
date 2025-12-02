import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

interface ReportCanvasProps {
  template: any;
  selectedCell: { rowIndex: number; cellIndex: number } | null;
  onCellSelect: (rowIndex: number, cellIndex: number) => void;
  formulaMode: boolean;
}

export const ReportCanvas = ({ template, selectedCell, onCellSelect, formulaMode }: ReportCanvasProps) => {
  const handleCellClick = (rowIndex: number, cellIndex: number) => {
    if (formulaMode) {
      const row = template.reportData.rows[rowIndex];
      if (row.rowType !== "DYNAMIC" && row.cells && row.cells[cellIndex]) {
        window.dispatchEvent(new CustomEvent('formula-cell-selected', { detail: row.cells[cellIndex].id }));
      }
    } else {
      onCellSelect(rowIndex, cellIndex);
    }
  };

  const getCellValue = (cell: any) => {
    if (!cell) return "";
    switch (cell.type) {
      case "TEXT": return cell.value || "";
      case "FORMULA": return `= ${cell.expression || ""}`;
      case "DB_VALUE":
      case "DB_COUNT":
      case "DB_SUM":
      case "DB_AVG":
      case "DB_MIN":
      case "DB_MAX":
        return `${cell.type}(${cell.source?.table}.${cell.source?.column})`;
      default: return cell.value || "";
    }
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 3, bgcolor: formulaMode ? "#fff3e0" : "background.default", transition: "background-color 0.3s" }}>
      {formulaMode && <Alert severity="info" sx={{ mb: 2 }}>Formula Mode Active: Click on cells to add them to your formula expression</Alert>}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>{template.reportMeta.reportName}</Typography>
        <Typography variant="caption" color="text.secondary">Report ID: {template.reportMeta.reportId} | Template: {template.templateMeta.templateId}</Typography>
      </Paper>
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              {template.reportData.columns.map((col: any, colIndex: number) => (
                <TableCell key={colIndex} sx={{ color: "primary.contrastText", fontWeight: "bold", minWidth: 150 }}>
                  {col.name}
                  <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>{col.id}</Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {template.reportData.rows.length === 0 ? (
              <TableRow><TableCell colSpan={template.reportData.columns.length} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No rows defined. Add rows from the left panel.</Typography></TableCell></TableRow>
            ) : (
              template.reportData.rows.map((row: any, rowIndex: number) => {
                if (row.rowType === "DYNAMIC") {
                  return (
                    <TableRow key={rowIndex} onClick={() => onCellSelect(rowIndex, -1)} sx={{ bgcolor: selectedCell?.rowIndex === rowIndex ? "action.selected" : "warning.light", cursor: "pointer", "&:hover": { bgcolor: "warning.main" } }}>
                      <TableCell colSpan={template.reportData.columns.length}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip label="DYNAMIC ROW" size="small" color="warning" />
                          <Typography variant="body2">Table: {row.dynamicConfig?.table || "Not configured"}{row.dynamicConfig?.limit && ` (Limit: ${row.dynamicConfig.limit})`}</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <TableRow key={rowIndex} sx={{ bgcolor: row.rowType === "HEADER" ? "grey.100" : row.rowType === "FOOTER" ? "grey.100" : row.rowType === "SEPARATOR" ? "grey.200" : "background.paper" }}>
                    {row.cells?.map((cell: any, cellIndex: number) => (
                      <TableCell key={cellIndex} colSpan={cell.render?.colspan || 1} rowSpan={cell.render?.rowspan || 1} onClick={() => handleCellClick(rowIndex, cellIndex)} sx={{ cursor: formulaMode ? "crosshair" : "pointer", minWidth: 120, textAlign: cell.render?.align || "left", fontWeight: cell.render?.bold ? "bold" : "normal", border: selectedCell?.rowIndex === rowIndex && selectedCell?.cellIndex === cellIndex ? "2px solid #1976d2" : undefined, bgcolor: selectedCell?.rowIndex === rowIndex && selectedCell?.cellIndex === cellIndex ? "action.selected" : cell.render?.bgColor }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: cell.render?.bold ? "bold" : "normal" }}>{getCellValue(cell)}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{cell.id}</Typography>
                          {(cell.render?.colspan > 1 || cell.render?.rowspan > 1) && <Chip label={`${cell.render?.colspan || 1}x${cell.render?.rowspan || 1}`} size="small" sx={{ ml: 1, height: 16, fontSize: "0.65rem" }} />}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
