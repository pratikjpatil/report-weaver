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
  formulaMode,
}: ReportCanvasProps) => {
  const handleCellClick = (
    rowIndex: number,
    cellIndex: number,
    rowId: string,
    colId: string,
    event: React.MouseEvent
  ) => {
    if (formulaMode) {
      const cellRef = `cell_${rowId}_${colId}`;
      window.dispatchEvent(new CustomEvent("formula-cell-selected", { detail: cellRef }));
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

  // Calculate which cells should be hidden due to colspan/rowspan
  const getHiddenCells = () => {
    const hidden = new Set<string>();
    
    template.reportData.rows.forEach((row: any, rowIndex: number) => {
      if (row.rowType === "DYNAMIC") return;
      
      let colOffset = 0;
      row.cells?.forEach((cell: any, cellIndex: number) => {
        const colspan = cell.render?.colspan || 1;
        const rowspan = cell.render?.rowspan || 1;

        // Mark cells to the right as hidden (due to colspan)
        for (let c = 1; c < colspan; c++) {
          hidden.add(`${rowIndex}-${cellIndex + c}`);
        }

        // Mark cells below as hidden (due to rowspan)
        for (let r = 1; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            hidden.add(`${rowIndex + r}-${cellIndex + c}`);
          }
        }
      });
    });

    return hidden;
  };

  const hiddenCells = getHiddenCells();

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
          bgcolor: "white",
          p: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {formulaMode && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "#ff9800",
              color: "white",
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Formula Building Mode Active - Click any cell to add it to your formula
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5" fontWeight={600} sx={{ textAlign: "center" }}>
            {template.reportMeta.reportName}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {template.reportData.columns.length} columns × {template.reportData.rows.length} rows
          </Typography>
        </Box>

        {template.reportData.columns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add columns from the left panel to get started
            </Typography>
            <Typography variant="caption">Define your report structure first</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ border: "1px solid #e0e0e0", tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell
                    sx={{
                      width: 80,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    #
                  </TableCell>
                  {template.reportData.columns.map((col: any, colIndex: number) => (
                    <TableCell
                      key={colIndex}
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        width: col.width || 150,
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
                {template.reportData.rows.map((row: any, rowIndex: number) => (
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
                      <Typography variant="caption" display="block" color="text.secondary">
                        {row.id}
                      </Typography>
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
                        colSpan={template.reportData.columns.length}
                        onClick={() => onCellSelect({ rowIndex, cellIndex: -1 })}
                        sx={{
                          bgcolor:
                            selectedCell?.rowIndex === rowIndex ? "#c8e6c9" : "#e8f5e9",
                          fontStyle: "italic",
                          color: "text.secondary",
                          cursor: "pointer",
                          border:
                            selectedCell?.rowIndex === rowIndex
                              ? "2px solid #388e3c"
                              : "1px solid #e0e0e0",
                          "&:hover": {
                            bgcolor: "#c8e6c9",
                          },
                        }}
                      >
                        🔄 Dynamic rows from {row.dynamicConfig?.table || "database"} - Click to
                        configure
                      </TableCell>
                    ) : (
                      row.cells?.map((cell: any, cellIndex: number) => {
                        // Skip cells that are hidden by colspan/rowspan
                        if (hiddenCells.has(`${rowIndex}-${cellIndex}`)) {
                          return null;
                        }

                        const isSelected =
                          selectedCell?.rowIndex === rowIndex &&
                          selectedCell?.cellIndex === cellIndex;

                        const colspan = cell.render?.colspan || 1;
                        const rowspan = cell.render?.rowspan || 1;

                        return (
                          <TableCell
                            key={cellIndex}
                            onClick={(e) =>
                              handleCellClick(
                                rowIndex,
                                cellIndex,
                                row.id,
                                template.reportData.columns[cellIndex].id,
                                e
                              )
                            }
                            colSpan={colspan}
                            rowSpan={rowspan}
                            sx={{
                              cursor: formulaMode ? "crosshair" : "pointer",
                              position: "relative",
                              bgcolor: isSelected
                                ? "#e3f2fd"
                                : formulaMode
                                ? "#fff9c4"
                                : "white",
                              border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                              fontWeight: cell.render?.bold ? 600 : 400,
                              textAlign: cell.render?.align || "left",
                              "&:hover": {
                                bgcolor: isSelected
                                  ? "#e3f2fd"
                                  : formulaMode
                                  ? "#fff59d"
                                  : "#f5f5f5",
                              },
                              transition: "all 0.2s ease",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                              {getCellValue(cell)}
                            </Typography>
                            {colspan > 1 && (
                              <Chip
                                label={`colspan: ${colspan}`}
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
                            {rowspan > 1 && (
                              <Chip
                                label={`rowspan: ${rowspan}`}
                                size="small"
                                color="secondary"
                                sx={{
                                  position: "absolute",
                                  top: colspan > 1 ? 24 : 4,
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

        {template.reportData.rows.length === 0 && template.reportData.columns.length > 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add rows from the left panel
            </Typography>
            <Typography variant="caption">Start building your report structure</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

