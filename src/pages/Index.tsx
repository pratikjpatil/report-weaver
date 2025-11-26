import { useState } from "react";
import { TemplateBuilder } from "@/components/report-builder/TemplateBuilder";
import { FileText, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<any>(null);

  const handleExportJSON = () => {
    if (!template) {
      toast({
        title: "No template",
        description: "Please create a template first",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.meta?.reportName || "report"}-template.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template exported",
      description: "Your template has been downloaded as JSON",
    });
  };

  const handleSave = () => {
    if (!template) {
      toast({
        title: "No template",
        description: "Please create a template first",
        variant: "destructive",
      });
      return;
    }

    // TODO: Send to Spring Boot backend
    console.log("Saving template:", template);
    toast({
      title: "Template saved",
      description: "Your template has been saved successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Financial Report Builder</h1>
                <p className="text-sm text-muted-foreground">Design configurable report templates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleExportJSON} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <TemplateBuilder onTemplateChange={setTemplate} />
      </main>
    </div>
  );
};

export default Index;
