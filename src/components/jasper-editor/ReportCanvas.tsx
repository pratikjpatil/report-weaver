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

interface ReportCanvasProps {
  template: any;
  onTemplateChange: (template: any) => void;
  selectedCell: { rowIndex: number; cellIndex: number } | null;
  onCellSelect: (cell: { rowIndex: number; cellIndex: number } | null) => void;
  formulaMode: boolean;
}

export const ReportCanvas = ({ 
  template, 
  onTemplateChange,
  selectedCell,
  onCellSelect,
  formulaMode 
}: ReportCanvasProps) => {
  const handleCellClick = (rowIndex: number, cellIndex: number, event: React.MouseEvent) => {
    if (formulaMode) {
      // In formula mode, emit a custom event with cell reference
      const cellRef = `R${rowIndex + 1}C${cellIndex + 1}`;
      window.dispatchEvent(new CustomEvent('formula-cell-selected', { detail: cellRef }));
      event.stopPropagation();
    } else {
      onCellSelect({ rowIndex, cellIndex });
    }
  };

  const getCellValue = (cell: any) => {
    if (cell.type === "TEXT") return cell.value || "Click to edit";
    if (cell.type === "FORMULA") return `= ${cell.expression || "formula"}`;
    if (cell.type?.startsWith("DB_")) return `${cell.type} (${cell.source?.column || "?"})`;
    return "Empty cell";
  };

  const getRowTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HEADER: "#1976d2",
      DATA: "#2c8aa8",
      SEPARATOR: "#757575",
      DYNAMIC: "#388e3c",
      FOOTER: "#f57c00",
    };
    return colors[type] || "#757575";
  };

  return (
    <Box 
      sx={{ 
        flex: 1, 
        bgcolor: formulaMode ? "#fff3e0" : "#f5f7fa",
        p: 3,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: formulaMode ? "crosshair" : "default",
        transition: "background-color 0.3s ease",
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          width: "100%",
          maxWidth: 1200,
          minHeight: "calc(100vh - 150px)",
          bgcolor: "white",
          p: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {formulaMode && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "#ff9800", color: "white", borderRadius: 1, textAlign: "center" }}>
            <Typography variant="body2" fontWeight={600}>
              📍 Formula Building Mode Active - Click any cell to add it to your formula
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h5" fontWeight={600}>
            {template.meta.reportName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {template.columns.length} columns × {template.rows.length} rows
          </Typography>
        </Box>

        {template.columns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add columns from the left panel to get started
            </Typography>
            <Typography variant="caption">
              Define your report structure first
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ border: "1px solid #e0e0e0" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell 
                    sx={{ 
                      width: 60, 
                      fontWeight: 600, 
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      borderRight: "1px solid #e0e0e0"
                    }}
                  >
                    #
                  </TableCell>
                  {template.columns.map((col: any, colIndex: number) => (
                    <TableCell 
                      key={colIndex}
                      sx={{ 
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        width: col.width || 150,
                        minWidth: col.width || 150,
                      }}
                    >
                      {col.name}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {col.id} ({col.width || 150}px)
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {template.rows.map((row: any, rowIndex: number) => (
                  <TableRow 
                    key={rowIndex}
                    sx={{ 
                      "&:hover": { bgcolor: "#f9f9f9" },
                      borderLeft: `3px solid ${getRowTypeColor(row.rowType)}`,
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        bgcolor: "#fafafa",
                        borderRight: "1px solid #e0e0e0",
                        textAlign: "center",
                      }}
                    >
                      <Chip 
                        label={row.rowType}
                        size="small"
                        sx={{ 
                          fontSize: "0.7rem",
                          height: 20,
                          bgcolor: getRowTypeColor(row.rowType),
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    
                    {row.rowType === "DYNAMIC" ? (
                      <TableCell 
                        colSpan={template.columns.length}
                        onClick={() => onCellSelect({ rowIndex, cellIndex: -1 })}
                        sx={{ 
                          bgcolor: selectedCell?.rowIndex === rowIndex ? "#c8e6c9" : "#e8f5e9",
                          fontStyle: "italic",
                          color: "text.secondary",
                          cursor: "pointer",
                          border: selectedCell?.rowIndex === rowIndex ? "2px solid #388e3c" : "1px solid #e0e0e0",
                          "&:hover": {
                            bgcolor: "#c8e6c9",
                          },
                        }}
                      >
                        🔄 Dynamic rows from {row.dynamicConfig?.table || "database"} - Click to configure
                      </TableCell>
                    ) : (
                      row.cells?.map((cell: any, cellIndex: number) => {
                        const isSelected = 
                          selectedCell?.rowIndex === rowIndex && 
                          selectedCell?.cellIndex === cellIndex;
                        
                        return (
                          <TableCell
                            key={cellIndex}
                            onClick={(e) => handleCellClick(rowIndex, cellIndex, e)}
                            colSpan={cell.render?.colspan || 1}
                            rowSpan={cell.render?.rowspan || 1}
                            sx={{
                              cursor: formulaMode ? "crosshair" : "pointer",
                              position: "relative",
                              bgcolor: isSelected ? "#e3f2fd" : (formulaMode ? "#fff9c4" : "white"),
                              border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                              fontWeight: cell.render?.bold ? 600 : 400,
                              textAlign: cell.render?.align || "left",
                              "&:hover": {
                                bgcolor: isSelected ? "#e3f2fd" : (formulaMode ? "#fff59d" : "#f5f5f5"),
                              },
                              transition: "all 0.2s ease",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                              {getCellValue(cell)}
                            </Typography>
                            {cell.render?.colspan && cell.render.colspan > 1 && (
                              <Chip 
                                label={`colspan: ${cell.render.colspan}`}
                                size="small"
                                sx={{ 
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  height: 18,
                                  fontSize: "0.65rem",
                                }}
                              />
                            )}
                          </TableCell>
                        );
                      })
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {template.rows.length === 0 && template.columns.length > 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add rows from the left panel
            </Typography>
            <Typography variant="caption">
              Start building your report structure
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
