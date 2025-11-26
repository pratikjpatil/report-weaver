import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";

interface TopToolbarProps {
  onExport: () => void;
  onSave: () => void;
  reportName: string;
}

export const TopToolbar = ({ onExport, onSave, reportName }: TopToolbarProps) => {
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: "1px solid #e0e0e0" }}>
      <Toolbar>
        <IconButton edge="start" color="primary" sx={{ mr: 2 }}>
          <TableChartIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {reportName || "Financial Report Builder"}
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExport}
            size="small"
          >
            Export JSON
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            size="small"
          >
            Save Template
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
