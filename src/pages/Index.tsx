import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { ReportCanvas } from "@/components/jasper-editor/ReportCanvas";
import { TopToolbar } from "@/components/jasper-editor/TopToolbar";
import { LeftPanel } from "@/components/jasper-editor/LeftPanel";
import { RightPanel } from "@/components/jasper-editor/RightPanel";
import { useToast } from "@/hooks/use-toast";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#2c8aa8",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

const Index = () => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<any>({
    templateMeta: {
      templateId: "1018404",
      version: "v1",
      pageSize: "A4",
      pageOrientation: "portrait",
    },
    reportMeta: {
      reportName: "",
      reportId: "",
      extras: [
        { name: "Report Date", value: new Date().toISOString().split("T")[0] },
      ],
    },
    reportData: {
      columns: [],
      rows: [],
    },
  });

  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    cellIndex: number;
  } | null>(null);

  const [formulaMode, setFormulaMode] = useState(false);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.reportMeta?.reportName || "report"}-template.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template exported",
      description: "Your template has been downloaded as JSON",
    });
  };

  const handleSave = () => {
    console.log("Saving template:", template);
    toast({
      title: "Template saved",
      description: "Your template has been saved successfully",
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <TopToolbar
          onExport={handleExportJSON}
          onSave={handleSave}
          reportName={template.reportMeta.reportName}
        />

        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <LeftPanel template={template} onTemplateChange={setTemplate} />

          <ReportCanvas
            template={template}
            onTemplateChange={setTemplate}
            selectedCell={selectedCell}
            onCellSelect={setSelectedCell}
            formulaMode={formulaMode}
          />

          <RightPanel
            template={template}
            onTemplateChange={setTemplate}
            selectedCell={selectedCell}
            formulaMode={formulaMode}
            onFormulaModeChange={setFormulaMode}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Index;
