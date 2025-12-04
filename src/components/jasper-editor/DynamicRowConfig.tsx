import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import OutlinedInput from "@mui/material/OutlinedInput";
import { FilterBuilder } from "./FilterBuilder";

interface DynamicRowConfigProps {
  dynamicConfig: any;
  onConfigChange: (config: any) => void;
}

export const DynamicRowConfig = ({
  dynamicConfig,
  onConfigChange,
}: DynamicRowConfigProps) => {
  const updateConfig = (field: string, value: any) => {
    onConfigChange({ ...dynamicConfig, [field]: value });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        DYNAMIC ROW CONFIGURATION
      </Typography>

      <FormControl size="small" fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          value={dynamicConfig.type || "DB_LIST"}
          onChange={(e) => updateConfig("type", e.target.value)}
          label="Type"
        >
          <MenuItem value="DB_LIST">Database List</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Table"
        size="small"
        value={dynamicConfig.table || ""}
        onChange={(e) => updateConfig("table", e.target.value)}
        placeholder="e.g., GL_BALANCE"
        fullWidth
      />

      <FormControl size="small" fullWidth>
        <InputLabel>Select Columns</InputLabel>
        <Select
          multiple
          value={dynamicConfig.select || []}
          onChange={(e) => updateConfig("select", e.target.value)}
          input={<OutlinedInput label="Select Columns" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          <MenuItem value="ID">ID</MenuItem>
          <MenuItem value="BALANCE">BALANCE</MenuItem>
          <MenuItem value="CURRENCY">CURRENCY</MenuItem>
          <MenuItem value="BALANCE_DATE">BALANCE_DATE</MenuItem>
          <MenuItem value="BRANCH_CODE">BRANCH_CODE</MenuItem>
          <MenuItem value="GL_CODE">GL_CODE</MenuItem>
          <MenuItem value="AMOUNT">AMOUNT</MenuItem>
        </Select>
      </FormControl>

      <FilterBuilder
        filters={dynamicConfig.filters || {}}
        onFiltersChange={(filters) => updateConfig("filters", filters)}
      />

      <TextField
        label="Order By"
        size="small"
        value={dynamicConfig.orderby || ""}
        onChange={(e) => updateConfig("orderby", e.target.value)}
        placeholder="e.g., BALANCE_DATE DESC"
        fullWidth
      />

      <TextField
        label="Limit"
        type="number"
        size="small"
        value={dynamicConfig.limit || ""}
        onChange={(e) => updateConfig("limit", parseInt(e.target.value) || "")}
        placeholder="e.g., 100"
        fullWidth
      />

      <Box sx={{ p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1 }}>
        <Typography variant="caption" color="primary.dark">
          <strong>Note:</strong> Dynamic rows will fetch data from the database and generate multiple rows based on the query results. Each row will populate cells with the selected columns.
        </Typography>
      </Box>
    </Box>
  );
};
